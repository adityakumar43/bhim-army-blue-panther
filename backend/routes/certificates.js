import { Router } from 'express'
import QRCode from 'qrcode'
import Certificate, { CERT_TYPES, TYPE_CODE, RELATIONS } from '../models/Certificate.js'
import Counter from '../models/Counter.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadImage } from '../config/cloudinary.js'
import { LETTER_DEFAULTS } from '../config/letterDefaults.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn } from '../config/stateNames.js'
import { ORG } from '../config/org.js'
import { sendMail } from '../services/mailer.js'

const router = Router()
const PREFIX = () => process.env.CERT_PREFIX || 'BBP'
const site = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
const linkFor = (c) => `${site()}/certificate/${c.token}`
const cleanPhone = (v) => String(v || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
const text = (v, max) => String(v ?? '').trim().slice(0, max)

const TITLES = {
  appointment: ['नियुक्ति पत्र', 'Appointment Letter'],
  appreciation: ['प्रशस्ति पत्र', 'Certificate of Appreciation'],
  participation: ['सहभागिता प्रमाण पत्र', 'Certificate of Participation'],
  letter: ['पत्र', 'Letter'],
}

class Bad extends Error { status = 400 }

// A date typed in the form (YYYY-MM-DD), saved as midnight UTC like dates of birth
function parseDay(v) {
  const s = String(v || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d
}
const indiaToday = () => parseDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()))

// Checks the form and returns the fields to save. `old` is the saved document when editing.
function clean(b, old, scope) {
  const has = (k) => b[k] !== undefined
  const out = {}
  const type = has('type') ? b.type : old?.type
  if (!CERT_TYPES.includes(type)) throw new Bad('Choose what to issue')
  if (!old) out.type = type

  for (const [k, max] of [['name', 100], ['guardian', 100], ['district', 100], ['post', 120], ['area', 120], ['reason', 300],
  ['signatoryName', 100], ['signatoryTitle', 150], ['address', 300], ['preamble', 2000], ['closing', 1000], ['copies', 1000],
  ['to', 500], ['subject', 300], ['salutation', 60], ['body', 6000], ['signOff', 60]]) {
    if (has(k)) out[k] = text(b[k], max)
  }
  if (has('showPhone')) out.showPhone = b.showPhone !== false && b.showPhone !== 'false'
  if (has('signatureUrl')) {
    out.signatureUrl = text(b.signatureUrl, 500)
    if (out.signatureUrl && !/^https:\/\/\S+$/.test(out.signatureUrl)) throw new Bad('The signature picture link is not valid')
  }
  if (has('letterhead')) {
    const lh = b.letterhead || {}
    out.letterhead = {
      leaders: [].concat(lh.leaders || []).slice(0, 3)
        .map((l) => ({ name: text(l?.name, 60), title: text(l?.title, 60), phone: text(l?.phone, 20) }))
        .filter((l) => l.name || l.title || l.phone),
      office: text(lh.office, 200),
    }
  }
  if (has('relation')) out.relation = RELATIONS.includes(b.relation) ? b.relation : ''
  if (has('phone')) {
    out.phone = cleanPhone(b.phone)
    if (out.phone && !/^[6-9]\d{9}$/.test(out.phone)) throw new Bad('Enter a valid 10-digit mobile number, or leave it empty')
  }
  if (has('email')) {
    out.email = text(b.email, 120).toLowerCase()
    if (out.email && !/^\S+@\S+\.\S+$/.test(out.email)) throw new Bad('Enter a valid email address, or leave it empty')
  }
  if (scope) {
    if (!old) Object.assign(out, { stateCode: scope, state: stateNameEn(scope) }) // State admins issue for their own state only
  } else if (has('stateCode')) {
    if (b.stateCode && !STATE_CODES.includes(b.stateCode)) throw new Bad('Choose a state from the list')
    out.stateCode = b.stateCode || undefined
    out.state = b.stateCode ? stateNameEn(b.stateCode) : ''
  }
  if (has('issueDate')) {
    out.issueDate = b.issueDate ? parseDay(b.issueDate) : indiaToday()
    if (!out.issueDate) throw new Bad('Choose a valid issue date')
  }
  if (has('validUntil')) {
    out.validUntil = b.validUntil ? parseDay(b.validUntil) : null
    if (b.validUntil && !out.validUntil) throw new Bad('Choose a valid "valid until" date')
  }

  const after = { ...(old?.toObject?.() || {}), ...out, type }
  if (type === 'letter') {
    if (!after.to) throw new Bad('Write who the letter is to (सेवा में)')
    if (!after.body) throw new Bad('Write the letter')
    // The first line of "सेवा में" names the letter in the list
    if (has('to')) after.name = out.name = after.to.split('\n')[0].replace(/,\s*$/, '').trim().slice(0, 100)
  }
  if (!after.name) throw new Bad('Enter the name')
  if (!after.issueDate) after.issueDate = out.issueDate = indiaToday()
  if (type === 'appointment' && !after.post) throw new Bad('Enter the post, like "District President"')
  if ((type === 'appreciation' || type === 'participation') && !after.reason) throw new Bad('Write what the certificate is for, like the event name')
  if (after.validUntil && after.validUntil < after.issueDate) throw new Bad('"Valid until" must be after the issue date')
  if (has('status')) {
    if (!['active', 'revoked'].includes(b.status)) throw new Bad('Unknown status')
    out.status = b.status
    out.revokedAt = b.status === 'revoked' ? new Date() : null
    out.revokeReason = b.status === 'revoked' ? text(b.revokeReason, 200) : ''
  }
  return out
}

