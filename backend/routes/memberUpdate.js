import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import Member from '../models/Member.js'
import { STATE_CODES } from '../config/states.js'
import { stateNameEn } from '../config/stateNames.js'
import { canonicalDistrict } from '../config/districts.js'
import { ORG } from '../config/org.js'
import { upload } from '../middleware/upload.js'
import { uploadImage, deleteImage } from '../config/cloudinary.js'
import { sendMail, notifyAdmin } from '../services/mailer.js'

// "Update my details": a member proves who they are with their mobile number, date of birth and
// a 6-digit code sent to their email, then changes their phone, email, address or photo themselves.
const router = Router()

const CODE_MINUTES = 10 // the emailed code works for 10 minutes
const PASS_MINUTES = 30 // after the code, they have 30 minutes to save their changes
const MAX_TRIES = 5 // wrong codes allowed before a new code is needed

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const same = (a, b) => a && b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
const cleanPhone = (v) => String(v || '').replace(/\s|-/g, '').replace(/^(\+91|91)(?=\d{10}$)/, '')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
// ra*****@gmail.com: enough for them to know which inbox to open, not enough for anyone else
const mask = (email) => { const [user, domain] = email.split('@'); return `${user.slice(0, 2)}${'*'.repeat(Math.max(2, user.length - 2))}@${domain}` }
const NOT_FOUND = 'We could not find a membership with these details.'

function parseDob(value) {
    const s = String(value || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
    const d = new Date(`${s}T00:00:00Z`)
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : s
}

// An optional number from 1 to 999: empty gives null (cleared), anything else that is not a number gives false
function constituency(value) {
    const s = String(value ?? '').trim()
    if (!s) return null
    return /^\d{1,3}$/.test(s) && Number(s) > 0 ? Number(s) : false
}

// What the member sees and can change
const details = (m) => ({
    name: m.name, memberNo: m.memberNo || null, status: m.status, phone: m.phone, email: m.email || '',
    stateCode: m.stateCode || '', district: m.district || '', city: m.city || '',
    assemblyNo: m.assemblyNo || '', lokSabhaNo: m.lokSabhaNo || '', photo: m.photo?.url || '',
})

const startLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { message: 'Too many tries. Please wait 15 minutes and try again.' } })
const codeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many tries. Please wait 15 minutes and try again.' } })

// Step 1: mobile number and date of birth. A code goes to the email on their membership.
router.post('/start', startLimiter, async (req, res) => {
    const phone = cleanPhone(req.body?.phone)
    const dob = parseDob(req.body?.dob)
    if (!/^[6-9]\d{9}$/.test(phone) || !dob) return res.status(400).json({ message: 'Enter your 10-digit mobile number and date of birth' })
    const m = await Member.findOne({ phone }).select('+editCodeExpires')
    if (!m || !m.dob || m.dob.toISOString().slice(0, 10) !== dob) return res.status(404).json({ message: NOT_FOUND })
    if (!['pending', 'approved'].includes(m.status)) return res.status(403).json({ message: 'This membership is not active. Please contact us.' })
    if (!m.email) return res.status(400).json({ message: 'There is no email address on your membership, so we cannot send you a code. Please contact us to change your details.' })
    // One code a minute at most
    if (m.editCodeExpires && m.editCodeExpires - Date.now() > (CODE_MINUTES - 1) * 60e3) {
        return res.status(429).json({ message: 'A code was just sent. Please wait a minute before asking for another one.' })
    }

    const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0')
    await Member.updateOne({ _id: m._id }, {
        $set: { editCodeHash: hash(`${m._id}:${code}`), editCodeExpires: new Date(Date.now() + CODE_MINUTES * 60e3), editCodeTries: 0 },
    }, { timestamps: false })

    const text = `Jai Bhim ${m.name},\n\nYour code to update your membership details: ${code}\nIt works for ${CODE_MINUTES} minutes.\n\nIf you did not ask for this, ignore this email. Nothing will change.\n\n— ${ORG.name}`
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0a1a3f;line-height:1.6;max-width:520px">
<p>जय भीम <b>${esc(m.name)}</b>,</p>
<p>अपनी सदस्यता की जानकारी बदलने के लिए आपका कोड / Your code to update your membership details:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0b3c9d;margin:18px 0">${code}</p>
<p>यह कोड ${CODE_MINUTES} मिनट तक काम करेगा। / It works for ${CODE_MINUTES} minutes.</p>
<p style="color:#666;font-size:13px">अगर आपने यह नहीं माँगा, तो इस ईमेल को अनदेखा करें। कुछ नहीं बदलेगा।<br>If you did not ask for this, ignore this email. Nothing will change.</p>
<p>— ${esc(ORG.name)}</p></div>`
    try {
        const sent = await sendMail({ to: m.email, subject: `${code} is your code to update your details`, text, html })
        if (!sent) return res.status(503).json({ message: 'Email is not set up yet. Please contact us to change your details.' })
    } catch (err) {
        console.error('Update code email failed:', err.message)
        return res.status(502).json({ message: 'We could not send the email. Please try again later.' })
    }
    res.json({ email: mask(m.email), minutes: CODE_MINUTES })
})

// Step 2: the code from the email. A right code gives a pass for saving the changes.
router.post('/verify', codeLimiter, async (req, res) => {
    const phone = cleanPhone(req.body?.phone)
    const code = String(req.body?.code || '').replace(/\D/g, '')
    const m = /^[6-9]\d{9}$/.test(phone) ? await Member.findOne({ phone }).select('+editCodeHash +editCodeExpires +editCodeTries') : null
    if (!m || !m.editCodeHash || !m.editCodeExpires || m.editCodeExpires < new Date()) {
        return res.status(400).json({ message: 'This code has expired. Please ask for a new code.' })
    }
    if ((m.editCodeTries || 0) >= MAX_TRIES) return res.status(400).json({ message: 'Too many wrong codes. Please ask for a new code.' })
    if (code.length !== 6 || !same(hash(`${m._id}:${code}`), m.editCodeHash)) {
        await Member.updateOne({ _id: m._id }, { $inc: { editCodeTries: 1 } }, { timestamps: false })
        const left = MAX_TRIES - (m.editCodeTries || 0) - 1
        return res.status(400).json({ message: left > 0 ? `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Please ask for a new code.' })
    }
    const pass = crypto.randomBytes(24).toString('hex')
    await Member.updateOne({ _id: m._id }, {
        $set: { editTokenHash: hash(pass), editTokenExpires: new Date(Date.now() + PASS_MINUTES * 60e3) },
        $unset: { editCodeHash: 1, editCodeExpires: 1, editCodeTries: 1 },
    }, { timestamps: false })
    res.json({ pass, details: details(m) })
})

