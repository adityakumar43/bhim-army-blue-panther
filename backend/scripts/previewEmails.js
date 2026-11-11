// Writes every email the website sends, filled with sample details, as web pages you can open in a browser:
//   npm run preview-emails      → backend/email-previews/*.html (not uploaded to GitHub)
// Nothing is sent and the database is not used. Change a template, run this again, refresh the page.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

process.env.CLIENT_URL ||= 'https://bhimarmybluepanther.org'
const { emailLayout, textToHtml } = await import('../services/emailLayout.js')
const { welcomeEmail } = await import('../services/welcome.js')
const { birthdayEmail } = await import('../services/birthdays.js')
const { receiptEmail } = await import('../services/receipt.js')
const { mailoutEmail } = await import('../services/mailout.js')
const { reminderEmail, escalationEmail } = await import('../services/caseReminders.js')
const emails = await import('../services/emails.js')
const { certEmail } = await import('../routes/certificates.js')
const { CERT_TYPES } = await import('../models/Certificate.js')
const { emailLink } = await import('../services/passwordLinks.js')
const { captureMail } = await import('../services/mailer.js')

const member = { name: 'Ravi Kumar', email: 'ravi@example.com', memberNo: 'BABP/MP/2026/0142', cardToken: 'sample', unsubToken: 'sample' }
const admin = { name: 'Priya Verma', email: 'priya@example.com' }
const link = `${process.env.CLIENT_URL}/admin/set-password?t=${'0'.repeat(64)}`
const cases = [
    { refNo: 'HD-7K2Q9', category: 'Police complaint', district: 'Indore', state: 'Madhya Pradesh', urgent: true, createdAt: new Date(Date.now() - 6 * 864e5), assignedTo: { name: 'Sunil' } },
    { refNo: 'HD-3MX81', category: 'Land dispute', district: 'Dhar', state: 'Madhya Pradesh', createdAt: new Date(Date.now() - 4 * 864e5) },
]
const alert = 'From Ravi Kumar (9876543210):\n\nI want to join the organisation in Dhar district. Please call me.'

const all = {
    'admin-invite': await captureMail(() => emailLink(admin, link, 'invite')),
    'admin-reset': await captureMail(() => emailLink(admin, link, 'reset')),
    'member-welcome': welcomeEmail(member),
    'member-birthday': birthdayEmail(member),
    'member-update-code': emails.updateCodeEmail(member, '482917', 10),
    'member-announcement': mailoutEmail({ subject: 'Samvidhan Diwas sabha on 26 November', body: 'All members are invited to the Samvidhan Diwas sabha in Indore.\n\nTime: 10 AM\nPlace: Ambedkar Bhawan, Pithampur' }, member),
    'donation-receipt': receiptEmail({ name: 'Ravi Kumar', amount: 501, receiptNo: 'BABP-2026-0031', paymentId: 'pay_Nx81Kq2LmZ', receiptToken: 'sample', paidAt: new Date() }),
    'certificate': certEmail({ type: CERT_TYPES[0], name: 'Ravi Kumar', refNo: 'BABP/APP/2026/0007', token: 'sample' }),
    'contact-received': emails.contactReceivedEmail(),
    'contact-reply': emails.contactReplyEmail({ text: 'Jai Bhim Ravi ji,\n\nThank you for writing to us. Our Dhar district team will call you this week.', sent: '10 Nov 2026', message: 'I want to join the organisation in Dhar district.' }),
    'helpdesk-received': emails.complaintReceivedEmail('HD-7K2Q9'),
    'helpdesk-reminder': reminderEmail(cases),
    'helpdesk-escalation': escalationEmail(cases, 1),
    'admin-alert': { subject: 'New contact message', text: alert, html: textToHtml(alert) },
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'email-previews')
fs.mkdirSync(dir, { recursive: true })
const list = []
for (const [name, e] of Object.entries(all)) {
    fs.writeFileSync(path.join(dir, `${name}.html`), e.body || emailLayout(e))
    list.push(`<li><a href="${name}.html">${name}</a> — ${e.subject.replace(/</g, '&lt;')}</li>`)
}
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="font-family:sans-serif;padding:20px"><h1>Email previews</h1><ul style="line-height:2">${list.join('')}</ul>`)
console.log(`${list.length} emails written to ${dir}\nOpen index.html in your browser.`)
process.exit(0)
