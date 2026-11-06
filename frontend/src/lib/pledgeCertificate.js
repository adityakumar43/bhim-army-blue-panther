import { loadImage, wrap } from './poster.js'
import { stateByCode, stateName } from '../data/states.js'
import { districtsOf, districtName } from '../data/districts.js'

// The Samvidhan pledge certificate: a 1600 × 1131 picture (the shape of an A4 page lying down),
// drawn in the browser from what the server sent back, so it can be downloaded, printed or shared.
const W = 1600
const H = 1131
const NAVY = '#0a1a3f'
const BRAND = '#0b3c9d'
const GOLD = '#c99700'
const PAPER = '#fffaf0'
const FONT = 'Mukta, "Noto Sans Devanagari", sans-serif'

// "Agra, Uttar Pradesh" in the page language
function placeText(pledge, lang) {
    const s = stateByCode(pledge.stateCode)
    const d = pledge.district && districtsOf(pledge.stateCode).find((x) => x[0] === pledge.district)
    return [d ? districtName(d, lang) : pledge.district, s ? stateName(s, lang) : ''].filter(Boolean).join(', ')
}

function centred(ctx, text, y, font, color) {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(text, W / 2, y)
}

export async function makeCertificate({ pledge, lang, t }) {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Wait for the website's font, so Hindi letters are drawn properly
    try { await Promise.all([document.fonts.load('800 60px Mukta', 'अ A'), document.fonts.load('600 30px Mukta', 'अ A')]) } catch { /* fallback font */ }
    const [logo, ambedkar] = await Promise.all([loadImage('/logo.png'), loadImage('/inspirations/ambedkar-round.jpg')])

    // Paper, a navy frame and a thin gold line inside it
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 28
    ctx.strokeRect(14, 14, W - 28, H - 28)
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 3
    ctx.strokeRect(48, 48, W - 96, H - 96)

    // Header: the logo on the left, Dr. Ambedkar on the right (in a circle), the organisation in the middle
    const S = 150
    if (logo) ctx.drawImage(logo, 100, 80, S, S)
    if (ambedkar) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(W - 100 - S / 2, 80 + S / 2, S / 2, 0, Math.PI * 2)
        ctx.clip()
        const scale = Math.max(S / ambedkar.width, S / ambedkar.height)
        const sw = S / scale, sh = S / scale
        ctx.drawImage(ambedkar, (ambedkar.width - sw) / 2, 0, sw, sh, W - 100 - S, 80, S, S)
        ctx.restore()
        ctx.strokeStyle = GOLD
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(W - 100 - S / 2, 80 + S / 2, S / 2, 0, Math.PI * 2)
        ctx.stroke()
    }
    centred(ctx, t('org'), 140, `800 40px ${FONT}`, NAVY)
    centred(ctx, t('samvidhan.cert.sub'), 192, `700 28px ${FONT}`, GOLD)

    // Title with a gold rule under it
    centred(ctx, t('samvidhan.cert.title'), 318, `800 72px ${FONT}`, BRAND)
    ctx.fillStyle = GOLD
    ctx.fillRect(W / 2 - 160, 348, 320, 4)

    // The person
    centred(ctx, t('samvidhan.cert.certify'), 430, `600 32px ${FONT}`, NAVY)
    ctx.font = `800 76px ${FONT}`
    let size = 76
    while (ctx.measureText(pledge.name).width > W - 360 && size > 44) { size -= 4; ctx.font = `800 ${size}px ${FONT}` }
    centred(ctx, pledge.name, 530, `800 ${size}px ${FONT}`, NAVY)
    const place = placeText(pledge, lang)
    if (place) centred(ctx, place, 590, `600 34px ${FONT}`, BRAND)

    // What they pledged
    ctx.font = `500 34px ${FONT}`
    ctx.fillStyle = NAVY
    ctx.textAlign = 'center'
    wrap(ctx, t('samvidhan.cert.body'), W - 420, 3).forEach((line, i) => ctx.fillText(line, W / 2, 680 + i * 50))

    // Footer: number, date, slogan; and the address of the page
    const date = new Date(pledge.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    ctx.fillStyle = 'rgba(10,26,63,0.15)'
    ctx.fillRect(140, 880, W - 280, 2)
    ctx.font = `600 26px ${FONT}`
    ctx.fillStyle = NAVY
    ctx.textAlign = 'left'
    ctx.fillText(`${t('samvidhan.cert.no')}: ${pledge.certNo}`, 140, 930)
    ctx.textAlign = 'center'
    ctx.fillText(`${t('samvidhan.cert.date')}: ${date}`, W / 2, 930)
    ctx.textAlign = 'right'
    ctx.fillStyle = BRAND
    ctx.font = `800 28px ${FONT}`
    ctx.fillText(t('samvidhan.cert.slogan'), W - 140, 930)
    centred(ctx, 'bhimarmybluepanther.org/samvidhan', 1010, `600 24px ${FONT}`, 'rgba(10,26,63,0.55)')

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No picture'))), 'image/png'))
}
