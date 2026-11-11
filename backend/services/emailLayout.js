import { ORG } from '../config/org.js'

// One look for every email the website sends: the logo and name on navy at the top, the message on a
// white card, and the slogan, social pages, address and website at the bottom. sendMail() puts every email in it.
// The blocks below (hero, greet, both, details, codeBox, button, note, quote, signoff) build the message itself,
// so every email reads the same way: a headline, Hindi then English, the key facts in a box, one clear button.
// Built with tables and inline styles, because that is what email apps (Gmail, Outlook, phones) understand.

const NAVY = '#0A1A3F'
const BRAND = '#0B3C9D'
const GOLD = '#F2B705'
const GOLD_TEXT = '#9A6B00' // gold that is still readable on white
const MUTED = '#5B6785'
const LINE = '#E3E8F3'
const TINT = '#F5F7FC'
const FONT = "'Segoe UI', Roboto, Arial, 'Noto Sans Devanagari', sans-serif"

export const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const site = () => (process.env.CLIENT_URL || '').replace(/\/+$/, '')

// The headline of the email: an emoji in a soft circle, the Hindi title and a small English line under it
export function hero(icon, title, subtitle = '') {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr>
<td align="center" style="padding:0 0 20px;border-bottom:1px solid ${LINE};font-family:${FONT}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" width="64" height="64" bgcolor="#EAF0FB" style="width:64px;height:64px;border-radius:32px;background:#EAF0FB;font-size:32px;line-height:64px;text-align:center">${icon}</td></tr></table>
<div style="margin:14px 0 0;font-size:24px;line-height:1.3;font-weight:bold;color:${NAVY}">${esc(title)}</div>
${subtitle ? `<div style="margin:6px 0 0;font-size:12px;font-weight:bold;letter-spacing:2.5px;color:${GOLD_TEXT};text-transform:uppercase">${esc(subtitle)}</div>` : ''}
</td></tr></table>`
}

// "जय भीम Ravi जी,"
export function greet(name) {
    return `<p style="margin:0 0 14px;font-size:17px">जय भीम${name ? ` <strong>${esc(name)}</strong> जी` : ''},</p>`
}

// The same message in Hindi and then in English (lighter, a little smaller). Both are plain text, escaped here.
export function both(hi, en) {
    return `${hi ? `<p style="margin:0 0 8px">${esc(hi)}</p>` : ''}${en ? `<p style="margin:0 0 16px;color:#3A4A70;font-size:15px">${esc(en)}</p>` : ''}`
}

// The key facts in a soft box: [label, value] rows. Empty values are left out.
export function details(rows) {
    const list = rows.filter(([, v]) => v !== undefined && v !== null && v !== '')
    if (list.length === 0) return ''
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${TINT}" style="margin:18px 0;background:${TINT};border:1px solid ${LINE};border-radius:12px;font-family:${FONT}">
${list.map(([k, v], i) => `<tr>
<td class="dk" style="padding:11px 16px;${i ? `border-top:1px solid ${LINE};` : ''}font-size:13px;line-height:1.4;color:${MUTED};vertical-align:top">${esc(k)}</td>
<td class="dv" align="right" style="padding:11px 16px;${i ? `border-top:1px solid ${LINE};` : ''}font-size:15px;line-height:1.4;font-weight:bold;color:${NAVY};text-align:right;word-break:break-word">${esc(v)}</td>
</tr>`).join('\n')}
</table>`
}

// One number that matters (a code, a reference number), big and easy to copy
export function codeBox(label, value, { spacing = 3 } = {}) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0"><tr>
<td align="center" bgcolor="${TINT}" style="background:${TINT};border:2px dashed #C9D4EC;border-radius:12px;padding:16px 12px;font-family:${FONT}">
<div style="font-size:13px;color:${MUTED}">${esc(label)}</div>
<div style="margin-top:6px;font-size:${String(value).length > 12 ? 21 : 28}px;line-height:1.25;font-weight:bold;letter-spacing:${spacing}px;color:${BRAND};word-break:break-all">${esc(value)}</div>
</td></tr></table>`
}

// A big button that works in every email app (also Outlook), with the plain link under it for when a button
// does not open (some apps block buttons, or the person wants to copy the link to another phone)
export function button(label, url, { color = BRAND, fallback = true } = {}) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 ${fallback ? '10px' : '24px'}"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${color}" style="border-radius:10px;background:${color};text-align:center">
<a href="${esc(url)}" target="_blank" style="display:inline-block;text-align:center;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:1.3;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)}</a>
</td></tr></table>
</td></tr></table>
${fallback ? `<p style="margin:0 0 18px;text-align:center;font-size:12px;line-height:1.5;color:${MUTED}">बटन न खुले तो यह लिंक खोलें / If the button does not open, use this link:<br><a href="${esc(url)}" style="color:${BRAND};word-break:break-all">${esc(url)}</a></p>` : ''}`
}

