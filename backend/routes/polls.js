import { Router } from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import Poll from '../models/Poll.js'
import PollVote from '../models/PollVote.js'
import Member from '../models/Member.js'
import { protect, requirePermission, stateScope, sameDistrict } from '../middleware/auth.js'
import { STATE_CODES } from '../config/states.js'
import { codeFromName, stateNameEn } from '../config/stateNames.js'
import { canonicalDistrict } from '../config/districts.js'

// Polls: the team asks members a question; members answer on the website with their member number and mobile number
const router = Router()
const isId = (id) => mongoose.isValidObjectId(id)
const isOpen = (p) => !p.closed && (!p.closesAt || new Date(p.closesAt) > new Date())
const last10 = (v) => String(v || '').replace(/\D/g, '').slice(-10)

// How many chose each answer
async function results(poll) {
    const rows = await PollVote.aggregate([{ $match: { poll: poll._id } }, { $group: { _id: '$option', n: { $sum: 1 } } }])
    const counts = poll.options.map((_, i) => rows.find((r) => r._id === i)?.n || 0)
    return { counts, total: counts.reduce((a, b) => a + b, 0) }
}

// What the public website shows of a poll
const publicView = (p) => ({
    _id: p._id, questionHi: p.questionHi, questionEn: p.questionEn,
    options: p.options.map((o) => ({ textHi: o.textHi, textEn: o.textEn })),
    stateCode: p.stateCode || '', district: p.district || '', closesAt: p.closesAt || null, open: isOpen(p), showResults: p.showResults !== false,
})

// ----- Public -----

// Open polls, and polls closed in the last 30 days (with their results, if the team chose to show them)
router.get('/', async (req, res) => {
    const since = new Date(Date.now() - 30 * 864e5)
    const polls = await Poll.find({ $or: [{ closed: false }, { updatedAt: { $gte: since } }] }).sort({ createdAt: -1 }).limit(30).lean()
    const shown = polls.filter((p) => isOpen(p) || new Date(p.closesAt || p.updatedAt) >= since)
    res.json(await Promise.all(shown.map(async (p) => ({
        ...publicView(p),
        ...(!isOpen(p) && p.showResults !== false ? { results: await results(p) } : {}),
    }))))
})

const voteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many tries. Please wait 15 minutes and try again.', code: 'tooMany' } })

// A member answers. They prove they are a member with their member number and the mobile number they joined with.
router.post('/:id/vote', voteLimiter, async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Poll not found', code: 'notFound' })
    const poll = await Poll.findById(req.params.id).lean()
    if (!poll) return res.status(404).json({ message: 'Poll not found', code: 'notFound' })
    if (!isOpen(poll)) return res.status(400).json({ message: 'This poll is closed', code: 'closed' })

    const option = Number(req.body?.option)
    if (!Number.isInteger(option) || option < 0 || option >= poll.options.length) return res.status(400).json({ message: 'Choose an answer', code: 'noOption' })
    const memberNo = String(req.body?.memberNo || '').toUpperCase().replace(/\s+/g, '').slice(0, 30)
    const phone = last10(req.body?.phone)
    if (!memberNo || phone.length !== 10) return res.status(400).json({ message: 'Enter your member number and mobile number', code: 'missing' })

    const member = await Member.findOne({ memberNo, status: 'approved' }).lean()
    if (!member || last10(member.phone) !== phone) {
        return res.status(400).json({ message: 'The member number and mobile number do not match an active membership', code: 'notMember' })
    }
    const memberState = member.stateCode || codeFromName(member.state) || ''
    if ((poll.stateCode && memberState !== poll.stateCode) || (poll.district && !sameDistrict(poll.district).test(member.district || ''))) {
        return res.status(403).json({ message: 'This poll is only for members of another area', code: 'wrongArea' })
    }

    const showResults = poll.showResults !== false
    const already = await PollVote.findOne({ poll: poll._id, member: member._id }).lean()
    if (already) return res.status(409).json({ message: 'You have already answered this poll', code: 'already', option: already.option, ...(showResults ? { results: await results(poll) } : {}) })

    try {
        await PollVote.create({ poll: poll._id, member: member._id, option, stateCode: memberState, district: member.district || '' })
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'You have already answered this poll', code: 'already' })
        throw err
    }
    res.json({ ok: true, name: member.name, option, ...(showResults ? { results: await results(poll) } : {}) })
})

