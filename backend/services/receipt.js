import { ORG } from '../config/org.js'
import { esc, button, hero, greet, both, codeBox, details, note, signoff } from './emailLayout.js'

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

  const html = `${hero('🙏', 'दान रसीद', 'Donation receipt')}
${greet(d.name)}
${both('आपके सहयोग के लिए हार्दिक धन्यवाद। आपका दान हमें मिल गया है। यह समाज के हक़ की लड़ाई में हमारी मदद करेगा।', 'Thank you for your support. We have received your donation. It helps our work for justice and equality.')}
${codeBox('राशि / Amount', amount, { spacing: 1 })}
${details([
    ['रसीद संख्या / Receipt no.', d.receiptNo],
    ['तारीख़ / Date', date],
    ['भुगतान आईडी / Payment ID', d.paymentId],
    ['पंजीकरण संख्या / Registration no.', ORG.regNo],
  ])}
${button('रसीद देखें या प्रिंट करें / View or print', url)}
${ORG.note ? note(esc(ORG.note)) : ''}
${signoff()}`

  return { subject, text, html }
}
