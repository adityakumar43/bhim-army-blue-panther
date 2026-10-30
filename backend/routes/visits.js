import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { VisitDay, VisitorMark } from '../models/Visit.js'
import { News, Event } from '../models/Content.js'
import { protect, requireAny } from '../middleware/auth.js'

// Visitor numbers for the admin panel: how many people visit, which pages they read, how they found the site.
const router = Router()
const TZ = 'Asia/Kolkata'
const dayOf = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|telegram|headless|lighthouse|monitor|curl|wget|python|axios|node-fetch/i
// Map keys cannot hold dots or start with $
const keySafe = (s) => String(s).replace(/\./g, '%2E').replace(/^\$/, '%24').slice(0, 120)
const keyBack = (s) => s.replace(/%2E/g, '.').replace(/^%24/, '$')

// Where they came from, from the address of the page that linked here
function sourceOf(ref, site, app) {
    if (app) return 'app'
    if (!ref) return 'direct'
    let host = ''
    try { host = new URL(ref).hostname.replace(/^www\./, '').replace(/^m\./, '').replace(/^l\./, '').replace(/^lm\./, '') } catch { return 'direct' }
    if (!host || (site && host === site)) return null // moving around inside our own site: not a new arrival
    if (/google\./.test(host)) return 'google'
    if (/facebook\.com|fb\.com/.test(host)) return 'facebook'
    if (/instagram\.com/.test(host)) return 'instagram'
    if (/whatsapp/.test(host)) return 'whatsapp'
    if (/youtube\.com|youtu\.be/.test(host)) return 'youtube'
    if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return 'x'
    if (/bing\.com|duckduckgo|yahoo\./.test(host)) return 'search'
    return host.slice(0, 60)
}

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: false, legacyHeaders: false, message: { ok: false } })

// One page opened. Always answers "ok" quickly; counting problems never bother the visitor.
router.post('/', limiter, async (req, res) => {
    res.json({ ok: true })
    try {
        const ua = String(req.get('user-agent') || '')
        if (!ua || BOT.test(ua)) return
        const b = req.body || {}
        const path = String(b.path || '').split('?')[0].split('#')[0]
        if (!/^\/[^\s]{0,200}$/.test(path) || /^\/(admin|card|receipt|certificate|unsubscribe|membership\/update)(\/|$)/.test(path)) return
        const day = dayOf()
        const site = (() => { try { return new URL(process.env.CLIENT_URL).hostname.replace(/^www\./, '') } catch { return '' } })()
        const app = b.app === true
        const device = app ? 'app' : /mobile|android|iphone|ipad/i.test(ua) ? 'phone' : 'computer'
        const lang = b.lang === 'en' ? 'en' : 'hi'

        // A new person today? (the scrambled code changes every day and cannot be traced back)
        const code = crypto.createHmac('sha256', `${process.env.JWT_SECRET || 'visits'}:${day}`).update(`${req.ip}|${ua}`).digest('base64url').slice(0, 22)
        let isNew = false
        try { await VisitorMark.create({ _id: `${day}:${code}` }); isNew = true } catch (err) { if (err.code !== 11000) throw err }

        const inc = { views: 1, [`pages.${keySafe(path)}`]: 1 }
        const source = sourceOf(String(b.ref || ''), site, app)
        if (isNew) Object.assign(inc, { visitors: 1, [`devices.${device}`]: 1, [`langs.${lang}`]: 1, [`sources.${keySafe(source || 'direct')}`]: 1 })
        await VisitDay.updateOne({ day }, { $inc: inc }, { upsert: true })
    } catch (err) {
        console.error('Visit count failed:', err.message)
    }
})

// The numbers for the last 7, 30 or 90 days
router.get('/', protect, requireAny('content', 'members'), async (req, res) => {
    const range = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30
    const days = Array.from({ length: range }, (_, i) => dayOf(new Date(Date.now() - (range - 1 - i) * 864e5)))
    const rows = await VisitDay.find({ day: { $gte: days[0] } }).lean()
    const byDay = Object.fromEntries(rows.map((r) => [r.day, r]))
    const add = (into, map) => { for (const [k, v] of Object.entries(map || {})) into[keyBack(k)] = (into[keyBack(k)] || 0) + v }
    const pages = {}, sources = {}, devices = {}, langs = {}
    for (const r of rows) { add(pages, r.pages); add(sources, r.sources); add(devices, r.devices); add(langs, r.langs) }
    const top = (o, n) => Object.entries(o).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, n)

    // Give news and event pages their titles
    const topPages = top(pages, 15)
    const ids = (prefix) => topPages.map((p) => p.key.match(new RegExp(`^/${prefix}/([a-f0-9]{24})$`))?.[1]).filter(Boolean)
    const [news, events] = await Promise.all([
        News.find({ _id: { $in: ids('news') } }).select('titleHi titleEn').lean(),
        Event.find({ _id: { $in: ids('events') } }).select('titleHi titleEn').lean(),
    ])
    const titles = Object.fromEntries([...news.map((n) => [`/news/${n._id}`, n.titleEn || n.titleHi]), ...events.map((e) => [`/events/${e._id}`, e.titleEn || e.titleHi])])

    const perDay = days.map((d) => ({ day: d, visitors: byDay[d]?.visitors || 0, views: byDay[d]?.views || 0 }))
    const today = perDay.at(-1)
    res.json({
        days: range,
        visitors: perDay.reduce((s, d) => s + d.visitors, 0),
        views: perDay.reduce((s, d) => s + d.views, 0),
        today,
        perDay,
        pages: topPages.map((p) => ({ ...p, title: titles[p.key] || null })),
        sources: top(sources, 10),
        devices: top(devices, 3),
        langs: top(langs, 2),
    })
})

export default router