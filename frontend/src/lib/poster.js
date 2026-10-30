import { pickText, formatDate } from './text.js'
import { timeText } from './calendar.js'
import { large } from './img.js'

// A ready-to-share poster (1080 × 1350, the shape WhatsApp and Instagram show best) for a news item or an event.
// It is drawn in the browser, so nothing is stored on the server.
const W = 1080
const H = 1350
const NAVY = '#0a1a3f'
const BRAND = '#0b3c9d'
const GOLD = '#f2b705'
const FONT = 'Mukta, "Noto Sans Devanagari", sans-serif'

function loadImage(src) {
    return new Promise((resolve) => {
        if (!src) return resolve(null)
        const img = new Image()
        img.crossOrigin = 'anonymous' // so the picture can be put in the poster (Cloudinary allows this)
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null) // no photo: the poster is still made, with the logo instead
        img.src = src
    })
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

// Draw a picture filling the box, cut to fit (like CSS object-fit: cover)
function drawCover(ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height)
    const sw = w / scale
    const sh = h / scale
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

// Split text into lines that fit the width; the last line ends with … if the text is too long
function wrap(ctx, text, maxWidth, maxLines) {
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ')
    const lines = []
    let line = ''
    for (const word of words) {
        const next = line ? `${line} ${word}` : word
        if (ctx.measureText(next).width <= maxWidth || !line) line = next
        else { lines.push(line); line = word }
    }
    if (line) lines.push(line)
    if (lines.length > maxLines) {
        let last = lines[maxLines - 1]
        while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.split(' ').slice(0, -1).join(' ')
        return [...lines.slice(0, maxLines - 1), `${last}…`]
    }
    return lines
}

export async function makePoster({ item, kind, lang, t }) {
    const isEvent = kind === 'events'
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Wait for the website's font, so Hindi letters are drawn properly
    try { await Promise.all([document.fonts.load(`800 60px Mukta`, 'अ A'), document.fonts.load(`600 30px Mukta`, 'अ A')]) } catch { /* use the fallback font */ }
    const [logo, photo] = await Promise.all([loadImage('/logo.png'), loadImage(item.image?.url ? large(item.image.url, 1200) : '')])

    // Background: navy with a soft blue glow
    ctx.fillStyle = NAVY
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(150, 100, 50, 150, 100, 900)
    glow.addColorStop(0, 'rgba(11,60,157,0.9)')
    glow.addColorStop(1, 'rgba(11,60,157,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Header: logo and name
    if (logo) ctx.drawImage(logo, 60, 52, 96, 96)
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#fff'
    ctx.font = `800 46px ${FONT}`
    ctx.fillText('भीम आर्मी ब्लू पैंथर', 176, 100)
    ctx.fillStyle = GOLD
    ctx.font = `600 22px ${FONT}`
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px'
    ctx.fillText('BHIM ARMY BLUE PANTHER', 178, 136)
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'

    // The photo (or the logo on blue when there is none)
    const px = 60, py = 190, pw = W - 120, ph = 540
    ctx.save()
    roundRect(ctx, px, py, pw, ph, 32)
    ctx.clip()
    if (photo) {
        drawCover(ctx, photo, px, py, pw, ph)
    } else {
        const g = ctx.createLinearGradient(px, py, px + pw, py + ph)
        g.addColorStop(0, BRAND)
        g.addColorStop(1, '#14286b')
        ctx.fillStyle = g
        ctx.fillRect(px, py, pw, ph)
        if (logo) { ctx.globalAlpha = 0.25; ctx.drawImage(logo, W / 2 - 190, py + ph / 2 - 190, 380, 380); ctx.globalAlpha = 1 }
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(242,183,5,0.6)'
    ctx.lineWidth = 4
    roundRect(ctx, px, py, pw, ph, 32)
    ctx.stroke()

    // Label: EVENT or NEWS
    let y = py + ph + 50
    const label = isEvent ? t('poster.event', { defaultValue: 'Event' }) : t('poster.news', { defaultValue: 'News' })
    ctx.font = `800 28px ${FONT}`
    const lw = ctx.measureText(label).width + 44
    ctx.fillStyle = GOLD
    roundRect(ctx, 60, y, lw, 50, 25)
    ctx.fill()
    ctx.fillStyle = NAVY
    ctx.fillText(label, 82, y + 35)

    // Title
    y += 120
    ctx.fillStyle = '#fff'
    ctx.font = `800 62px ${FONT}`
    const titleLines = wrap(ctx, pickText(item, 'title', lang), W - 120, isEvent ? 3 : 4)
    for (const line of titleLines) { ctx.fillText(line, 60, y); y += 78 }

    // When and where
    y += 6
    if (isEvent) {
        ctx.fillStyle = GOLD
        ctx.font = `600 38px ${FONT}`
        const when = [formatDate(item.date, lang), item.time && timeText(item.time, lang)].filter(Boolean).join(' · ')
        ctx.fillText(when, 60, y)
        if (item.location) {
            y += 54
            ctx.fillStyle = 'rgba(255,255,255,0.88)'
            ctx.font = `600 34px ${FONT}`
            ctx.fillText(wrap(ctx, item.location, W - 120, 1)[0], 60, y)
        }
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = `600 32px ${FONT}`
        ctx.fillText(formatDate(item.createdAt, lang), 60, y)
    }

    // Bottom band: the slogan and the website address
    ctx.fillStyle = BRAND
    ctx.fillRect(0, H - 130, W, 130)
    ctx.fillStyle = GOLD
    ctx.fillRect(0, H - 130, W, 6)
    ctx.textAlign = 'center'
    ctx.fillStyle = GOLD
    ctx.font = `800 32px ${FONT}`
    ctx.fillText(['educate', 'organize', 'struggle'].map((k) => t(`about.${k}.title`)).join(' · '), W / 2, H - 72)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `600 28px ${FONT}`
    ctx.fillText(window.location.host.replace(/^www\./, ''), W / 2, H - 30)
    ctx.textAlign = 'left'

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the poster'))), 'image/png'))
}