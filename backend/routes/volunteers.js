import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Volunteer, { SKILLS, AVAILABILITY, VOL_STATUSES } from '../models/Volunteer.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn } from '../config/stateNames.js'
import { notifyAdmin } from '../services/mailer.js'

const router = Router()
const cleanPhone = (v) => String(v || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Too many tries. Please try again later.' } })

// Public: sign up (the same mobile number again updates the details)
router.post('/', limiter, async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.status(201).json({ ok: true }) // bot trap
  const name = String(b.name || '').trim()
  const phone = cleanPhone(b.phone)
  const skills = [...new Set([].concat(b.skills || []).filter((s) => SKILLS.includes(s)))]
  if (!name) return res.status(400).json({ message: 'Please enter your name' })
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return res.status(400).json({ message: 'Enter a valid email address' })
  if (!STATE_CODES.includes(String(b.stateCode || ''))) return res.status(400).json({ message: 'Choose your state' })
  if (!skills.length) return res.status(400).json({ message: 'Choose at least one way you can help' })
  const data = {
    name: name.slice(0, 100), email: b.email || undefined, stateCode: b.stateCode, state: stateNameEn(b.stateCode),
    district: String(b.district || '').trim().slice(0, 100), skills,
    availability: AVAILABILITY.includes(b.availability) ? b.availability : 'anytime',
    message: String(b.message || '').trim().slice(0, 500),
  }
  const existing = await Volunteer.findOne({ phone })
  if (existing) {
    await Volunteer.updateOne({ _id: existing._id }, data)
    return res.json({ ok: true, updated: true })
  }
  await Volunteer.create({ ...data, phone })
  notifyAdmin('New volunteer', `${data.name} (${phone}) from ${data.district ? data.district + ', ' : ''}${data.state} wants to help: ${skills.join(', ')}`)
  res.status(201).json({ ok: true })
})

// ----- Team (membership managers, state admins for their state, super admins) -----
const scoped = (req) => { const s = stateScope(req.admin); return s ? { stateCode: s } : {} }

router.get('/', protect, requirePermission('members'), async (req, res) => {
  const filter = { ...scoped(req) }
  if (VOL_STATUSES.includes(req.query.status)) filter.status = req.query.status
  if (SKILLS.includes(req.query.skill)) filter.skills = req.query.skill
  res.json(await Volunteer.find(filter).sort({ createdAt: -1 }).limit(2000))
})

router.patch('/:id', protect, requirePermission('members'), async (req, res) => {
  const v = await Volunteer.findOne({ _id: req.params.id, ...scoped(req) }).catch(() => null)
  if (!v) return res.status(404).json({ message: 'Not found' })
  const { status, note } = req.body || {}
  if (status !== undefined) {
    if (!VOL_STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown status' })
    v.status = status
  }
  if (note !== undefined) v.note = String(note).trim().slice(0, 1000)
  await v.save()
  res.json(v)
})

router.delete('/:id', protect, requirePermission('members'), async (req, res) => {
  const v = await Volunteer.findOneAndDelete({ _id: req.params.id, ...scoped(req) }).catch(() => null)
  if (!v) return res.status(404).json({ message: 'Not found' })
  res.json({ ok: true })
})

export default router