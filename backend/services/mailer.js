import nodemailer from 'nodemailer'

let transport
function getTransport() {
  if (!process.env.SMTP_HOST) return null
  const port = Number(process.env.SMTP_PORT || 587)
  return (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  }))
}


export async function sendMail({ to, subject, text, html }) {
  const t = getTransport()
  if (!t) return false
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html })
  return true
}


export async function notifyAdmin(subject, text) {
  const to = process.env.ADMIN_NOTIFY_EMAIL
  if (!to) return false
  try {
    return await sendMail({ to, subject, text })
  } catch (err) {
    console.error('Admin alert failed:', err.message)
    return false
  }
}
