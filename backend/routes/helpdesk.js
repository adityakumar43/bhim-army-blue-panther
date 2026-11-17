import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import Complaint, { CATEGORIES, STATUSES } from '../models/Complaint.js'
import Admin from '../models/Admin.js'
import { protect, requirePermission, requireAny, stateScope, districtScope, sameDistrict } from '../middleware/auth.js'
import { can, ROLES } from '../config/roles.js'
import { helpdeskUpload } from '../middleware/upload.js'
import { uploadImage, uploadAudio, deleteImage } from '../config/cloudinary.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn } from '../config/stateNames.js'
import { canonicalDistrict } from '../config/districts.js'
import { notifyAdmin, sendMail } from '../services/mailer.js'
import { complaintReceivedEmail } from '../services/emails.js'
import { cursorOf, after, pageSize, NEWEST, withFind } from '../services/paging.js'

const router = Router()

const cleanPhone = (v) => String(v || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).replace(/-/g, '').slice(2)
// HD-261026-7KQ3: date + 4 letters/numbers that are easy to read out on the phone (no 0/O or 1/I)
const newRef = () => `HD-${today()}-${Array.from(crypto.randomBytes(4), (b) => '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'[b % 32]).join('')}`

const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { message: 'Too many reports from this network. Please try again later.' } })
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many tries. Please wait 15 minutes.' } })

// ----- Public -----

// Checks a report (the Help desk page's, or a paper complaint form typed in by the team) and tidies it.
// Gives { error } with the message to show, or { data } ready to save. paper: there is no voice message, and the
// tick means "the person signed the consent on the paper form".
function readReport(b, { paper = false, hasVoice = false } = {}) {
  const name = String(b.name || '').trim()
  const phone = cleanPhone(b.phone)
  const description = String(b.description || '').trim()
  if (!name) return { error: paper ? "Enter the person's name" : 'Please enter your name' }
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: 'Enter a valid 10-digit mobile number' }
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return { error: 'Enter a valid email address' }
  if (!STATE_CODES.includes(String(b.stateCode || ''))) return { error: paper ? 'Choose the state' : 'Choose your state' }
  if (!CATEGORIES.includes(b.category)) return { error: 'Choose what the problem is about' }
  // The district is optional, but must come from the state's list (saved in the list's spelling)
  const district = b.district ? canonicalDistrict(b.stateCode, b.district) : ''
  if (district === null) return { error: 'Please choose the district from the list' }
  const agreed = b.consent === true || b.consent === 'true' // the "I agree" tick box
  if (!agreed) return { error: paper ? 'Tick the box to confirm the person signed the consent on the paper form' : 'Please tick the box to agree to the Privacy Policy' }

  // A voice message can take the place of the written description (only on the Help desk page)
  if (!hasVoice && description.length < 20) {
    return { error: paper ? 'Type in what happened from the paper form (at least 20 letters)' : 'Please describe what happened (at least 20 letters), or record a voice message' }
  }
  if (description.length > 3000) return { error: 'Please keep the description under 3000 letters' }
  // When it happened: the month and year are required, the day only if the person remembers it ("2026-03" or "2026-03-14")
  const when = String(b.incidentDate || '')
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(when)) return { error: 'Choose the month and year of the incident' }
  const incidentDayKnown = when.length === 10
  const day = incidentDayKnown ? when : `${when}-01`
  const incidentDate = new Date(`${day}T00:00:00Z`)
  // A real date (JavaScript quietly turns 31 February into 3 March), not before 1950, and not later than today in India
  const indiaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  if (Number.isNaN(incidentDate.getTime()) || incidentDate.toISOString().slice(0, 10) !== day || when < '1950' || when > indiaToday.slice(0, when.length)) {
    return { error: 'Check the date of the incident' }
  }
  return {
    data: {
      name: name.slice(0, 100), phone, email: b.email || undefined, stateCode: b.stateCode, state: stateNameEn(b.stateCode),
      district, village: String(b.village || '').trim().slice(0, 100),
      policeStation: String(b.policeStation || '').trim().slice(0, 100), category: b.category, incidentDate, incidentDayKnown, description,
      history: [{ status: 'new' }],
      consentAt: new Date(),
    },
  }
}

