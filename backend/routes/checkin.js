import { Router } from 'express'
import mongoose from 'mongoose'
import Checkin from '../models/Checkin.js'
import Member from '../models/Member.js'
import { Event } from '../models/Content.js'
import { protect, requireAny } from '../middleware/auth.js'
import { stateNameEn } from '../config/stateNames.js'

// Event check-in: at the gate, the team scans members' card QR codes (or types the member number or phone)
const router = Router()
router.use(protect, requireAny('members', 'content', 'district'))

const isId = (id) => mongoose.isValidObjectId(id)
const DAY = 864e5

// What the scanner shows about a member
const card = (m) => ({
    _id: m._id, name: m.name, memberNo: m.memberNo, photo: m.photo?.url || '',
    place: [m.district, stateNameEn(m.stateCode) || m.state].filter(Boolean).join(', '),
})

const counts = async (eventId) => {
    const rows = await Checkin.find({ event: eventId }).select('member guests').lean()
    const members = rows.filter((r) => r.member).length
    const guests = rows.reduce((s, r) => s + (r.member ? 0 : r.guests || 0), 0)
    return { members, guests, total: members + guests }
}

async function findEvent(req, res) {
    if (!isId(req.params.eventId)) { res.status(404).json({ message: 'Event not found' }); return null }
    const event = await Event.findById(req.params.eventId).select('titleHi titleEn date time location').lean()
    if (!event) res.status(404).json({ message: 'Event not found' })
    return event
}

// Events to check people in at: from two weeks ago to two months ahead, nearest first, with how many came
router.get('/events', async (req, res) => {
    const now = Date.now()
    const events = await Event.find({ date: { $gte: new Date(now - 14 * DAY), $lte: new Date(now + 60 * DAY) } })
        .select('titleHi titleEn date time location').sort({ date: 1 }).limit(100).lean()
    const ids = events.map((e) => e._id)
    const rows = await Checkin.find({ event: { $in: ids } }).select('event member guests').lean()
    const tally = {}
    for (const r of rows) {
        const t = (tally[String(r.event)] ||= { members: 0, guests: 0 })
        if (r.member) t.members += 1
        else t.guests += r.guests || 0
    }
    res.json(events.map((e) => ({ ...e, ...(tally[String(e._id)] || { members: 0, guests: 0 }) })))
})

// One event: who came (newest first), and how many from each district
router.get('/:eventId', async (req, res) => {
    const event = await findEvent(req, res)
    if (!event) return
    const list = await Checkin.find({ event: event._id }).sort({ createdAt: -1 }).limit(5000).lean()
    const byDistrict = {}
    for (const r of list) if (r.member) byDistrict[r.district || 'Not given'] = (byDistrict[r.district || 'Not given'] || 0) + 1
    res.json({
        event, ...(await counts(event._id)), list,
        byDistrict: Object.entries(byDistrict).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value),
    })
})

// Let a member in. code is what the QR code holds (the card link), the member number, or a phone number.
router.post('/:eventId', async (req, res) => {
    const event = await findEvent(req, res)
    if (!event) return
    const code = String(req.body?.code || '').trim().slice(0, 300)
    if (!code) return res.status(400).json({ message: 'Scan a card, or type a member number or phone number' })

    let member = null
    const token = code.match(/\/card\/([a-f0-9]{32})\b/i)?.[1] || (/^[a-f0-9]{32}$/i.test(code) ? code : null)
    if (token) member = await Member.findOne({ cardToken: token.toLowerCase() }).lean()
    else if (/^\+?[\d\s-]{10,15}$/.test(code)) {
        const phone = code.replace(/\D/g, '').slice(-10)
        const found = await Member.find({ phone: { $regex: `${phone}$` } }).limit(2).lean()
        if (found.length > 1) return res.status(400).json({ message: 'More than one member has this phone number. Use the member number.' })
        member = found[0] || null
    } else {
        const no = code.toUpperCase().replace(/\s+/g, '')
        member = await Member.findOne({ memberNo: no }).lean()
    }

    if (!member) return res.status(404).json({ message: 'No member found with this card or number', result: 'unknown' })
    if (member.status !== 'approved' || !member.memberNo) {
        const why = { pending: 'Their application is still waiting for approval', rejected: 'Their application was not approved', cancelled: 'This membership has ended' }
        return res.status(400).json({ message: why[member.status] || 'This membership is not active', result: 'inactive', member: card(member) })
    }

    const already = await Checkin.findOne({ event: event._id, member: member._id }).lean()
    if (already) return res.json({ result: 'already', at: already.createdAt, by: already.byName, member: card(member), ...(await counts(event._id)) })

    try {
        await Checkin.create({
            event: event._id, member: member._id, name: member.name, memberNo: member.memberNo,
            district: member.district, stateCode: member.stateCode, byId: req.admin._id, byName: req.admin.name,
        })
    } catch (err) {
        if (err.code !== 11000) throw err // two phones scanned the same card at the same moment: it is already in
    }
    res.json({ result: 'ok', member: card(member), ...(await counts(event._id)) })
})

// Guests who are not members: add a group of them (usually 1)
router.post('/:eventId/guests', async (req, res) => {
    const event = await findEvent(req, res)
    if (!event) return
    const guests = Math.round(Number(req.body?.count) || 1)
    if (guests < 1 || guests > 50) return res.status(400).json({ message: 'Add between 1 and 50 guests at a time' })
    await Checkin.create({ event: event._id, guests, byId: req.admin._id, byName: req.admin.name })
    res.json(await counts(event._id))
})

// Undo a check-in made by mistake
router.delete('/:eventId/:id', async (req, res) => {
    if (!isId(req.params.eventId) || !isId(req.params.id)) return res.status(404).json({ message: 'Not found' })
    await Checkin.deleteOne({ _id: req.params.id, event: req.params.eventId })
    res.json(await counts(req.params.eventId))
})

export default router