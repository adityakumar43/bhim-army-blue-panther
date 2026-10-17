import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Member from '../models/Member.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { notifyAdmin } from '../services/mailer.js'
import QRCode from 'qrcode'
import { issueCard, sendWelcome, emailCard } from '../services/members.js'

const router = Router()

const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests from this network. Please try again later.' },
})


router.post('/', joinLimiter, async (req, res) => {
  const b = req.body || {}


  if (b.website) return res.status(201).json({ ok: true })

  const name = String(b.name || '').trim()
  const phone = String(b.phone || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
  if (!name) return res.status(400).json({ message: 'Please enter your name' })
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
  }
  if (!/^\S+@\S+\.\S+$/.test(String(b.email || '').trim())) {
    return res.status(400).json({ message: 'Enter a valid email address' })
  }

  try {
    await Member.create({
      name, phone,
      email: b.email, city: b.city, district: b.district, state: b.state, message: b.message,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This mobile number has already applied' })
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Some details are too long. Please shorten them.' })
    }
    throw err
  }
  notifyAdmin('New membership application', `${name} (${phone}) applied to join.`)
  res.status(201).json({ ok: true })
})


router.get('/', protect, requirePermission('members'), async (req, res) => {
  const filter = ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? { status: req.query.status }
    : {}
  res.json(await Member.find(filter).sort({ createdAt: -1 }).limit(1000))
})

router.patch('/:id/status', protect, requirePermission('members'), async (req, res) => {
  const { status } = req.body || {}
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }
  // Remember who decided and when, for the admin panel and the Excel download
  const who = status === 'pending'
    ? { reviewedAt: null, reviewedByName: null, reviewedById: null }
    : { reviewedAt: new Date(), reviewedByName: req.admin.name, reviewedById: req.admin._id }
  const member = await Member.findByIdAndUpdate(req.params.id, { status, ...who }, { new: true }).catch(() => null)
  if (!member) return res.status(404).json({ message: 'Not found' })
  if (status === 'approved') {
    // First approval: give the membership number and email the card. Approving again changes nothing.
    const { member: issued, isNew } = await issueCard(member._id)
    if (isNew) sendWelcome(issued)
    return res.json(issued)
  }
  res.json(member)
})

router.delete('/:id', protect, requirePermission('members'), async (req, res) => {
  const member = await Member.findByIdAndDelete(req.params.id).catch(() => null)
  if (!member) return res.status(404).json({ message: 'Not found' })
  res.json({ ok: true })
})

// Public card page data. The long random token is the key; phone and email are never returned.
// A rejected or deleted member's card stops working.
router.get('/card/:token', async (req, res) => {
  const m = await Member.findOne({ cardToken: req.params.token })
  if (!m || m.status !== 'approved' || !m.memberNo) return res.status(404).json({ message: 'Card not found' })
  const url = `${process.env.CLIENT_URL}/card/${m.cardToken}`
  res.json({
    memberNo: m.memberNo,
    name: m.name,
    since: m.approvedAt || m.createdAt,
    qr: await QRCode.toDataURL(url, { margin: 1, width: 240 }),
  })
})

// Email the card again (or for the first time, if the first email did not go out)
router.post('/:id/send-card', protect, requirePermission('members'), async (req, res) => {
  const found = await Member.findById(req.params.id).catch(() => null)
  if (!found || found.status !== 'approved') return res.status(404).json({ message: 'Approved member not found' })
  if (!found.email) return res.status(400).json({ message: 'This member did not give an email address. Use the WhatsApp button.' })
  const { member } = await issueCard(found._id)
  try {
    if (!(await emailCard(member))) return res.status(503).json({ message: 'Email is not set up on the server yet' })
  } catch (err) {
    console.error('Card email failed:', err.message)
    return res.status(502).json({ message: 'Could not send the email. Check the server email settings.' })
  }
  res.json({ ok: true })
})


export default router