// The District admin a new case from this district goes to (the longest-serving one), if there is one
const districtOwner = (stateCode, district) =>
  district ? Admin.findOne({ role: 'districtadmin', state: stateCode, district, active: true }).sort({ createdAt: 1 }) : null

// Saves a new case. The reference number is random; it is tried again in the rare case it already exists.
async function createCase(data) {
  for (let i = 0; i < 5; i++) {
    try {
      return await Complaint.create({ ...data, refNo: newRef() })
    } catch (err) {
      if (err.code !== 11000 || !err.keyPattern?.refNo) throw err
    }
  }
  throw new Error('Could not create a reference number')
}

// Tells everyone who should know about a new case: the District admin it was given to (unless they typed it in
// themselves), the admin alert address, and the person (their reference number, if they gave an email)
function announce(c, owner, { by } = {}) {
  const how = c.source === 'paper' ? ` (paper form${c.paperRef ? ` no. ${c.paperRef}` : ''}, typed in by ${c.addedByName})` : ''
  if (owner?.email && !(by && owner._id.equals(by._id))) {
    sendMail({
      to: owner.email,
      subject: `New help desk case ${c.refNo} in ${c.district}`,
      text: `A new help desk case from ${c.district} has been given to you${how}.\n\n${c.refNo} · ${c.category}\nFrom ${c.name} (${c.phone})\n\n${(c.description || '').slice(0, 400)}\n\nOpen the help desk: ${(process.env.CLIENT_URL || '').replace(/\/+$/, '')}/admin/helpdesk`,
    }).catch((err) => console.error('District case email failed:', err.message))
  }
  notifyAdmin(`New help desk case ${c.refNo}`, `${c.category} in ${c.district ? c.district + ', ' : ''}${c.state}${how}\nFrom ${c.name} (${c.phone})\n\n${(c.description || '').slice(0, 400)}`)
  // Only the reference number we made: nothing they typed is repeated, so the email cannot carry spam
  if (c.email) {
    sendMail({ to: c.email, ...complaintReceivedEmail(c.refNo) })
      .catch((err) => console.error('Help desk email failed:', err.message))
  }
}

router.post('/', reportLimiter, helpdeskUpload, async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.status(201).json({ refNo: 'HD-000000-0000' }) // bot trap
  const voiceFile = req.files?.voice?.[0]
  const { error, data } = readReport(b, { hasVoice: !!voiceFile })
  if (error) return res.status(400).json({ message: error })

  // Upload the photos and the voice message (if any) at the same time
  const [photos, voice] = await Promise.all([
    Promise.all((req.files?.photos || []).slice(0, 3).map((f) => uploadImage(f.buffer, 'bluepanther/helpdesk'))),
    voiceFile ? uploadAudio(voiceFile.buffer, 'bluepanther/helpdesk-voice') : undefined,
  ])
  if (voice) voice.seconds = Math.min(Math.max(Math.round(Number(b.voiceSeconds) || 0), 0), 600)
  // A case from a district that has a District admin goes straight to them
  const owner = await districtOwner(data.stateCode, data.district)
  let c
  try {
    c = await createCase({ ...data, photos, voice, assignedTo: owner ? { adminId: owner._id, name: owner.name } : undefined })
  } catch (err) {
    await Promise.all(photos.map((p) => deleteImage(p.publicId)))
    if (voice) await deleteImage(voice.publicId, 'video')
    throw err
  }
  announce(c, owner)
  res.status(201).json({ refNo: c.refNo })
})

