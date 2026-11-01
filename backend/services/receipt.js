import { ORG } from '../config/org.js'
import { button } from './emailLayout.js'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function receiptEmail(d) {
  const url = `${process.env.CLIENT_URL}/receipt/${d.receiptToken}`
  const date = new Date(d.paidAt || d.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
  const amount = `₹${Number(d.amount).toLocaleString('en-IN')}`
  const rows = [
    ['Receipt no.', d.receiptNo],
    ['Date', date],
    ['Amount', amount],
    ['Payment ID', d.paymentId],
  ]

  const subject = `Donation receipt ${d.receiptNo} - ${ORG.name}`
  const text = [
    `${ORG.name}`,
    ORG.address,
    '',
    `Thank you${d.name ? ', ' + d.name : ''}. We have received your donation.`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ORG.regNo ? `Registration no.: ${ORG.regNo}` : '',
    '',
    `View or print this receipt: ${url}`,
    ORG.note,
    '',
    'Jai Bhim',
  ].filter((l) => l !== undefined && l !== null).join('\n')

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0A1A3F">
<h2 style="margin:0 0 12px;font-size:22px">दान रसीद / Donation receipt</h2>
<p>Thank you${d.name ? ', ' + esc(d.name) : ''}. We have received your donation.</p>
<table style="border-collapse:collapse;width:100%">
${rows.map(([k, v]) => `<tr><td style="padding:8px;border:1px solid #D5DEF2;font-weight:bold">${esc(k)}</td><td style="padding:8px;border:1px solid #D5DEF2">${esc(v)}</td></tr>`).join('\n')}
</table>
${ORG.regNo ? `<p>Registration no.: ${esc(ORG.regNo)}</p>` : ''}
${button('रसीद देखें या प्रिंट करें / View or print', url)}
${ORG.note ? `<p style="color:#555;font-size:13px">${esc(ORG.note)}</p>` : ''}
<p style="margin-top:24px">Jai Bhim</p>
</div>`

  return { subject, text, html }
}
