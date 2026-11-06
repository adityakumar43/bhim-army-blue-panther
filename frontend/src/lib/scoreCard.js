import { loadImage, roundRect } from './poster.js'

// The Constitution quiz score card: a 1080 × 1080 picture (square, good for WhatsApp chats and Status),
// drawn in the browser, so nothing is stored on the server.
const S = 1080
const NAVY = '#0a1a3f'
const GOLD = '#f2b705'
const FONT = 'Mukta, "Noto Sans Devanagari", sans-serif'

// A title for the score: what people like to show off
export function scoreTier(score, total) {
    const r = score / total
    return r >= 0.9 ? 'champion' : r >= 0.7 ? 'expert' : r >= 0.5 ? 'good' : 'learning'
}

function text(ctx, s, x, y, font, color, align = 'center') {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(s, x, y)
}

// A five-pointed star
function star(ctx, cx, cy, r, filled) {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const rr = i % 2 ? r * 0.45 : r
        ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a))
    }
    ctx.closePath()
    ctx.fillStyle = filled ? GOLD : 'rgba(255,255,255,0.18)'
    ctx.fill()
}

export async function makeScoreCard({ score, total, name, t }) {
    const canvas = document.createElement('canvas')
    canvas.width = S
    canvas.height = S
    const ctx = canvas.getContext('2d')
    try { await Promise.all([document.fonts.load('800 60px Mukta', 'अ A'), document.fonts.load('600 30px Mukta', 'अ A')]) } catch { /* fallback font */ }
    const [logo, photo] = await Promise.all([loadImage('/logo.png'), loadImage('/inspirations/ambedkar-round.jpg')])

    // Navy background with a blue glow, and a gold strip on the left
    ctx.fillStyle = NAVY
    ctx.fillRect(0, 0, S, S)
    const glow = ctx.createRadialGradient(S / 2, 470, 60, S / 2, 470, 700)
    glow.addColorStop(0, 'rgba(11,60,157,0.95)')
    glow.addColorStop(1, 'rgba(11,60,157,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, S, S)
    ctx.fillStyle = GOLD
    ctx.fillRect(0, 0, 14, S)

    // Header: logo + organisation on the left, Dr. Ambedkar in a circle on the right
    if (logo) ctx.drawImage(logo, 60, 50, 96, 96)
    text(ctx, t('org'), 172, 92, `800 34px ${FONT}`, '#ffffff', 'left')
    text(ctx, t('samvidhan.card.title'), 172, 134, `700 28px ${FONT}`, GOLD, 'left')
    if (photo) {
        ctx.save()
        ctx.beginPath(); ctx.arc(S - 120, 98, 62, 0, Math.PI * 2); ctx.clip()
        ctx.drawImage(photo, S - 182, 36, 124, 124)
        ctx.restore()
        ctx.strokeStyle = GOLD; ctx.lineWidth = 5
        ctx.beginPath(); ctx.arc(S - 120, 98, 62, 0, Math.PI * 2); ctx.stroke()
    }

    // Whose score
    const who = name ? t('samvidhan.card.whose', { name }) : t('samvidhan.card.my')
    ctx.font = `800 52px ${FONT}`
    let size = 52
    while (ctx.measureText(who).width > S - 160 && size > 32) { size -= 4; ctx.font = `800 ${size}px ${FONT}` }
    text(ctx, who, S / 2, 270, `800 ${size}px ${FONT}`, '#ffffff')

    // The score in a big gold ring
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 16
    ctx.beginPath(); ctx.arc(S / 2, 470, 150, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(242,183,5,0.25)'
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(S / 2, 470, 178, 0, Math.PI * 2); ctx.stroke()
    ctx.textBaseline = 'middle'
    // The number and "/10" side by side, centred together in the ring
    ctx.font = `800 150px ${FONT}`
    const wNum = ctx.measureText(String(score)).width
    ctx.font = `700 52px ${FONT}`
    const wTot = ctx.measureText(`/${total}`).width
    const left = S / 2 - (wNum + 6 + wTot) / 2
    text(ctx, String(score), left, 462, `800 150px ${FONT}`, '#ffffff', 'left')
    text(ctx, `/${total}`, left + wNum + 6, 500, `700 52px ${FONT}`, GOLD, 'left')
    ctx.textBaseline = 'alphabetic'

    // Five stars, filled for the share of right answers
    const filled = Math.round((score / total) * 5)
    for (let i = 0; i < 5; i++) star(ctx, S / 2 - 160 + i * 80, 700, 30, i < filled)

    // The title they earned, on a gold pill
    const tier = t(`samvidhan.card.${scoreTier(score, total)}`)
    ctx.font = `800 40px ${FONT}`
    const w = ctx.measureText(tier).width + 80
    ctx.fillStyle = GOLD
    roundRect(ctx, S / 2 - w / 2, 760, w, 74, 37); ctx.fill() // works on older phones too
    text(ctx, tier, S / 2, 811, `800 40px ${FONT}`, NAVY)

    // The challenge, and where to play
    text(ctx, t('samvidhan.card.beat'), S / 2, 920, `700 38px ${FONT}`, '#ffffff')
    text(ctx, 'bhimarmybluepanther.org/samvidhan', S / 2, 975, `700 30px ${FONT}`, GOLD)
    text(ctx, t('samvidhan.cert.slogan'), S / 2, 1035, `600 26px ${FONT}`, 'rgba(255,255,255,0.7)')

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No picture'))), 'image/png'))
}