// A small side note: how long a link works, "ignore this if it was not you", an emergency number
const TONES = {
    info: ['#F5F7FC', '#C9D4EC', '#3A4A70'],
    warn: ['#FFF8E1', GOLD, '#6B4E00'],
    danger: ['#FEF2F2', '#B91C1C', '#7F1D1D'],
}
export function note(html, tone = 'info') {
    const [bg, bar, ink] = TONES[tone] || TONES.info
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0"><tr>
<td bgcolor="${bg}" style="background:${bg};border-left:4px solid ${bar};border-radius:8px;padding:12px 14px;font-family:${FONT};font-size:13.5px;line-height:1.55;color:${ink}">${html}</td>
</tr></table>`
}

// Babasaheb's call, as a highlighted quote
export function quote() {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0"><tr>
<td align="center" bgcolor="#FFF8E1" style="background:#FFF8E1;border-radius:12px;padding:18px 16px;font-family:${FONT}">
<div style="font-size:18px;line-height:1.5;font-weight:bold;color:${NAVY}">“शिक्षित बनो, संगठित रहो, संघर्ष करो”</div>
<div style="margin-top:4px;font-size:13px;color:${GOLD_TEXT}">— डॉ. बी. आर. आंबेडकर</div>
</td></tr></table>`
}

// The end of every message to members and the public
export function signoff() {
    return `<p style="margin:26px 0 0;line-height:1.5">जय भीम, जय भारत<br><strong style="color:${BRAND}">टीम ${esc(ORG.name)}</strong></p>`
}

// Plain text (an alert, or an email written without HTML) made readable: paragraphs, line breaks, links
export function textToHtml(text) {
    return String(text || '')
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p style="margin:0 0 14px">${esc(p)
            .replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:${BRAND};word-break:break-all">${u}</a>`)
            .replace(/\n/g, '<br>')}</p>`)
        .join('\n')
}

// The first words of the email, shown by the inbox next to the subject (instead of "भीम आर्मी ब्लू पैंथर BHIM ARMY…")
function preview(text) {
    const s = String(text || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 140)
    return s ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(s)}${'&#847;&zwnj;&nbsp;'.repeat(30)}</div>` : ''
}

const SOCIAL_NAMES = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', x: 'X', whatsapp: 'WhatsApp', linkedin: 'LinkedIn' }

export function emailLayout({ html, text, subject }) {
    const url = site()
    const host = url.replace(/^https?:\/\/(www\.)?/, '')
    const logo = url ? `<img src="${esc(url)}/icons/icon-192.png" width="64" height="64" alt="" style="display:block;border:3px solid ${GOLD};border-radius:50%;background:#ffffff">` : ''
    const social = Object.entries(ORG.social || {}).filter(([, u]) => /^https?:\/\//.test(u || ''))
    const contact = [
        url && `<a href="${esc(url)}" style="color:${BRAND};font-weight:bold;text-decoration:none">${esc(host)}</a>`,
        ORG.email && `<a href="mailto:${esc(ORG.email)}" style="color:${MUTED}">${esc(ORG.email)}</a>`,
    ].filter(Boolean)
    return `<!doctype html>
<html lang="hi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<style>
  @media (max-width:620px) {
    .card { padding:24px 18px !important }
    .wrap { padding:12px 8px !important }
    .head { padding:22px 16px 18px !important }
    .dk, .dv { display:block !important; width:auto !important; text-align:left !important }
    .dk { padding-bottom:0 !important }
    .dv { padding-top:2px !important; border-top:0 !important }
  }
  a { color:${BRAND} }
</style>
</head>
<body style="margin:0;padding:0;background:#EEF2F9">
${preview(text)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EEF2F9" style="background:#EEF2F9">
<tr><td class="wrap" align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">

<tr><td class="head" align="center" bgcolor="${NAVY}" style="background:${NAVY};border-radius:18px 18px 0 0;padding:26px 24px 22px;font-family:${FONT}">
${logo ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td>${logo}</td></tr></table>` : ''}
<div style="margin-top:12px;font-size:23px;font-weight:bold;color:#ffffff;line-height:1.25">भीम आर्मी ब्लू पैंथर</div>
<div style="margin-top:4px;font-size:11px;font-weight:bold;color:${GOLD};letter-spacing:3px;line-height:1.5">${esc(ORG.name.toUpperCase())}</div>
</td></tr>
<tr><td style="font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="33%" bgcolor="${GOLD}" style="background:${GOLD};height:5px;line-height:5px;font-size:0">&nbsp;</td>
<td width="34%" bgcolor="#3B82F6" style="background:#3B82F6;height:5px;line-height:5px;font-size:0">&nbsp;</td>
<td width="33%" bgcolor="${GOLD}" style="background:${GOLD};height:5px;line-height:5px;font-size:0">&nbsp;</td>
</tr></table></td></tr>

<tr><td class="card" bgcolor="#ffffff" style="background:#ffffff;padding:32px 34px;font-family:${FONT};font-size:16px;line-height:1.65;color:${NAVY};border-radius:0 0 18px 18px;border:1px solid #DCE3F1;border-top:0">
${html}
</td></tr>

<tr><td align="center" style="padding:24px 16px 8px;font-family:${FONT};font-size:13px;line-height:1.75;color:${MUTED}">
<div style="color:${BRAND};font-weight:bold;font-size:14px">शिक्षित बनो · संगठित रहो · संघर्ष करो</div>
${social.length ? `<div style="margin:8px 0">${social.map(([k, u]) => `<a href="${esc(u)}" style="display:inline-block;margin:2px 4px;padding:5px 12px;border:1px solid #C9D4EC;border-radius:20px;background:#ffffff;color:${NAVY};font-weight:bold;font-size:12px;text-decoration:none">${esc(SOCIAL_NAMES[k] || k)}</a>`).join('')}</div>` : ''}
${contact.map((c) => `<div>${c}</div>`).join('\n')}
<div>${esc(ORG.name)}${ORG.address ? ` · ${esc(ORG.address)}` : ''}</div>
</td></tr>

</table>
</td></tr></table>
</body></html>`
}
