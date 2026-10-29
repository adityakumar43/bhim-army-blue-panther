import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Member from '../models/Member.js'
import Mailout from '../models/Mailout.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { STATE_CODES } from '../config/states.js'
import { sendMail } from '../services/mailer.js'
import { audience, mailoutEmail, runMailout } from '../services/mailout.js'

const router = Router()

// A State admin can only write to their own state's members
function target(req, q) {
    const scope = stateScope(req.admin)
    const stateCode = scope || (STATE_CODES.includes(String(q.state || '')) ? String(q.state) : '')
    const district = stateCode ? String(q.district || '').trim().slice(0, 100) : ''
    return { stateCode, district }
}
function readMessage(b) {
    const subject = String(b.subject || '').trim()
    const body = String(b.body || '').trim()
    if (!subject) return { error: 'Write a subject' }
    if (subject.length > 150) return { error: 'The subject can be up to 150 letters' }
    if (body.length < 10) return { error: 'Write the message (at least 10 letters)' }
    if (body.length > 5000) return { error: 'The message can be up to 5000 letters' }
    return { subject, body }
}

// How many members will get it
router.get('/count', protect, requirePermission('members'), async (req, res) => {
    const { stateCode, district } = target(req, req.query)
    res.json({ count: await Member.countDocuments(audience(stateCode, district)) })
})

// The districts members of a state have written, to choose from
router.get('/districts', protect, requirePermission('members'), async (req, res) => {
    const { stateCode } = target(req, req.query)
    if (!stateCode) return res.json([])
    const names = await Member.distinct('district', audience(stateCode, ''))
    const seen = new Map()
    for (const n of names) {
        const name = (n || '').trim()
        if (!name) continue
        // One entry per district, ignoring capitals; keep the spelling that starts with a capital letter
        const key = name.toLowerCase()
        if (!seen.has(key) || (seen.get(key) === key && name !== key)) seen.set(key, name)
    }
    res.json([...seen.values()].sort((a, b) => a.localeCompare(b)))
})

// Send it to yourself first, to see how it looks
router.post('/test', protect, requirePermission('members'), async (req, res) => {
    const msg = readMessage(req.body || {})
    if (msg.error) return res.status(400).json({ message: msg.error })
    const me = { name: req.admin.name, memberNo: 'TEST', cardToken: 'test' }
    try {
        if (!(await sendMail({ to: req.admin.email, ...mailoutEmail({ ...msg, subject: `[TEST] ${msg.subject}` }, me) }))) {
            return res.status(503).json({ message: 'Email is not set up on the server yet (SMTP settings in .env)' })
        }
    } catch (err) {
        return res.status(502).json({ message: `The mail server refused: ${err.message}` })
    }
    res.json({ to: req.admin.email })
})

// Past announcements (a State admin sees their own state's)
router.get('/', protect, requirePermission('members'), async (req, res) => {
    const scope = stateScope(req.admin)
    res.json(await Mailout.find(scope ? { stateCode: scope } : {}).sort({ createdAt: -1 }).limit(50))
})

// Send to members. It runs in the background; the page shows how far it has got.
router.post('/', protect, requirePermission('members'), async (req, res) => {
    const msg = readMessage(req.body || {})
    if (msg.error) return res.status(400).json({ message: msg.error })
    const { stateCode, district } = target(req, req.body || {})
    // One at a time. One that stopped moving for 10 minutes (the server restarted) no longer counts.
    const busy = await Mailout.findOne({ status: 'sending' })
    if (busy && Date.now() - new Date(busy.updatedAt).getTime() < 10 * 60 * 1000) {
        return res.status(409).json({ message: 'Another announcement is still being sent. Wait for it to finish or stop it.' })
    }
    if (busy) await Mailout.updateOne({ _id: busy._id }, { $set: { status: 'stopped', note: 'Stopped because the server restarted.', finishedAt: new Date() } })
    const total = await Member.countDocuments(audience(stateCode, district))
    if (!total) return res.status(400).json({ message: 'No members with an email address in this group' })
    const mo = await Mailout.create({ ...msg, stateCode, district, total, byName: req.admin.name, byId: req.admin._id })
    runMailout(mo._id).catch((err) => {
        console.error('Announcement stopped:', err.message)
        Mailout.updateOne({ _id: mo._id }, { $set: { status: 'stopped', note: 'Stopped by an error on the server.', finishedAt: new Date() } }).catch(() => { })
    })
    res.status(201).json(mo)
})

router.post('/:id/stop', protect, requirePermission('members'), async (req, res) => {
    const scope = stateScope(req.admin)
    const mo = await Mailout.findOneAndUpdate({ _id: req.params.id, status: 'sending', ...(scope ? { stateCode: scope } : {}) },
        { $set: { status: 'stopped', note: `Stopped by ${req.admin.name}.`, finishedAt: new Date() } }, { new: true }).catch(() => null)
    if (!mo) return res.status(404).json({ message: 'Not found or already finished' })
    res.json(mo)
})

// Public: the "stop these emails" link in every announcement
const stopLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many tries. Please try again later.' } })
router.post('/unsubscribe', stopLimiter, async (req, res) => {
    const token = String(req.body?.token || '')
    if (!/^[a-f0-9]{32}$/.test(token)) return res.status(404).json({ message: 'Link not valid' })
    const m = await Member.findOneAndUpdate({ cardToken: token }, { $set: { emailOptOut: true } }, { new: true })
    if (!m) return res.status(404).json({ message: 'Link not valid' })
    res.json({ ok: true, name: m.name })
})

export default router