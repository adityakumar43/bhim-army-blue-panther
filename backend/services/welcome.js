import { ORG } from '../config/org.js'

const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// The email a member gets when their application is approved
export function welcomeEmail(m) {
    const link = `${process.env.CLIENT_URL}/card/${m.cardToken}`
    const subject = `Welcome to ${ORG.name} - your membership card / आपका सदस्यता कार्ड`
    const text = [
        `जय भीम ${m.name}!`,
        `आपका सदस्यता आवेदन स्वीकार हो गया है। आपकी सदस्यता संख्या: ${m.memberNo}`,
        `अपना सदस्यता कार्ड यहाँ देखें और प्रिंट करें: ${link}`,
        '',
        `Jai Bhim ${m.name}!`,
        `Your membership application has been approved. Your member number: ${m.memberNo}`,
        `See and print your membership card here: ${link}`,
        '',
        ORG.name,
    ].join('\n')

    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0A1A3F">
<h2 style="color:#0B3C9D;margin-bottom:4px">${esc(ORG.name)}</h2>
<p>जय भीम <strong>${esc(m.name)}</strong>!<br>आपका सदस्यता आवेदन स्वीकार हो गया है।<br>आपकी सदस्यता संख्या: <strong>${esc(m.memberNo)}</strong></p>
<p>Jai Bhim <strong>${esc(m.name)}</strong>!<br>Your membership application has been approved.<br>Your member number: <strong>${esc(m.memberNo)}</strong></p>
<p><a href="${esc(link)}" style="display:inline-block;background:#0B3C9D;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold">देखें / View your membership card</a></p>
<p style="color:#555;font-size:13px">${esc(link)}</p>
</div>`
    return { subject, text, html }
}