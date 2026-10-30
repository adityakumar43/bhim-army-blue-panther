import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import PushSubscription from '../models/PushSubscription.js'
import PushSend from '../models/PushSend.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { pushReady, pushTo, runPush } from '../services/push.js'

const router = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many tries. Please try again later.' } })

// A real push address: https, from the browser's own push service, not too long
const validSub = (s) =>
    s && typeof s.endpoint === 'string' && /^https:\/\/[^\s]{10,990}$/.test(s.endpoint) &&
    typeof s.keys?.p256dh === 'string' && s.keys.p256dh.length <= 200 && typeof s.keys?.auth === 'string' && s.keys.auth.length <= 100

// ----- Public -----

// The public key the browser needs to turn notifications on
router.get('/key', (req, res) => {
    if (!pushReady()) return res.status(503).json({ message: 'Notifications are not available yet' })
    res.json({ key: process.env.VAPID_PUBLIC_KEY })
})

router.post('/subscribe', limiter, async (req, res) => {
    const s = req.body?.subscription
    if (!validSub(s)) return res.status(400).json({ message: 'Could not turn on notifications' })
    const lang = req.body?.lang === 'en' ? 'en' : 'hi'
    await PushSubscription.updateOne(
        { endpoint: s.endpoint },
        { $set: { keys: { p256dh: s.keys.p256dh, auth: s.keys.auth }, lang, failures: 0 } },
        { upsert: true }
    )
    res.status(201).json({ ok: true })
})

router.post('/unsubscribe', limiter, async (req, res) => {
    const endpoint = String(req.body?.endpoint || '')
    if (endpoint) await PushSubscription.deleteOne({ endpoint })
    res.json({ ok: true })
})

// ----- Team (people who publish news and events) -----

// Where a tap may lead: a page of this website only
function cleanUrl(value) {
    const site = (process.env.CLIENT_URL || '').replace(/\/+$/, '')
    let url = String(value || '/').trim()
    if (site && url.startsWith(site)) url = url.slice(site.length) || '/'
    return /^\/[^\s]{0,300}$/.test(url) && !url.startsWith('//') ? url : null
}

function message(body) {
    const title = String(body?.title || '').trim()
    const text = String(body?.body || '').trim()
    const url = cleanUrl(body?.url)
    if (!title) return { problem: 'Write a title' }
    if (title.length > 80) return { problem: 'Keep the title under 80 letters' }
    if (text.length > 200) return { problem: 'Keep the message under 200 letters' }
    if (!url) return { problem: 'The link must be a page of this website, like /news' }
    return { title, body: text, url }
}

router.get('/count', protect, requirePermission('content'), async (req, res) => {
    res.json({ ready: pushReady(), count: await PushSubscription.countDocuments() })
})

router.get('/', protect, requirePermission('content'), async (req, res) => {
    res.json(await PushSend.find().sort({ createdAt: -1 }).limit(30))
})

// Try it on the device the admin is using (it must have notifications turned on)
router.post('/test', protect, requirePermission('content'), async (req, res) => {
    const m = message(req.body)
    if (m.problem) return res.status(400).json({ message: m.problem })
    if (!pushReady()) return res.status(503).json({ message: 'Phone notifications are not set up on the server yet' })
    const sub = await PushSubscription.findOne({ endpoint: String(req.body?.endpoint || '') })
    if (!sub) return res.status(400).json({ message: 'Turn on notifications on this device first' })
    const result = await pushTo(sub, { ...m, tag: 'test' })
    if (result !== 'sent') return res.status(502).json({ message: 'The test could not be delivered. Turn notifications off and on again on this device.' })
    res.json({ ok: true })
})

router.post('/', protect, requirePermission('content'), async (req, res) => {
    const m = message(req.body)
    if (m.problem) return res.status(400).json({ message: m.problem })
    if (!pushReady()) return res.status(503).json({ message: 'Phone notifications are not set up on the server yet' })
    const total = await PushSubscription.countDocuments()
    if (!total) return res.status(400).json({ message: 'Nobody has turned on notifications yet' })
    // One at a time, so the same message is not sent twice by a double click
    const busy = await PushSend.findOne({ status: 'sending', createdAt: { $gt: new Date(Date.now() - 10 * 60e3) } })
    if (busy) return res.status(409).json({ message: 'A notification is still being sent. Please wait a moment.' })
    const ps = await PushSend.create({ ...m, total, byName: req.admin.name, byId: req.admin._id })
    runPush(ps._id).catch((err) => {
        console.error('Notification send failed:', err.message)
        PushSend.updateOne({ _id: ps._id }, { $set: { status: 'stopped', note: err.message, finishedAt: new Date() } }).catch(() => { })
    })
    res.status(201).json(ps)
})

router.post('/:id/stop', protect, requirePermission('content'), async (req, res) => {
    await PushSend.updateOne({ _id: req.params.id, status: 'sending' }, { $set: { status: 'stopped', note: `Stopped by ${req.admin.name}`, finishedAt: new Date() } }).catch(() => null)
    res.json({ ok: true })
})

export default router