// The team types in a paper complaint form (the printable form in Downloads), for someone without internet.
// Same checks as the Help desk page, but no hourly limit and no voice message; the photos are pictures of the
// form and of the papers that came with it. A State admin adds cases of their own state only, a District admin
// of their own district only (and the case is then theirs).
router.post('/paper', protect, requireAny('helpdesk', 'district'), helpdeskUpload, async (req, res) => {
  const b = req.body || {}
  const { error, data } = readReport(b, { paper: true })
  if (error) return res.status(400).json({ message: error })
  const scope = stateScope(req.admin)
  if (scope && data.stateCode !== scope) return res.status(403).json({ message: 'You can only add cases from your own state' })
  const area = districtScope(req.admin)
  if (area && !sameDistrict(area.district).test(data.district)) return res.status(403).json({ message: 'You can only add cases from your own district' })
  if (req.files?.voice?.length) return res.status(400).json({ message: 'A voice message cannot be added to a paper form' })

  // The same paper form typed in twice: say which case it already is (capitals and spaces around it do not count,
  // the same check as for a district name)
  const paperRef = String(b.paperRef || '').trim().slice(0, 40)
  if (paperRef) {
    const twin = await Complaint.findOne({ stateCode: data.stateCode, paperRef: sameDistrict(paperRef) }).select('refNo').lean()
    if (twin) return res.status(409).json({ message: `Paper form ${paperRef} was already typed in as case ${twin.refNo}` })
  }

  const photos = await Promise.all((req.files?.photos || []).slice(0, 3).map((f) => uploadImage(f.buffer, 'bluepanther/helpdesk')))
  const owner = area ? req.admin : await districtOwner(data.stateCode, data.district)
  let c
  try {
    c = await createCase({
      ...data, photos, urgent: b.urgent === true || b.urgent === 'true',
      assignedTo: owner ? { adminId: owner._id, name: owner.name } : undefined,
      source: 'paper', paperRef: paperRef || undefined, addedById: req.admin._id, addedByName: req.admin.name,
    })
  } catch (err) {
    await Promise.all(photos.map((p) => deleteImage(p.publicId))) // do not leave photos behind for a case that was not saved
    if (err.name === 'ValidationError') return res.status(400).json({ message: 'Some details are too long. Please shorten them.' })
    throw err
  }
  announce(c, owner, { by: req.admin })
  res.status(201).json(c)
})

// The updates the person sees. Cases from before the history was kept get a simple one made from what is known.
function timeline(c) {
  if (c.history?.length) return c.history
  const list = [{ status: 'new', at: c.createdAt }]
  if (c.status !== 'new' || c.publicNote) list.push({ status: c.status, note: c.publicNote, at: c.updatedAt })
  return list
}

// Track a complaint with its reference number and the phone number used
router.post('/track', trackLimiter, async (req, res) => {
  const refNo = String(req.body?.refNo || '').trim().toUpperCase()
  const phone = cleanPhone(req.body?.phone)
  const c = refNo && /^[6-9]\d{9}$/.test(phone) ? await Complaint.findOne({ refNo, phone }) : null
  if (!c) return res.status(404).json({ message: 'No complaint found with this reference number and mobile number.' })
  res.json({
    refNo: c.refNo, status: c.status, category: c.category, createdAt: c.createdAt, updatedAt: c.updatedAt, publicNote: c.publicNote || '',
    history: timeline(c).map((h) => ({ status: h.status, note: h.note || '', at: h.at })),
  })
})

// ----- Team -----

// State admins only see their own state
const scoped = (req) => {
  const s = stateScope(req.admin)
  const area = districtScope(req.admin) // District admins: only their district
  return area ? { stateCode: area.state, district: sameDistrict(area.district) } : s ? { stateCode: s } : {}
}

router.get('/', protect, requireAny('helpdesk', 'district'), async (req, res) => {
  const filter = { ...scoped(req) }
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status
  if (CATEGORIES.includes(req.query.category)) filter.category = req.query.category
  if (req.query.mine === '1') filter['assignedTo.adminId'] = req.admin._id
  if (req.query.urgent === '1') filter.urgent = true
  const found = (f) => withFind(f, req, ['refNo', 'name', 'phone', 'email', 'paperRef'])
  const c = cursorOf(req) // a page at a time
  if (c === false || (c && c.group === null)) return res.status(400).json({ message: 'Bad page' })
  const size = pageSize(req, 500)
  // Urgent cases first, then the rest, each newest first (two lists, so every page follows the same order)
  const rows = []
  if (!c || c.group === 1) rows.push(...await Complaint.find(after(found({ ...filter, urgent: true }), c)).sort(NEWEST).limit(size))
  if (rows.length < size && !filter.urgent) {
    rows.push(...await Complaint.find(after(found({ ...filter, urgent: { $ne: true } }), c?.group === 0 ? c : null)).sort(NEWEST).limit(size - rows.length))
  }
  res.json(rows)
})

