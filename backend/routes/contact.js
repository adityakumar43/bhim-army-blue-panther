import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Message from '../models/Message.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { notifyAdmin, sendMail } from '../services/mailer.js'

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many messages from this network. Please try again later.' },
})

router.post('/', limiter, async (req, res) => {
  const b = req.body || {}
  if (b.website) return res.status(201).json({ ok: true })

  const name = String(b.name || '').trim()
  const message = String(b.message || '').trim()
  if (!name) return res.status(400).json({ message: 'Please enter your name' })
  if (!message) return res.status(400).json({ message: 'Please write your message' })
  const topic = ['general', 'membership', 'event', 'media', 'other'].includes(b.topic) ? b.topic : 'general'
  const agreed = b.consent === true || b.consent === 'true' // the "I agree" tick box
  if (!agreed) return res.status(400).json({ message: 'Please tick the box to agree to the Privacy Policy' })
  if (!b.phone && !b.email) {
    return res.status(400).json({ message: 'Give a phone number or email so we can reply' })
  }
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) {
    return res.status(400).json({ message: 'Enter a valid email address' })
  }

  try {
    await Message.create({ name, phone: b.phone, email: b.email, message, topic, consentAt: new Date() })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Your message is too long. Please shorten it.' })
    }
    throw err
  }
  notifyAdmin(`New contact message${topic === 'general' ? '' : ` (${topic})`}`, `From ${name}${b.phone ? ' (' + b.phone + ')' : ''}:\n\n${message.slice(0, 300)}`)

  // Send the person a "we got your message" email (only if they gave an email)
  if (b.email) {
    const text = `Jai Bhim ${name},\n\nWe have received your message. Our team will get back to you soon.\n\nYour message:\n${message}\n\n— Bhim Army Blue Panther`
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0a1a3f;line-height:1.6">
      <p>जय भीम <b>${escape(name)}</b>,</p>
      <p>आपका संदेश हमें मिल गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।<br>We have received your message. Our team will get back to you soon.</p>
      <p style="background:#eef3fb;border-left:4px solid #0b3c9d;padding:10px 12px;white-space:pre-line">${escape(message)}</p>
      <p>— Bhim Army Blue Panther</p></div>`
    sendMail({ to: b.email, subject: 'We received your message – Bhim Army Blue Panther', text, html })
      .catch((err) => console.error('Contact confirmation email failed:', err.message))
  }
  res.status(201).json({ ok: true })
})

router.get('/', protect, requirePermission('messages'), async (req, res) => {
  res.json(await Message.find().sort({ createdAt: -1 }).limit(500))
})

router.patch('/:id/read', protect, requirePermission('messages'), async (req, res) => {
  const read = req.body?.read !== false
  const m = await Message.findByIdAndUpdate(req.params.id, { read }, { new: true }).catch(() => null)
  if (!m) return res.status(404).json({ message: 'Not found' })
  res.json(m)
})

router.delete('/:id', protect, requirePermission('messages'), async (req, res) => {
  const m = await Message.findByIdAndDelete(req.params.id).catch(() => null)
  if (!m) return res.status(404).json({ message: 'Not found' })
  res.json({ ok: true })
})

// Reply to a message by email, straight from the admin panel
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const asHtml = (s) => escape(s).replace(/\n/g, '<br>')

router.post('/:id/reply', protect, requirePermission('messages'), async (req, res) => {
  const text = String(req.body?.text || '').trim()
  if (!text) return res.status(400).json({ message: 'Write your reply first' })
  if (text.length > 5000) return res.status(400).json({ message: 'Your reply is too long (5000 letters at most)' })

  const m = await Message.findById(req.params.id).catch(() => null)
  if (!m) return res.status(404).json({ message: 'Not found' })
  if (!m.email) {
    return res.status(400).json({ message: `${m.name} did not give an email address.${m.phone ? ` Call or WhatsApp them on ${m.phone}.` : ''}` })
  }

  const org = 'Bhim Army Blue Panther'
  const sent = new Date(m.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })
  const ok = await sendMail({
    to: m.email,
    subject: `Re: Your message to ${org}`,
    text: `${text}\n\n— ${org}\n\n----- Your message (${sent}) -----\n${m.message}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0a1a3f">
      <p>${asHtml(text)}</p>
      <p style="margin-top:20px">— <b>${org}</b><br><span style="color:#0b3c9d">शिक्षित बनो, संगठित रहो, संघर्ष करो</span></p>
      <div style="margin-top:24px;padding:12px 16px;border-left:4px solid #f2b705;background:#f3f6fb;color:#3a4a70;font-size:13px">
        <b>Your message (${escape(sent)}):</b><br>${asHtml(m.message)}
      </div></div>`,
  }).catch((err) => { throw Object.assign(new Error(`Email could not be sent: ${err.message}`), { status: 400 }) })
  if (!ok) return res.status(400).json({ message: 'Email is not set up on the server (SMTP settings are missing in .env).' })

  m.replies.push({ text, byName: req.admin.name })
  m.read = true
  await m.save()
  res.json(m)
})


export default router
