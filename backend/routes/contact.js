import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Message from '../models/Message.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { notifyAdmin } from '../services/mailer.js'

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
  if (!b.phone && !b.email) {
    return res.status(400).json({ message: 'Give a phone number or email so we can reply' })
  }
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) {
    return res.status(400).json({ message: 'Enter a valid email address' })
  }

  try {
    await Message.create({ name, phone: b.phone, email: b.email, message })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Your message is too long. Please shorten it.' })
    }
    throw err
  }
  notifyAdmin('New contact message', `From ${name}${b.phone ? ' (' + b.phone + ')' : ''}:\n\n${message.slice(0, 300)}`)
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

export default router