// Team members a case can be given to. A state admin only sees the admins of their own state.
// A District admin sees only themselves (they can take a case); a State admin sees their state's State and District admins
const canHelp = [...Object.keys(ROLES).filter((r) => ROLES[r].includes('helpdesk')), 'districtadmin']
router.get('/team', protect, requireAny('helpdesk', 'district'), async (req, res) => {
  const scope = stateScope(req.admin)
  const filter = districtScope(req.admin) ? { _id: req.admin._id }
    : scope ? { role: { $in: ['stateadmin', 'districtadmin'] }, state: scope, active: true }
      : { role: { $in: canHelp }, active: true }
  const team = await Admin.find(filter).select('name role state district').sort({ name: 1 })
  res.json(team.map((a) => ({ _id: a._id, name: a.name, role: a.role, state: a.state, district: a.district || null })))
})

router.patch('/:id', protect, requireAny('helpdesk', 'district'), async (req, res) => {
  const c = await Complaint.findOne({ _id: req.params.id, ...scoped(req) }).catch(() => null)
  if (!c) return res.status(404).json({ message: 'Not found' })
  const { status, publicNote, note, urgent, assignedTo } = req.body || {}
  if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ message: 'Unknown status' })

  // Give the case to a team member (or take it away with an empty value)
  if (assignedTo !== undefined) {
    if (!assignedTo) c.assignedTo = undefined
    else {
      const a = await Admin.findById(assignedTo).catch(() => null)
      // A District admin can only handle cases of their own district
      const ofThisDistrict = a?.role === 'districtadmin' && a.state === c.stateCode && !!c.district && sameDistrict(a.district).test(c.district)
      if (!a || !a.active || !(can(a.role, 'helpdesk') || ofThisDistrict)) return res.status(400).json({ message: 'This team member cannot handle this case' })
      if (districtScope(req.admin) && !a._id.equals(req.admin._id)) return res.status(403).json({ message: 'You can only take a case yourself' })
      if (a.role === 'stateadmin' && a.state !== c.stateCode) return res.status(400).json({ message: `${a.name} looks after another state` })
      const scope = stateScope(req.admin)
      if (scope && a.state !== scope) return res.status(403).json({ message: 'You can only give cases to admins of your state' })
      c.assignedTo = { adminId: a._id, name: a.name }
    }
  }
  if (urgent !== undefined) c.urgent = !!urgent

  // What the person sees: a new line in their timeline when the status or the message changes
  const newStatus = status !== undefined && status !== c.status
  const newMessage = publicNote !== undefined && String(publicNote).trim().slice(0, 1000) !== (c.publicNote || '')
  if (newStatus || newMessage) {
    if (!c.history?.length) c.history = timeline(c).map((h) => ({ status: h.status, note: h.note, at: h.at }))
    if (newStatus) c.status = status
    if (newMessage) c.publicNote = String(publicNote).trim().slice(0, 1000)
    c.history.push({ status: c.status, note: newMessage ? c.publicNote : '', at: new Date() })
  }
  if (note && String(note).trim()) c.notes.push({ text: String(note).trim().slice(0, 2000), byName: req.admin.name })
  await c.save()
  res.json(c)
})

// Only super admins can delete a case completely
router.delete('/:id', protect, requirePermission('helpdesk'), async (req, res) => {
  if (!can(req.admin.role, 'admins')) return res.status(403).json({ message: 'Only a super admin can delete a case' })
  const c = await Complaint.findByIdAndDelete(req.params.id).catch(() => null)
  if (!c) return res.status(404).json({ message: 'Not found' })
  await Promise.all([c.photo, ...(c.photos || [])].map((p) => deleteImage(p?.publicId)))
  await deleteImage(c.voice?.publicId, 'video')
  res.json({ ok: true })
})

export default router