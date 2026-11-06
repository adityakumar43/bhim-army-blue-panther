import { Router } from 'express'
import mongoose from 'mongoose'
import { News, Event } from '../models/Content.js'

// Link previews for WhatsApp, Facebook, Telegram and X.
// These apps do not run the website's JavaScript, so they cannot see a news title or photo on the normal page.
// The Share button links here instead: this page has the title and photo in its tags for the apps,
// and sends real people straight on to the normal page.
const router = Router()
const ORG = 'Bhim Army Blue Panther'
const TAGLINE = 'शिक्षित बनो, संगठित रहो, संघर्ष करो'
const MODELS = { news: News, events: Event }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const site = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
const short = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t }
// Cloudinary can make a 1200 x 630 copy of the photo, the size these apps show best
const shareImage = (url) => (url && url.includes('/upload/') ? url.replace('/upload/', '/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/') : url)
const visible = (d) => d && d.draft !== true && (!d.publishAt || new Date(d.publishAt) <= new Date())

function page({ title, description, image, url }) {
    return `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(ORG)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head>
<body><p><a href="${esc(url)}">${esc(title)}</a></p><script>location.replace(${JSON.stringify(url)})</script></body>
</html>`
}

// The Samvidhan Divas page. Shared certificates and quiz scores link here with the sharer's name and score,
// so WhatsApp shows a personal title ("Ravi scored 8/10, can you beat them?") over the Samvidhan picture,
// and the friend who opens it lands on the right part of the page with the same greeting.
//   /share/samvidhan?by=Ravi&score=8&q=1234&lang=en   -> quiz challenge (q = which questions, so the friend gets the same ones)
//   /share/samvidhan?by=Ravi&lang=hi           -> "Ravi took the pledge"
router.get('/samvidhan', (req, res) => {
    const en = req.query.lang === 'en'
    // A first name only, letters and spaces (it is shown in the preview and on the page)
    const by = String(req.query.by || '').normalize('NFC').replace(/[^\p{L}\p{M} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40)
    const score = /^(10|[0-9])$/.test(String(req.query.score || '')) ? Number(req.query.score) : null
    const total = 10

    let title, description, part
    if (score !== null) {
        part = 'quiz'
        title = en
            ? `🧠 ${by || 'A friend'} scored ${score}/${total} in the Constitution quiz. Can you beat that?`
            : `🧠 ${by || 'आपके दोस्त'} ने संविधान प्रश्नोत्तरी में ${score}/${total} पाए। क्या आप आगे निकल सकते हैं?`
        description = en ? '10 quick questions about our Constitution and Dr. Ambedkar. Samvidhan Divas, 26 November.' : 'हमारे संविधान और डॉ. आंबेडकर पर 10 आसान सवाल। संविधान दिवस, 26 नवंबर।'
    } else if (by) {
        part = 'pledge'
        title = en ? `✋ ${by} took the pledge for the Constitution. Take yours too!` : `✋ ${by} ने संविधान की शपथ ली। आप भी लें!`
        description = en ? 'Read the Preamble, take the pledge and get your own certificate. Samvidhan Divas, 26 November.' : 'उद्देशिका पढ़ें, शपथ लें और अपना प्रमाण पत्र पाएँ। संविधान दिवस, 26 नवंबर।'
    } else {
        part = ''
        title = en ? 'Samvidhan Divas: read the Preamble and take the pledge' : 'संविधान दिवस: उद्देशिका पढ़ें और शपथ लें'
        description = en ? 'Take the pledge, get your certificate and play the Constitution quiz.' : 'शपथ लें, अपना प्रमाण पत्र पाएँ और संविधान प्रश्नोत्तरी खेलें।'
    }

    const q = new URLSearchParams()
    if (by) q.set('by', by)
    if (score !== null) q.set('score', String(score))
    if (score !== null && /^[1-9]\d{0,5}$/.test(String(req.query.q || ''))) q.set('q', String(req.query.q))
    const url = `${site()}/samvidhan${q.size ? `?${q}` : ''}${part ? `#${part}` : ''}`
    res.set('Cache-Control', 'public, max-age=3600')
    res.type('html').send(page({ title, description, image: `${site()}/og-samvidhan.jpg`, url }))
})

router.get('/:kind/:id', async (req, res) => {
    const Model = MODELS[req.params.kind]
    const fallback = `${site()}/${req.params.kind === 'events' ? 'news' : req.params.kind || ''}`
    if (!Model || !mongoose.isValidObjectId(req.params.id)) return res.redirect(302, site())
    const item = await Model.findById(req.params.id).lean()
    if (!visible(item)) return res.redirect(302, fallback)

    const url = `${site()}/${req.params.kind}/${item._id}`
    const title = short(item.titleHi || item.titleEn, 110) || ORG
    let description = short(item.bodyHi || item.bodyEn, 180)
    if (req.params.kind === 'events' && item.date) {
        const when = new Date(item.date).toLocaleDateString('hi-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' })
        description = short(`📅 ${when}${item.location ? ` · 📍 ${item.location}` : ''}${description ? ` — ${description}` : ''}`, 200)
    }
    res.set('Cache-Control', 'public, max-age=600')
    res.type('html').send(page({
        title,
        description: description || `${ORG} — ${TAGLINE}`,
        image: shareImage(item.image?.url) || process.env.SHARE_IMAGE || `${site()}/og-default.jpg`,
        url,
    }))
})

export default router