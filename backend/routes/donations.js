import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import Razorpay from 'razorpay'
import Donation from '../models/Donation.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { finalizeDonation, ensureReceipt, emailReceipt } from '../services/donations.js'

const router = Router()

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Please try again later.' },
})

const enabled = () => process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
let client
const razorpay = () =>
  (client ??= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  }))

function safeEqual(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}


router.post('/order', orderLimiter, async (req, res) => {
  if (!enabled()) {
    return res.status(503).json({ message: 'Online donations are not available yet' })
  }
  const b = req.body || {}
  const amount = Math.floor(Number(b.amount))
  if (!Number.isFinite(amount) || amount < 10 || amount > 500000) {
    return res.status(400).json({ message: 'Enter an amount between ₹10 and ₹5,00,000' })
  }
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) {
    return res.status(400).json({ message: 'Enter a valid email address' })
  }

  let order
  try {
    order = await razorpay().orders.create({
      amount: amount * 100, 
      currency: 'INR',
      receipt: `don_${Date.now()}`,
    })
  } catch (err) {
    console.error('Razorpay order failed:', err?.error?.description || err.message)
    return res.status(502).json({ message: 'Could not start the payment. Please try again.' })
  }

  await Donation.create({ orderId: order.id, amount, name: b.name, email: b.email, phone: b.phone })
  res.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID })
})


router.post('/verify', async (req, res) => {
  if (!enabled()) return res.status(503).json({ message: 'Online donations are not available yet' })
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing payment details' })
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  if (!safeEqual(expected, razorpay_signature)) {
    return res.status(400).json({ message: 'Payment could not be verified' })
  }

  const donation = await finalizeDonation(razorpay_order_id, razorpay_payment_id)
  if (!donation) return res.status(404).json({ message: 'Donation not found' })
  res.json({ ok: true, receiptToken: donation.receiptToken })
})


router.get('/receipt/:token', async (req, res) => {
  const d = await Donation.findOne({ receiptToken: req.params.token })
  if (!d) return res.status(404).json({ message: 'Receipt not found' })
  if (d.status !== 'paid' || !d.receiptNo) return res.json({ pending: true })
  res.json({
    receiptNo: d.receiptNo,
    amount: d.amount,
    name: d.name,
    paidAt: d.paidAt || d.createdAt,
    paymentId: d.paymentId,
  })
})


router.get('/', protect, requirePermission('donations'), async (req, res) => {
  const items = await Donation.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(1000)
  const total = items.reduce((sum, d) => sum + d.amount, 0)
  res.json({ items, total })
})

router.post('/:id/resend', protect, requirePermission('donations'), async (req, res) => {
  const d = await Donation.findById(req.params.id).catch(() => null)
  if (!d || d.status !== 'paid') return res.status(404).json({ message: 'Paid donation not found' })
  if (!d.email) return res.status(400).json({ message: 'This donor did not give an email address' })
  await ensureReceipt(d)
  try {
    const sent = await emailReceipt(d)
    if (!sent) return res.status(503).json({ message: 'Email is not set up on the server yet' })
  } catch (err) {
    console.error('Resend failed:', err.message)
    return res.status(502).json({ message: 'Could not send the email. Check the server email settings.' })
  }
  res.json({ ok: true, receiptEmailedAt: d.receiptEmailedAt })
})


export async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return res.status(503).json({ message: 'Webhook is not set up' })
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ message: 'Bad request' })

  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex')
  if (!safeEqual(expected, req.headers['x-razorpay-signature'] || '')) {
    return res.status(400).json({ message: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(req.body.toString('utf8'))
  } catch {
    return res.status(400).json({ message: 'Bad request' })
  }

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload?.payment?.entity
    if (payment?.order_id && payment?.id) await finalizeDonation(payment.order_id, payment.id)
  }
  res.json({ ok: true })
}

export default router
