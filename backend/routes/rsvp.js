import { Router } from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import Rsvp from '../models/Rsvp.js'
import { Event } from '../models/Content.js'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()
const isId = (id) => mongoose.isValidObjectId(id)

// Registration stays open until the end of the event day (Indian time)
const todayIndia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
const eventDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d))
const isOpen = (ev) => !ev.date || eventDay(ev.date) >= todayIndia()
const visible = (ev) => ev && ev.draft !== true && (!ev.publishAt || new Date(ev.publishAt) <= new Date())

const totals = async (eventId) => {
  const [t] = await Rsvp.aggregate([{ $match: { event: new mongoose.Types.ObjectId(eventId) } }, { $group: { _id: null, people: { $sum: '$people' }, n: { $sum: 1 } } }])
  return { people: t?.people || 0, registrations: t?.n || 0 }
}

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { message: 'Too many tries. Please try again later.' } })

// ----- Admin (content team) -----

// How many are coming to each event, for the admin list
router.get('/counts', protect, requirePermission('content'), async (req, res) => {
  const rows = await Rsvp.aggregate([{ $group: { _id: '$event', people: { $sum: '$people' }, n: { $sum: 1 } } }])
  res.json(Object.fromEntries(rows.map((r) => [String(r._id), { people: r.people, registrations: r.n }])))
})

// Everyone registered for one event
router.get('/:eventId/list', protect, requirePermission('content'), async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Not found' })
  res.json(await Rsvp.find({ event: req.params.eventId }).sort({ createdAt: 1 }).limit(5000))
})

router.delete('/:eventId/:id', protect, requirePermission('content'), async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' })
  const r = await Rsvp.findOneAndDelete({ _id: req.params.id, event: req.params.eventId })
  if (!r) return res.status(404).json({ message: 'Not found' })
  res.json({ ok: true })
})

// ----- Public -----

// "120 people are coming"
router.get('/:eventId', async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Not found' })
  const ev = await Event.findById(req.params.eventId)
  if (!visible(ev)) return res.status(404).json({ message: 'Not found' })
  res.json({ ...(await totals(ev._id)), open: isOpen(ev) })
})

router.post('/:eventId', limiter, async (req, res) => {
  if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Event not found' })
  const ev = await Event.findById(req.params.eventId)
  if (!visible(ev)) return res.status(404).json({ message: 'Event not found' })
  if (!isOpen(ev)) return res.status(400).json({ message: 'Registration for this event has closed.' })

  const b = req.body || {}
  if (b.website) return res.status(201).json({ ok: true }) // bot trap
  const name = String(b.name || '').trim()
  const phone = String(b.phone || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
  const people = b.people === undefined || b.people === '' ? 1 : Number(b.people)
  if (!name) return res.status(400).json({ message: 'Please enter your name' })
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
  if (!Number.isInteger(people) || people < 1 || people > 20) return res.status(400).json({ message: 'Number of people must be from 1 to 20' })

  const existing = await Rsvp.findOne({ event: ev._id, phone })
  const data = { name: name.slice(0, 100), district: String(b.district || '').trim().slice(0, 100), people }
  if (existing) await Rsvp.updateOne({ _id: existing._id }, data)
  else await Rsvp.create({ event: ev._id, phone, ...data })
  res.status(existing ? 200 : 201).json({ ok: true, updated: !!existing, ...(await totals(ev._id)) })
})

export default router