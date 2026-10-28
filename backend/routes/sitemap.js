import { Router } from 'express'
import { News, Event } from '../models/Content.js'
import { STATE_NAMES } from '../config/stateNames.js'

// /sitemap.xml: the list of every public page, so Google and Bing can find them all.
// robots.txt on the website points here.
const router = Router()

const PAGES = [
    ['/', 'daily', '1.0'],
    ['/news', 'daily', '0.9'],
    ['/about', 'monthly', '0.8'],
    ['/join', 'monthly', '0.9'],
    ['/campaigns', 'weekly', '0.8'],
    ['/gallery', 'weekly', '0.7'],
    ['/videos', 'weekly', '0.7'],
    ['/downloads', 'weekly', '0.6'],
    ['/leadership/states', 'weekly', '0.7'],
    ['/inspirations', 'monthly', '0.7'],
    ['/help', 'monthly', '0.7'],
    ['/volunteer', 'monthly', '0.6'],
    ['/donate', 'monthly', '0.6'],
    ['/contact', 'monthly', '0.6'],
    ['/membership/status', 'yearly', '0.3'],
    ['/privacy', 'yearly', '0.2'],
]

// Same names as the slugs in frontend/src/data/inspirations.js.
// When you add a new leader there, add the slug here too.
const INSPIRATIONS = [
    'ambedkar', 'shahu-maharaj', 'periyar', 'jyotirao-phule', 'savitribai-phule', 'fatima-sheikh',
    'lalai-singh-yadav', 'tilka-manjhi', 'uda-devi', 'kanshi-ram', 'narayana-guru',
]

const site = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
const visible = () => ({ draft: { $ne: true }, $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }] })
const day = (d) => new Date(d).toISOString().slice(0, 10)

function entry(path, { lastmod, changefreq, priority } = {}) {
    return [
        '  <url>',
        `    <loc>${site()}${path}</loc>`,
        lastmod && `    <lastmod>${day(lastmod)}</lastmod>`,
        changefreq && `    <changefreq>${changefreq}</changefreq>`,
        priority && `    <priority>${priority}</priority>`,
        '  </url>',
    ].filter(Boolean).join('\n')
}

router.get('/', async (req, res) => {
    const [news, events] = await Promise.all([
        News.find(visible()).select('_id updatedAt').sort({ createdAt: -1 }).limit(5000).lean(),
        Event.find(visible()).select('_id updatedAt').sort({ date: -1 }).limit(5000).lean(),
    ])

    const urls = [
        ...PAGES.map(([path, changefreq, priority]) => entry(path, { changefreq, priority })),
        ...news.map((n) => entry(`/news/${n._id}`, { lastmod: n.updatedAt, priority: '0.7' })),
        ...events.map((e) => entry(`/events/${e._id}`, { lastmod: e.updatedAt, priority: '0.7' })),
        ...INSPIRATIONS.map((slug) => entry(`/inspirations/${slug}`, { changefreq: 'yearly', priority: '0.6' })),
        ...Object.keys(STATE_NAMES).map((code) => entry(`/leadership/states/${code}`, { changefreq: 'monthly', priority: '0.5' })),
    ]

    res
        .type('application/xml')
        .set('Cache-Control', 'public, max-age=3600')
        .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
})

export default router