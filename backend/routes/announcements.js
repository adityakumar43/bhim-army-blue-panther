import { Router } from 'express'
import Announcement from '../models/Announcement.js'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()



// India Standard Time is UTC+5:30 all year (there is no daylight saving)
const IST_OFFSET = 330 * 60 * 1000

// Today's date in India, as a date at 00:00 UTC. That is the same form the start and end dates are saved in,
// so "today" in India is compared with them directly.
export function istToday(now = new Date()) {
  const t = new Date(now.getTime() + IST_OFFSET)
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()))
}

// "Showing now": its start day has come (or there is none) and its end day has not passed (or there is none).
// Days change at 12:00 am India time, and the end day counts as a full day.
export function liveFilter(now = new Date()) {
  const today = istToday(now)
  return {
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: today } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: today } }] },
    ],
  }
}

function statusOf(a, now = new Date()) {
  const today = istToday(now)
  if (a.startsAt && a.startsAt > today) return 'scheduled'
  if (a.endsAt && a.endsAt < today) return 'expired'
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