// Step 3: save. Name and date of birth stay as they are (the team changes those).
router.put('/', codeLimiter, upload.single('photo'), async (req, res) => {
    const b = req.body || {}
    const pass = String(b.pass || '')
    const m = /^[a-f0-9]{48}$/.test(pass)
        ? await Member.findOne({ editTokenHash: hash(pass), editTokenExpires: { $gt: new Date() } })
        : null
    if (!m) return res.status(410).json({ message: 'Your time to make changes has run out. Please start again.' })
    if (!['pending', 'approved'].includes(m.status)) return res.status(403).json({ message: 'This membership is not active. Please contact us.' })

    const phone = cleanPhone(b.phone)
    const email = String(b.email || '').trim().toLowerCase()
    const stateCode = String(b.stateCode || '')
    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' })
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 120) return res.status(400).json({ message: 'Enter a valid email address' })
    if (!STATE_CODES.includes(stateCode)) return res.status(400).json({ message: 'Choose your state' })
    const district = canonicalDistrict(stateCode, b.district)
    if (!district) return res.status(400).json({ message: 'Please choose your district from the list' })
    const assemblyNo = constituency(b.assemblyNo)
    const lokSabhaNo = constituency(b.lokSabhaNo)
    if (assemblyNo === false) return res.status(400).json({ message: 'Assembly constituency number must be a number, like 12' })
    if (lokSabhaNo === false) return res.status(400).json({ message: 'Lok Sabha constituency number must be a number, like 3' })
    if (phone !== m.phone && (await Member.exists({ phone, _id: { $ne: m._id } }))) {
        return res.status(409).json({ message: 'This mobile number is already used by another membership' })
    }

    const before = details(m)
    const oldEmail = m.email
    const oldPhoto = m.photo?.publicId
    const photo = req.file ? await uploadImage(req.file.buffer, 'bluepanther/members') : null

    Object.assign(m, {
        phone, email, stateCode, state: stateNameEn(stateCode), district, city: String(b.city || '').trim().slice(0, 100),
        assemblyNo: assemblyNo ?? undefined, lokSabhaNo: lokSabhaNo ?? undefined, detailsUpdatedAt: new Date(),
    })
    if (photo) m.photo = photo
    try {
        await m.save()
    } catch (err) {
        if (photo) await deleteImage(photo.publicId)
        if (err.code === 11000) return res.status(409).json({ message: 'This mobile number is already used by another membership' })
        if (err.name === 'ValidationError') return res.status(400).json({ message: 'Some details are too long. Please shorten them.' })
        throw err
    }
    await Member.updateOne({ _id: m._id }, { $unset: { editTokenHash: 1, editTokenExpires: 1 } }, { timestamps: false }) // one save per code
    if (photo && oldPhoto) deleteImage(oldPhoto).catch(() => { })

    // Tell the team what changed, and warn the old email address if it was changed
    const after = details(m)
    const LABELS = { phone: 'mobile number', email: 'email', stateCode: 'state', district: 'district', city: 'village/city', assemblyNo: 'assembly no.', lokSabhaNo: 'Lok Sabha no.', photo: 'photo' }
    const changed = Object.keys(LABELS).filter((k) => String(before[k]) !== String(after[k])).map((k) => LABELS[k])
    if (changed.length) notifyAdmin('A member updated their details', `${m.name}${m.memberNo ? ` (${m.memberNo})` : ''} changed: ${changed.join(', ')}.`)
    if (oldEmail && oldEmail !== email) {
        sendMail({
            to: oldEmail,
            subject: 'Your membership email address was changed',
            text: `Jai Bhim ${m.name},\n\nThe email address on your membership was changed to ${email}. If you did not do this, please contact us at once.\n\n— ${ORG.name}`,
        }).catch((err) => console.error('Email-change notice failed:', err.message))
    }
    res.json({ ok: true, changed, details: after, cardToken: m.status === 'approved' && m.memberNo ? m.cardToken : null })
})

export default router