async function nextRefNo(type, issueDate) {
  const year = issueDate.getUTCFullYear()
  const code = TYPE_CODE[type]
  const c = await Counter.findOneAndUpdate({ _id: `cert-${code}-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true })
  return `${PREFIX()}/${code}/${year}/${String(c.seq).padStart(4, '0')}`
}

function certEmail(c) {
  const [hi, en] = TITLES[c.type]
  const link = linkFor(c)
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
  return {
    subject: `${hi} / ${en} — ${c.refNo}`,
    text: [
      `जय भीम ${c.name}!`,
      `${ORG.name} की ओर से आपका ${hi} जारी किया गया है। इसे यहाँ देखें, डाउनलोड करें या प्रिंट करें: ${link}`,
      '',
      `Jai Bhim ${c.name}!`,
      `Your ${en} from ${ORG.name} has been issued. View, download or print it here: ${link}`,
      '',
      `Reference no.: ${c.refNo}`,
      ORG.name,
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0A1A3F">
<h2 style="color:#0B3C9D;margin-bottom:4px">${esc(ORG.name)}</h2>
<p>जय भीम <strong>${esc(c.name)}</strong>!<br>${esc(ORG.name)} की ओर से आपका <strong>${hi}</strong> जारी किया गया है।</p>
<p>Jai Bhim <strong>${esc(c.name)}</strong>! Your <strong>${en}</strong> has been issued.</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#0B3C9D;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">देखें और डाउनलोड करें / View and download</a></p>
<p style="color:#555;font-size:13px">Reference no.: <strong>${esc(c.refNo)}</strong><br>${esc(link)}</p>
</div>`,
  }
}

async function emailIt(c) {
  const sent = await sendMail({ to: c.email, ...certEmail(c) })
  if (sent) await Certificate.updateOne({ _id: c._id }, { $set: { emailedAt: new Date() } })
  return sent
}

// Public: the certificate page. Anyone with the link (or the QR code) can open it to check it is real.
router.get('/public/:token', async (req, res) => {
  const c = await Certificate.findOne({ token: String(req.params.token) }).lean()
  if (!c) return res.status(404).json({ message: 'Certificate not found' })
  const today = indiaToday()
  res.json({
    type: c.type, refNo: c.refNo, name: c.name, relation: c.relation, guardian: c.guardian,
    district: c.district, state: c.state, post: c.post, area: c.area, reason: c.reason,
    issueDate: c.issueDate, validUntil: c.validUntil, signatoryName: c.signatoryName, signatoryTitle: c.signatoryTitle,
    status: c.status, revokeReason: c.revokeReason, expired: !!c.validUntil && c.validUntil < today,
    signatureUrl: c.signatureUrl, address: c.address, phone: c.type === 'appointment' && c.showPhone !== false ? c.phone : undefined,
    letterhead: c.letterhead, preamble: c.preamble, closing: c.closing, copies: c.copies,
    to: c.to, subject: c.subject, salutation: c.salutation, body: c.body, signOff: c.signOff,
    org: { name: ORG.name, address: ORG.address, regNo: ORG.regNo, signature: process.env.CERT_SIGNATURE_URL || '' },
    qr: await QRCode.toDataURL(linkFor(c), { margin: 1, width: 240 }),
  })
})

// Team: list, issue, edit, cancel, email. State admins only see and issue for their own state.
router.use(protect, requirePermission('members'))

const mine = (req) => {
  const scope = stateScope(req.admin)
  return scope ? { stateCode: scope } : {}
}
async function findMine(req, res) {
  const c = await Certificate.findOne({ _id: req.params.id, ...mine(req) }).catch(() => null)
  if (!c) res.status(404).json({ message: 'Not found' })
  return c
}

router.get('/', async (req, res) => {
  const filter = { ...mine(req) }
  if (CERT_TYPES.includes(req.query.type)) filter.type = req.query.type
  res.json(await Certificate.find(filter).sort({ createdAt: -1 }).limit(1000).lean())
})

// Starting text for a new letter: copied from the last appointment letter of the same state,
// or of any state, or the organisation's standard letter the very first time
const LAYOUT = 'type letterhead preamble closing copies signatoryName signatoryTitle signatureUrl salutation signOff'
const LETTERS = ['appointment', 'letter']
const lastOf = (filter) => Certificate.findOne(filter).sort({ createdAt: -1 }).select(LAYOUT).lean()

router.get('/defaults', async (req, res) => {
  const scope = stateScope(req.admin)
  const state = scope || (STATE_CODES.includes(req.query.state) ? req.query.state : null)
  const type = CERT_TYPES.includes(req.query.type) ? req.query.type : 'appointment'
  const near = async (filter) => (state && await lastOf({ ...filter, stateCode: state })) || (!scope && await lastOf(filter)) || null
  // The letterhead is shared by appointment letters and general letters of a state
  const head = await near({ type: { $in: LETTERS }, 'letterhead.leaders.0': { $exists: true } })
  // Wording and signer come from the last document of the same kind
  const same = await near({ type })
  const base = {
    ...LETTER_DEFAULTS,
    signatoryName: process.env.CERT_SIGNATORY_NAME || LETTER_DEFAULTS.signatoryName,
    signatoryTitle: process.env.CERT_SIGNATORY_TITLE || LETTER_DEFAULTS.signatoryTitle,
    signatureUrl: process.env.CERT_SIGNATURE_URL || '',
    salutation: 'महोदय,',
    signOff: 'आपका',
    copies: type === 'appointment' ? LETTER_DEFAULTS.copies : '',
  }
  const pick = (k) => (same?.[k] ? same[k] : base[k])
  res.json({
    from: same || head ? 'last' : 'standard',
    letterhead: head ? { leaders: head.letterhead.leaders, office: head.letterhead.office || '' } : base.letterhead,
    ...Object.fromEntries(['preamble', 'closing', 'copies', 'signatoryName', 'signatoryTitle', 'signatureUrl', 'salutation', 'signOff'].map((k) => [k, pick(k)])),
  })
})

// Upload a picture of the signature; the form keeps the link
router.post('/signature', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a picture of the signature' })
  const { url } = await uploadImage(req.file.buffer, 'bluepanther/signatures')
  res.json({ url })
})

