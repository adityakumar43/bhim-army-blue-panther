import { loadImage, wrap, roundRect } from './poster.js'
import { stateByCode, stateName } from '../data/states.js'
import { districtsOf, districtName } from '../data/districts.js'

// The Samvidhan pledge certificate: a 1600 × 1131 picture (the shape of an A4 page lying down),
// drawn in the browser from what the server sent back, so it can be downloaded, printed or shared.
const W = 1600
const H = 1131
const NAVY = '#0a1a3f'
const BRAND = '#0b3c9d'
const GOLD = '#c99700'
const GOLD_LIGHT = '#f2c94c'
const PAPER = '#fffaf0'
const FONT = 'Mukta, "Noto Sans Devanagari", sans-serif'

// "agra, uttar pradesh" in the page language
function placeText(pledge, lang) {
    const s = stateByCode(pledge.stateCode)
    const d = pledge.district && districtsOf(pledge.stateCode).find((x) => x[0] === pledge.district)
    return [d ? districtName(d, lang) : pledge.district, s ? stateName(s, lang) : ''].filter(Boolean).join(', ')
}

// "ravi kumar" -> "Ravi Kumar" (names typed in Hindi have no capitals and stay as they are)
const properName = (n) => String(n || '').trim().replace(/\s+/g, ' ').replace(/(^|\s)([a-z])/g, (m, sp, c) => sp + c.toUpperCase())

function centred(ctx, text, y, font, color) {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(text, W / 2, y)
}

// A gold corner ornament: two lines meeting in an L, with a small diamond at the corner
function corner(ctx, x, y, dx, dy) {
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y + dy * 90); ctx.lineTo(x, y); ctx.lineTo(x + dx * 90, y)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x + dx * 14, y + dy * 60); ctx.lineTo(x + dx * 14, y + dy * 14); ctx.lineTo(x + dx * 60, y + dy * 14)
    ctx.stroke()
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.moveTo(x + dx * 14, y + dy * 4); ctx.lineTo(x + dx * 24, y + dy * 14); ctx.lineTo(x + dx * 14, y + dy * 24); ctx.lineTo(x + dx * 4, y + dy * 14)
    ctx.closePath(); ctx.fill()
}

// A short gold rule with a diamond in the middle, under a heading
function divider(ctx, y, half) {
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2 - half, y); ctx.lineTo(W / 2 - 14, y); ctx.moveTo(W / 2 + 14, y); ctx.lineTo(W / 2 + half, y); ctx.stroke()
    ctx.fillStyle = GOLD
    ctx.beginPath(); ctx.moveTo(W / 2, y - 8); ctx.lineTo(W / 2 + 8, y); ctx.lineTo(W / 2, y + 8); ctx.lineTo(W / 2 - 8, y); ctx.closePath(); ctx.fill()
}

// A round gold seal with a notched edge, showing the date of the pledge
function seal(ctx, cx, cy, day, month, year) {
    const points = 36
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
        const a = (i * Math.PI) / points
        const r = i % 2 ? 74 : 82
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
    }
    ctx.closePath()
    const g = ctx.createRadialGradient(cx - 20, cy - 25, 10, cx, cy, 85)
    g.addColorStop(0, GOLD_LIGHT)
    g.addColorStop(1, GOLD)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = 'rgba(10,26,63,0.55)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillStyle = NAVY
    ctx.font = `800 17px ${FONT}`
    ctx.fillText(month, cx, cy - 22)
    ctx.font = `800 40px ${FONT}`
    ctx.fillText(day, cx, cy + 17)
    ctx.font = `800 17px ${FONT}`
    ctx.fillText(year, cx, cy + 40)
}

