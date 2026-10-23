import { Router } from 'express'
import Announcement from '../models/Announcement.js'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()

const dayStart = (d) => {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

// "Showing now": already started (or no start date) and not yet ended (or no end date).
// The end date counts as a full day.
export function liveFilter(now = new Date()) {
  return {
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: dayStart(now) } }] },
    ],
  }
}

function statusOf(a, now = new Date()) {
  if (a.startsAt && a.startsAt > now) return 'scheduled'
  if (a.endsAt && a.endsAt < dayStart(now)) return 'expired'
  return 'live'
}

// "2026-11-05" becomes a date, empty gives null, anything else gives undefined (not valid)
function parseDay(value) {
  const s = String(value ?? '').trim()
  if (!s) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const d = new Date(`${s}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? undefined : d // catches 2026-02-30
}

const LINK = /^(\/(?!\/)\S*|https?:\/\/\S+)$/ // an on-site path or a web address, nothing else

function read(body) {
  const textHi = String(body.textHi ?? '').trim()
  const textEn = String(body.textEn ?? '').trim()
  if (!textHi && !textEn) return { error: 'Write the update in Hindi or English' }
  if (textHi.length > 200 || textEn.length > 200) return { error: 'Each text can be up to 200 characters' }
  const link = String(body.link ?? '').trim()
  if (link && !LINK.test(link)) return { error: 'Link must start with / or https://' }
  const startsAt = parseDay(body.startsAt)
  const endsAt = parseDay(body.endsAt)
  if (startsAt === undefined || endsAt === undefined) return { error: 'Dates must look like 2026-11-05' }
  if (startsAt && endsAt && endsAt < startsAt) return { error: 'The end date is before the start date' }
  return { data: { textHi, textEn, link, important: body.important === true || body.important === 'true', startsAt, endsAt } }
}

// Public: what visitors see on the Home page. Only the fields the page needs.
router.get('/current', async (req, res) => {
  const items = await Announcement.find(liveFilter()).sort({ important: -1, createdAt: -1 }).limit(10)
  res.json(items.map((a) => ({ _id: a._id, textHi: a.textHi, textEn: a.textEn, link: a.link, important: a.important })))
})

// Admin: everything, including updates that are scheduled or have ended
router.get('/', protect, requirePermission('content'), async (req, res) => {
  const now = new Date()
  const items = await Announcement.find().sort({ createdAt: -1 }).limit(200)
  res.json(items.map((a) => ({ ...a.toObject(), status: statusOf(a, now) })))
})

router.post('/', protect, requirePermission('content'), async (req, res) => {
  const { data, error } = read(req.body || {})
  if (error) return res.status(400).json({ message: error })
  res.status(201).json(await Announcement.create(data))
})

router.put('/:id', protect, requirePermission('content'), async (req, res) => {
  const { data, error } = read(req.body || {})
  if (error) return res.status(400).json({ message: error })
  const item = await Announcement.findByIdAndUpdate(req.params.id, data, { new: true }).catch(() => null)
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

router.delete('/:id', protect, requirePermission('content'), async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id).catch(() => null)
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json({ ok: true })
})

export default router