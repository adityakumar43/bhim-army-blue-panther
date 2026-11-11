import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Message from '../models/Message.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { notifyAdmin, sendMail } from '../services/mailer.js'
import { contactReceivedEmail, contactReplyEmail } from '../services/emails.js'
import { cursorOf, after, pageSize, NEWEST, withFind } from '../services/paging.js'

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

  // Send the person a "we got your message" email (only if they gave an email).
  // It repeats nothing they typed (not the message, not the name): anyone can type any address here,
  // and an email that echoed their words could be used to send spam from our address.
  if (b.email) {
    sendMail({ to: b.email, ...contactReceivedEmail() })
      .catch((err) => console.error('Contact confirmation email failed:', err.message))
  }
  res.status(201).json({ ok: true })
})

router.get('/', protect, requirePermission('messages'), async (req, res) => {
  const c = cursorOf(req) // a page at a time, newest first
  if (c === false) return res.status(400).json({ message: 'Bad page' })
  res.json(await Message.find(after(withFind({}, req, ['name', 'email', 'phone']), c)).sort(NEWEST).limit(pageSize(req, 500)))
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
router.post('/:id/reply', protect, requirePermission('messages'), async (req, res) => {
  const text = String(req.body?.text || '').trim()
  if (!text) return res.status(400).json({ message: 'Write your reply first' })
  if (text.length > 5000) return res.status(400).json({ message: 'Your reply is too long (5000 letters at most)' })

  const m = await Message.findById(req.params.id).catch(() => null)
  if (!m) return res.status(404).json({ message: 'Not found' })
  if (!m.email) {
    return res.status(400).json({ message: `${m.name} did not give an email address.${m.phone ? ` Call or WhatsApp them on ${m.phone}.` : ''}` })
  }

  const sent = new Date(m.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })
  const ok = await sendMail({
    to: m.email,
    ...contactReplyEmail({ text, sent, message: m.message }),
  }).catch((err) => { throw Object.assign(new Error(`Email could not be sent: ${err.message}`), { status: 400 }) })
  if (!ok) return res.status(400).json({ message: 'Email is not set up on the server (SMTP settings are missing in .env).' })

  m.replies.push({ text, byName: req.admin.name })
  m.read = true
  await m.save()
  res.json(m)
})


export default router