// ----- Admin (Members permission: Super admins and Membership managers for all; State admins for their own state) -----

const admin = Router()
admin.use(protect, requirePermission('members'))
const scoped = (req) => { const s = stateScope(req.admin); return s ? { stateCode: s } : {} }

admin.get('/', async (req, res) => {
    const polls = await Poll.find(scoped(req)).sort({ createdAt: -1 }).limit(200).lean()
    res.json(await Promise.all(polls.map(async (p) => ({ ...p, open: isOpen(p), total: (await results(p)).total }))))
})

admin.post('/', async (req, res) => {
    const b = req.body || {}
    const questionHi = String(b.questionHi || '').trim()
    const questionEn = String(b.questionEn || '').trim()
    if (!questionHi && !questionEn) return res.status(400).json({ message: 'Write the question in Hindi or English' })
    const options = (Array.isArray(b.options) ? b.options : [])
        .map((o) => ({ textHi: String(o?.textHi || '').trim(), textEn: String(o?.textEn || '').trim() }))
        .filter((o) => o.textHi || o.textEn)
    if (options.length < 2 || options.length > 6) return res.status(400).json({ message: 'Give 2 to 6 answers' })

    // State admins can only ask the members of their own state
    const scope = stateScope(req.admin)
    const stateCode = scope || (STATE_CODES.includes(b.stateCode) ? b.stateCode : '')
    let district = ''
    if (b.district) {
        if (!stateCode) return res.status(400).json({ message: 'Choose the state of the district' })
        district = canonicalDistrict(stateCode, b.district) || ''
        if (!district) return res.status(400).json({ message: 'Choose a district from the list' })
    }
    let closesAt = null
    if (b.closesAt) {
        closesAt = new Date(b.closesAt)
        if (Number.isNaN(closesAt.getTime()) || closesAt <= new Date()) return res.status(400).json({ message: 'The closing time must be in the future' })
    }

    const poll = await Poll.create({
        questionHi, questionEn, options, stateCode, district, closesAt, showResults: b.showResults !== false,
        createdById: req.admin._id, createdByName: req.admin.name,
    })
    res.status(201).json(poll)
})

// The results: overall, by state and by district
admin.get('/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const poll = await Poll.findOne({ _id: req.params.id, ...scoped(req) }).lean()
    if (!poll) return res.status(404).json({ message: 'Not found' })
    const votes = await PollVote.find({ poll: poll._id }).select('option stateCode district').lean()
    const group = (keyOf) => {
        const map = {}
        for (const v of votes) {
            const key = keyOf(v) || 'Not given'
                ; (map[key] ||= poll.options.map(() => 0))[v.option] += 1
        }
        return Object.entries(map).map(([key, counts]) => ({ key, counts, total: counts.reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total)
    }
    res.json({
        poll: { ...poll, open: isOpen(poll) }, ...(await results(poll)),
        byState: group((v) => stateNameEn(v.stateCode) || v.stateCode),
        byDistrict: group((v) => [v.district, stateNameEn(v.stateCode)].filter(Boolean).join(', ')),
    })
})

// Close a poll now (or open it again)
admin.patch('/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const poll = await Poll.findOne({ _id: req.params.id, ...scoped(req) })
    if (!poll) return res.status(404).json({ message: 'Not found' })
    if (typeof req.body?.closed === 'boolean') {
        poll.closed = req.body.closed
        if (!poll.closed && poll.closesAt && poll.closesAt <= new Date()) poll.closesAt = null // opening again: no closing time
    }
    await poll.save()
    res.json({ ...poll.toObject?.() ?? poll, open: isOpen(poll) })
})

admin.delete('/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    const poll = await Poll.findOne({ _id: req.params.id, ...scoped(req) })
    if (!poll) return res.status(404).json({ message: 'Not found' })
    await PollVote.deleteMany({ poll: poll._id })
    await poll.deleteOne()
    res.json({ ok: true })
})

router.use('/admin', admin)
export default router