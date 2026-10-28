import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import Complaint, { CATEGORIES, STATUSES } from '../models/Complaint.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { can } from '../config/roles.js'
import { upload } from '../middleware/upload.js'
import { uploadImage, deleteImage } from '../config/cloudinary.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn } from '../config/stateNames.js'
import { notifyAdmin, sendMail } from '../services/mailer.js'

const router = Router()

const cleanPhone = (v) => String(v || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).replace(/-/g, '').slice(2)
// HD-261026-7KQ3: date + 4 letters/numbers that are easy to read out on the phone (no 0/O or 1/I)
const newRef = () => `HD-${today()}-${Array.from(crypto.randomBytes(4), (b) => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[b % 32]).join('')}`

const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Too many reports from this network. Please try again later.' } })
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many tries. Please wait 15 minutes.' } })

// ----- Public -----

router.post('/', reportLimiter, upload.single('photo'), async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.status(201).json({ refNo: 'HD-000000-0000' }) // bot trap
  const name = String(b.name || '').trim()
  const phone = cleanPhone(b.phone)
  const description = String(b.description || '').trim()
  if (!name) return res.status(400).json({ message: 'Please enter your name' })
  if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return res.status(400).json({ message: 'Enter a valid email address' })
  if (!STATE_CODES.includes(String(b.stateCode || ''))) return res.status(400).json({ message: 'Choose your state' })
  if (!CATEGORIES.includes(b.category)) return res.status(400).json({ message: 'Choose what the problem is about' })
  if (description.length < 20) return res.status(400).json({ message: 'Please describe what happened (at least 20 letters)' })
  if (description.length > 3000) return res.status(400).json({ message: 'Please keep the description under 3000 letters' })
  let incidentDate
  if (b.incidentDate) {
    incidentDate = new Date(`${b.incidentDate}T00:00:00Z`)
    if (Number.isNaN(incidentDate.getTime()) || incidentDate > new Date()) return res.status(400).json({ message: 'Check the date of the incident' })
  }

  const photo = req.file ? await uploadImage(req.file.buffer, 'bluepanther/helpdesk') : undefined
  const data = {
    name: name.slice(0, 100), phone, email: b.email || undefined, stateCode: b.stateCode, state: stateNameEn(b.stateCode),
    district: String(b.district || '').trim().slice(0, 100), category: b.category, incidentDate, description, photo,
  }
  // A reference number is random; try again in the rare case it already exists
  for (let i = 0; i < 5; i++) {
    try {
      const c = await Complaint.create({ ...data, refNo: newRef() })
      notifyAdmin(`New help desk case ${c.refNo}`, `${c.category} in ${c.district ? c.district + ', ' : ''}${c.state}\nFrom ${name} (${phone})\n\n${description.slice(0, 400)}`)
      // If they gave an email, send them their reference number so they don't lose it
      if (c.email) {
        const text = `Jai Bhim ${name},\n\nWe have received your complaint.\nYour reference number: ${c.refNo}\n\nUse this number with your mobile number on the Help desk page to check progress.\nIn an emergency, call 112.\n\n— Bhim Army Blue Panther`
        const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0a1a3f;line-height:1.6">
          <p>जय भीम <b>${name.replace(/[<>&"]/g, '')}</b>,</p>
          <p>आपकी शिकायत हमें मिल गई है। / We have received your complaint.</p>
          <p>संदर्भ संख्या / Reference number:<br><b style="font-size:22px;letter-spacing:2px;color:#0b3c9d">${c.refNo}</b></p>
          <p>इस संख्या और अपने मोबाइल नंबर से सहायता केंद्र पेज पर प्रगति देखें।<br>Use this number with your mobile number on the Help desk page to check progress.</p>
          <p style="color:#b91c1c">आपात स्थिति में 112 पर कॉल करें। / In an emergency, call 112.</p>
          <p>— Bhim Army Blue Panther</p></div>`
        sendMail({ to: c.email, subject: `Your complaint reference number: ${c.refNo}`, text, html })
          .catch((err) => console.error('Help desk email failed:', err.message))
      }
      return res.status(201).json({ refNo: c.refNo })
    } catch (err) {
      if (err.code !== 11000) {
        if (photo) await deleteImage(photo.publicId)
        throw err
      }
    }
  }
  throw new Error('Could not create a reference number')
})

// Track a complaint with its reference number and the phone number used
router.post('/track', trackLimiter, async (req, res) => {
  const refNo = String(req.body?.refNo || '').trim().toUpperCase()
  const phone = cleanPhone(req.body?.phone)
  const c = refNo && /^[6-9]\d{9}$/.test(phone) ? await Complaint.findOne({ refNo, phone }) : null
  if (!c) return res.status(404).json({ message: 'No complaint found with this reference number and mobile number.' })
  res.json({ refNo: c.refNo, status: c.status, category: c.category, createdAt: c.createdAt, updatedAt: c.updatedAt, publicNote: c.publicNote || '' })
})

// ----- Team -----

// State admins only see their own state
const scoped = (req) => { const s = stateScope(req.admin); return s ? { stateCode: s } : {} }

router.get('/', protect, requirePermission('helpdesk'), async (req, res) => {
  const filter = { ...scoped(req) }
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category
  res.json(await Complaint.find(filter).sort({ createdAt: -1 }).limit(500))
})

router.patch('/:id', protect, requirePermission('helpdesk'), async (req, res) => {
  const c = await Complaint.findOne({ _id: req.params.id, ...scoped(req) }).catch(() => null)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const { status, publicNote, note } = req.body || {}
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown status' })
    c.status = status
  }
  if (publicNote !== undefined) c.publicNote = String(publicNote).trim().slice(0, 1000)
  if (note && String(note).trim()) c.notes.push({ text: String(note).trim().slice(0, 2000), byName: req.admin.name })
  await c.save()
  res.json(c)
})

// Only super admins can delete a case completely
router.delete('/:id', protect, requirePermission('helpdesk'), async (req, res) => {
  if (!can(req.admin.role, 'admins')) return res.status(403).json({ message: 'Only a super admin can delete a case' })
  const c = await Complaint.findByIdAndDelete(req.params.id).catch(() => null)
  if (!c) return res.status(404).json({ message: 'Not found' })
  await deleteImage(c.photo?.publicId)
  res.json({ ok: true })
})

export default router