router.post('/', async (req, res) => {
  const b = req.body || {}
  const data = clean({ issueDate: '', ...b }, null, stateScope(req.admin))
  if (data.type !== 'letter') { // a general letter is signed by whoever writes it
    data.signatoryName ||= process.env.CERT_SIGNATORY_NAME || ''
    data.signatoryTitle ||= process.env.CERT_SIGNATORY_TITLE || ''
  }
  const c = await Certificate.create({ ...data, refNo: await nextRefNo(data.type, data.issueDate), issuedById: req.admin._id, issuedByName: req.admin.name })
  let emailing = false
  if (b.sendEmail && c.email) {
    emailing = true
    emailIt(c).then((sent) => { if (!sent) console.warn('Certificate email NOT sent: email is not set up (SMTP_HOST).') })
      .catch((err) => console.error('Certificate email failed:', err.message))
  }
  res.status(201).json({ ...c.toObject(), link: linkFor(c), emailing })
})

router.patch('/:id', async (req, res) => {
  const c = await findMine(req, res)
  if (!c) return
  const { type, ...rest } = req.body || {} // the type (and reference number) can't change after issuing
  c.set(clean(rest, c, stateScope(req.admin)))
  await c.save()
  res.json(c)
})

router.post('/:id/email', async (req, res) => {
  const c = await findMine(req, res)
  if (!c) return
  if (!c.email) return res.status(400).json({ message: 'Add an email address first' })
  if (c.status === 'revoked') return res.status(400).json({ message: 'This one is cancelled. Restore it before emailing.' })
  const sent = await emailIt(c)
  if (!sent) return res.status(400).json({ message: 'Email is not set up on the server yet (SMTP settings in .env)' })
  res.json({ ok: true, refNo: c.refNo })
})

router.delete('/:id', requirePermission('admins'), async (req, res) => {
  const c = await findMine(req, res)
  if (!c) return
  await c.deleteOne()
  res.json({ ok: true })
})

export default router