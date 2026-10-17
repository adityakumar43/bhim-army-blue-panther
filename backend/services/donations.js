import crypto from 'crypto'
import Donation from '../models/Donation.js'
import Counter from '../models/Counter.js'
import { sendMail, notifyAdmin } from './mailer.js'
import { receiptEmail } from './receipt.js'

async function nextReceiptNo() {
  const c = await Counter.findOneAndUpdate({ _id: 'receipt' }, { $inc: { seq: 1 } }, { new: true, upsert: true })
  return `BP-${new Date().getFullYear()}-${String(c.seq).padStart(5, '0')}`
}


export async function ensureReceipt(d) {
  let changed = false
  if (!d.receiptToken) { d.receiptToken = crypto.randomBytes(16).toString('hex'); changed = true }
  if (!d.receiptNo) { d.receiptNo = await nextReceiptNo(); changed = true }
  if (changed) await d.save()
  return d
}


export async function emailReceipt(d) {
  const { subject, text, html } = receiptEmail(d)
  const sent = await sendMail({ to: d.email, subject, text, html })
  if (sent) {
    d.receiptEmailedAt = new Date()
    await d.save()
  }
  return sent
}

function afterPaid(d) {
  ;(async () => {
    if (d.email) {
      try { await emailReceipt(d) } catch (err) { console.error('Receipt email failed:', err.message) }
    }
    await notifyAdmin(
      `New donation: ₹${d.amount}`,
      `${d.name || 'Anonymous'} donated ₹${d.amount}. Receipt ${d.receiptNo}.`
    )
  })().catch((err) => console.error('After-payment tasks failed:', err.message))
}


export async function finalizeDonation(orderId, paymentId) {
  const claimed = await Donation.findOneAndUpdate(
    { orderId, status: { $ne: 'paid' } },
    { status: 'paid', paymentId, paidAt: new Date() },
    { new: true }
  )
  if (!claimed) return Donation.findOne({ orderId }) 
  await ensureReceipt(claimed)
  afterPaid(claimed)
  return claimed
}
