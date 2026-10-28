import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Member from '../models/Member.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn, codeFromName, memberInState, memberStateFilter } from '../config/stateNames.js'
import { notifyAdmin } from '../services/mailer.js'
import QRCode from 'qrcode'
import { upload } from '../middleware/upload.js'
import { uploadImage, deleteImage } from '../config/cloudinary.js'
import { issueCard, sendWelcome, emailCard } from '../services/members.js'

const router = Router()


// State admins may only touch members of their own state
const inMyState = (req, m) => { const scope = stateScope(req.admin); return !scope || memberInState(m, scope) }

// An optional whole number from 1 to 999. Empty gives undefined; anything else that is not a number gives null.
function parseConstituency(value) {
  const s = String(value ?? '').trim()
  if (!s) return undefined
  return /^\d{1,3}$/.test(s) && Number(s) > 0 ? Number(s) : null
}

// Members must be 18 or older: born on or before this day, 18 years ago (Indian date)
function isAdult(dob) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).split('-')
  return dob.toISOString().slice(0, 10) <= `${Number(y) - 18}-${m}-${d}`
}

// "2001-05-17" becomes a real date in the past, otherwise null
function parseDob(value) {
  const s = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null // catches 2026-02-30
  if (d > new Date() || d.getUTCFullYear() < 1900) return null
  return d
}

const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests from this network. Please try again later.' },
})


router.post('/', joinLimiter, upload.single('photo'), async (req, res) => {
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

  const dob = parseDob(b.dob)
  if (!dob) return res.status(400).json({ message: 'Enter your date of birth' })
  if (!isAdult(dob)) return res.status(400).json({ message: 'You must be 18 or older to become a member' })
  const agreed = b.consent === true || b.consent === 'true' // the "I agree" tick box
  if (!agreed) return res.status(400).json({ message: 'Please tick the box to agree to the Privacy Policy' })
  const assemblyNo = parseConstituency(b.assemblyNo)
  const lokSabhaNo = parseConstituency(b.lokSabhaNo)
  if (assemblyNo === null) return res.status(400).json({ message: 'Assembly constituency number must be a number, like 12' })
  if (lokSabhaNo === null) return res.status(400).json({ message: 'Lok Sabha constituency number must be a number, like 3' })
  if (!req.file) return res.status(400).json({ message: 'Please add your photo' })
  if (await Member.exists({ phone })) {
    return res.status(409).json({ message: 'This mobile number has already applied' })
  }

  // The state comes from the list on the Join form; older forms sent typed text
  const stateCode = STATE_CODES.includes(String(b.stateCode || '')) ? String(b.stateCode) : codeFromName(b.state)
  const state = stateCode ? stateNameEn(stateCode) : b.state

  const photo = await uploadImage(req.file.buffer, 'bluepanther/members')
  try {
    await Member.create({
      name, phone, dob, photo, assemblyNo, lokSabhaNo,
      email: b.email, city: b.city, district: b.district, state, stateCode: stateCode || undefined, message: b.message,
      consentAt: new Date(),
    })
  } catch (err) {
    await deleteImage(photo.publicId) // do not leave a photo behind for an application that was not saved
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

// Public: an applicant checks their own application with their mobile number and date of birth
const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many tries. Please wait 15 minutes and try again.' },
})

// Join form: has this mobile number already applied? (Sending the form would say the same, this only says it sooner.)
const checkLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many tries. Please try again later.' } })
router.get('/check', checkLimiter, async (req, res) => {
  const phone = String(req.query.phone || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
  if (!/^[6-9]\d{9}$/.test(phone)) return res.json({ applied: false })
  res.json({ applied: !!(await Member.exists({ phone })) })
})

router.post('/status', statusLimiter, async (req, res) => {
  const b = req.body || {}
  const phone = String(b.phone || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
  const dob = parseDob(b.dob)
  if (!/^[6-9]\d{9}$/.test(phone) || !dob) {
    return res.status(400).json({ message: 'Enter your 10-digit mobile number and date of birth' })
  }
  const m = await Member.findOne({ phone })
  // The same answer whether the number is unknown or the date is wrong, so nobody can find out who applied
  if (!m || !m.dob || m.dob.toISOString().slice(0, 10) !== dob.toISOString().slice(0, 10)) {
    return res.status(404).json({ message: 'We could not find an application with these details.' })
  }
  const approved = m.status === 'approved' && m.memberNo
  res.json({
    name: m.name,
    status: m.status,
    appliedAt: m.createdAt,
    reviewedAt: m.status === 'pending' ? null : m.reviewedAt,
    memberNo: approved ? m.memberNo : null,
    cardToken: approved ? m.cardToken : null,
  })
})


router.get('/', protect, requirePermission('members'), async (req, res) => {
  const filter = ['pending', 'approved', 'rejected', 'cancelled'].includes(req.query.status)
    ? { status: req.query.status }
    : {}
  const scope = stateScope(req.admin)
  if (scope) Object.assign(filter, memberStateFilter(scope))
  res.json(await Member.find(filter).sort({ createdAt: -1 }).limit(1000))
})

router.patch('/:id/status', protect, requirePermission('members'), async (req, res) => {
  const { status, reason } = req.body || {}
  if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  const who = status === 'pending'
    ? { reviewedAt: null, reviewedByName: null, reviewedById: null }
    : { reviewedAt: new Date(), reviewedByName: req.admin.name, reviewedById: req.admin._id }
  const found = await Member.findById(req.params.id).catch(() => null)
  if (!found || !inMyState(req, found)) return res.status(404).json({ message: 'Not found' })
  if (status === 'cancelled' && !found.memberNo) return res.status(400).json({ message: 'Only an approved member can have their membership ended' })
  const endReason = status === 'cancelled' ? String(reason || '').trim().slice(0, 300) : null
  const member = await Member.findByIdAndUpdate(found._id, { status, endReason, ...who }, { new: true })
  if (status === 'approved') {

    const { member: issued, isNew } = await issueCard(member._id)
    if (isNew) sendWelcome(issued)
    return res.json(issued)
  }
  res.json(member)
})

router.delete('/:id', protect, requirePermission('members'), async (req, res) => {
  const found = await Member.findById(req.params.id).catch(() => null)
  if (!found || !inMyState(req, found)) return res.status(404).json({ message: 'Not found' })
  const member = await Member.findByIdAndDelete(found._id)
  await deleteImage(member.photo?.publicId)
  res.json({ ok: true })
})


router.get('/card/:token', async (req, res) => {
  const m = await Member.findOne({ cardToken: req.params.token })
  if (!m || !m.memberNo) return res.status(404).json({ message: 'Card not found' })
  res.set('Cache-Control', 'no-store') // always check the latest status
  const url = `${process.env.CLIENT_URL}/card/${m.cardToken}`
  const base = {
    memberNo: m.memberNo,
    name: m.name,
    state: stateNameEn(m.stateCode) || m.state || '',
    since: m.approvedAt || m.createdAt,
    qr: await QRCode.toDataURL(url, { margin: 1, width: 240 }),
  }
  // Left or removed: the old card still opens, but says it is NOT valid (no photo shown)
  if (m.status !== 'approved') return res.json({ ...base, valid: false, endedAt: m.reviewedAt })
  res.json({ ...base, valid: true, photo: m.photo?.url })
})




router.post('/:id/send-card', protect, requirePermission('members'), async (req, res) => {
  const found = await Member.findById(req.params.id).catch(() => null)
  if (!found || found.status !== 'approved' || !inMyState(req, found)) return res.status(404).json({ message: 'Approved member not found' })
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
