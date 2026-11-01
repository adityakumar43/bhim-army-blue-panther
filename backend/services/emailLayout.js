import { ORG } from '../config/org.js'

// One look for every email the website sends: the logo and name on navy at the top, the message on a
// white card, and the slogan, address and website at the bottom. sendMail() puts every email in it.
// Built with tables and inline styles, because that is what email apps (Gmail, Outlook, phones) understand.

const NAVY = '#0A1A3F'
const BRAND = '#0B3C9D'
const GOLD = '#F2B705'
const FONT = "'Segoe UI', Roboto, Arial, 'Noto Sans Devanagari', sans-serif"

export const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const site = () => (process.env.CLIENT_URL || '').replace(/\/+$/, '')

// A big blue button that works in every email app (also Outlook)
export function button(label, url) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0"><tr>
<td bgcolor="${BRAND}" style="border-radius:10px">
<a href="${esc(url)}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)}</a>
</td></tr></table>`
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

export function emailLayout({ html, text, subject }) {
    const url = site()
    const host = url.replace(/^https?:\/\//, '')
    const logo = url ? `<img src="${esc(url)}/icons/icon-192.png" width="52" height="52" alt="" style="display:block;border:0;border-radius:50%;background:#ffffff">` : ''
    return `<!doctype html>
<html lang="hi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<style>
  @media (max-width:620px) { .card { padding:22px 18px !important } .wrap { padding:12px 8px !important } }
  a { color:${BRAND} }
</style>
</head>
<body style="margin:0;padding:0;background:#EEF2F9">
${preview(text)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EEF2F9" style="background:#EEF2F9">
<tr><td class="wrap" align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">

<tr><td bgcolor="${NAVY}" style="background:${NAVY};border-radius:16px 16px 0 0;padding:18px 24px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${logo ? `<td style="padding-right:14px;vertical-align:middle">${logo}</td>` : ''}
<td style="vertical-align:middle;font-family:${FONT}">
<div style="font-size:21px;font-weight:bold;color:#ffffff;line-height:1.25">भीम आर्मी ब्लू पैंथर</div>
<div style="font-size:10px;font-weight:bold;color:${GOLD};letter-spacing:2px;line-height:1.6;white-space:nowrap">${esc(ORG.name.toUpperCase())}</div>
</td></tr></table>
</td></tr>
<tr><td bgcolor="${GOLD}" style="background:${GOLD};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>

<tr><td class="card" bgcolor="#ffffff" style="background:#ffffff;padding:30px 32px;font-family:${FONT};font-size:16px;line-height:1.65;color:${NAVY};border-radius:0 0 16px 16px">
${html}
</td></tr>

<tr><td align="center" style="padding:22px 16px 8px;font-family:${FONT};font-size:13px;line-height:1.7;color:#5B6785">
<div style="color:${BRAND};font-weight:bold">शिक्षित बनो · संगठित रहो · संघर्ष करो</div>
<div>${esc(ORG.name)}${ORG.address ? ` · ${esc(ORG.address)}` : ''}</div>
${url ? `<div><a href="${esc(url)}" style="color:#5B6785">${esc(host)}</a></div>` : ''}
</td></tr>

</table>
</td></tr></table>
</body></html>`
}