export async function makeCertificate({ pledge, lang, t }) {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Wait for the website's font, so Hindi letters are drawn properly
    try { await Promise.all([document.fonts.load('800 60px Mukta', 'अ A'), document.fonts.load('600 30px Mukta', 'अ A')]) } catch { /* fallback font */ }
    const [logo, ambedkar] = await Promise.all([loadImage('/logo.png'), loadImage('/inspirations/ambedkar-round.jpg')])

    // Paper with a soft warm glow in the middle
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900)
    glow.addColorStop(0, 'rgba(255,255,255,0.9)')
    glow.addColorStop(1, 'rgba(242,201,76,0.06)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // A large, very faint logo in the middle (like a watermark on official paper)
    if (logo) {
        ctx.save()
        ctx.globalAlpha = 0.05
        ctx.drawImage(logo, W / 2 - 300, H / 2 - 260, 600, 600)
        ctx.restore()
    }

    // Frame: navy band, then a double gold line, then gold corner ornaments
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 26
    ctx.strokeRect(13, 13, W - 26, H - 26)
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 4
    ctx.strokeRect(42, 42, W - 84, H - 84)
    ctx.lineWidth = 1.5
    ctx.strokeRect(52, 52, W - 104, H - 104)
    corner(ctx, 66, 66, 1, 1)
    corner(ctx, W - 66, 66, -1, 1)
    corner(ctx, 66, H - 66, 1, -1)
    corner(ctx, W - 66, H - 66, -1, -1)

    // Header: logo on the left, Dr. Ambedkar on the right, the organisation in the middle
    const S = 140
    if (logo) ctx.drawImage(logo, 120, 92, S, S)
    if (ambedkar) {
        const cx = W - 120 - S / 2, cy = 92 + S / 2
        ctx.save()
        ctx.beginPath(); ctx.arc(cx, cy, S / 2, 0, Math.PI * 2); ctx.clip()
        ctx.drawImage(ambedkar, cx - S / 2, cy - S / 2, S, S)
        ctx.restore()
        ctx.strokeStyle = GOLD; ctx.lineWidth = 5
        ctx.beginPath(); ctx.arc(cx, cy, S / 2, 0, Math.PI * 2); ctx.stroke()
    }
    centred(ctx, t('org'), 150, `800 42px ${FONT}`, NAVY)
    centred(ctx, t('samvidhan.cert.sub'), 196, `700 27px ${FONT}`, GOLD)

    // Title, with a gold rule and diamond under it
    centred(ctx, t('samvidhan.cert.title'), 312, `800 70px ${FONT}`, BRAND)
    divider(ctx, 346, 210)

    // The person: name in capitals, a thin gold line under it, then their place
    centred(ctx, t('samvidhan.cert.certify'), 420, `600 31px ${FONT}`, 'rgba(10,26,63,0.75)')
    const name = properName(pledge.name)
    let size = 86
    ctx.font = `800 ${size}px ${FONT}`
    while (ctx.measureText(name).width > W - 420 && size > 46) { size -= 4; ctx.font = `800 ${size}px ${FONT}` }
    centred(ctx, name, 518, `800 ${size}px ${FONT}`, NAVY)
    const nameW = Math.max(360, Math.min(W - 400, ctx.measureText(name).width + 120))
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2 - nameW / 2, 546); ctx.lineTo(W / 2 + nameW / 2, 546); ctx.stroke()
    const place = placeText(pledge, lang)
    if (place) centred(ctx, place, 592, `700 32px ${FONT}`, BRAND)

    // What they pledged
    ctx.font = `500 32px ${FONT}`
    ctx.fillStyle = NAVY
    ctx.textAlign = 'center'
    wrap(ctx, t('samvidhan.cert.body'), W - 460, 3).forEach((line, i) => ctx.fillText(line, W / 2, 664 + i * 46))

    // The four values of the Preamble as gold-edged badges
    const values = t('samvidhan.cert.values').split('|')
    ctx.font = `800 26px ${FONT}`
    const pad = 30, gap = 18
    const widths = values.map((v) => ctx.measureText(v).width + pad * 2)
    let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + gap * (values.length - 1)) / 2
    values.forEach((v, i) => {
        roundRect(ctx, x, 778, widths[i], 50, 25)
        ctx.fillStyle = 'rgba(242,201,76,0.18)'
        ctx.fill()
        ctx.strokeStyle = GOLD
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = NAVY
        ctx.textAlign = 'center'
        ctx.fillText(v, x + widths[i] / 2, 812)
        x += widths[i] + gap
    })

    // Footer: number on the left, the seal in the middle, date on the right; slogan and address below
    const when = new Date(pledge.date)
    const opts = { timeZone: 'Asia/Kolkata' }
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
    const date = when.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', ...opts })
    const label = (s, xx, align) => { ctx.font = `600 22px ${FONT}`; ctx.fillStyle = 'rgba(10,26,63,0.55)'; ctx.textAlign = align; ctx.fillText(s, xx, 905) }
    const value = (s, xx, align) => { ctx.font = `800 30px ${FONT}`; ctx.fillStyle = NAVY; ctx.textAlign = align; ctx.fillText(s, xx, 945) }
    label(t('samvidhan.cert.no'), 160, 'left'); value(pledge.certNo, 160, 'left')
    label(t('samvidhan.cert.date'), W - 160, 'right'); value(date, W - 160, 'right')
    ctx.strokeStyle = 'rgba(10,26,63,0.25)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(160, 965); ctx.lineTo(560, 965); ctx.moveTo(W - 560, 965); ctx.lineTo(W - 160, 965); ctx.stroke()
    seal(ctx, W / 2, 922,
        when.toLocaleDateString('en-IN', { day: 'numeric', ...opts }),
        lang === 'hi' ? when.toLocaleDateString('hi-IN', { month: 'long', ...opts }) : when.toLocaleDateString('en-IN', { month: 'short', ...opts }).toUpperCase(),
        when.toLocaleDateString('en-IN', { year: 'numeric', ...opts }))
    centred(ctx, t('samvidhan.cert.slogan'), 1040, `800 28px ${FONT}`, BRAND)
    centred(ctx, 'bhimarmybluepanther.org/samvidhan', 1068, `600 19px ${FONT}`, 'rgba(10,26,63,0.5)')

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No picture'))), 'image/png'))
}
