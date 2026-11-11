import nodemailer from 'nodemailer'
import { emailLayout, textToHtml } from './emailLayout.js'

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


let capture = null
// For `npm run preview-emails`: runs fn and gives back the email it would have sent, without sending anything
export async function captureMail(fn) {
  const got = []
  capture = got
  try { await fn() } finally { capture = null }
  return got[0]
}

export async function sendMail({ to, subject, text, html }) {
  // Every email gets the same look (logo, name, slogan); an email written only as text is made into HTML too
  const body = emailLayout({ html: html || textToHtml(text), text, subject })
  if (capture) return capture.push({ to, subject, text, body }) > 0
  const t = getTransport()
  if (!t) return false
  const info = await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html: body })
  // A mail server can answer "ok" while refusing every address. That is not a success.
  if (Array.isArray(info.accepted) && info.accepted.length === 0) {
    throw new Error(`The mail server did not accept ${to}: ${info.response || 'no reason given'}`)
  }
  console.log(`Email handed to the mail server for ${to}: ${info.response || 'ok'}`)
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
