import { Router } from 'express'
import Video, { VIDEO_CATEGORIES } from '../models/Video.js'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()

// Finds the 11-letter video id in any YouTube link: watch?v=, youtu.be/, shorts/, embed/, live/
export function youtubeId(link) {
    const s = String(link || '').trim()
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
    let u
    try { u = new URL(s) } catch { return null }
    const host = u.hostname.replace(/^www\.|^m\./, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1, 12)
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
        id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/) || [])[1]
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null
}

function read(body) {
    const id = youtubeId(body.link ?? body.youtubeId)
    if (!id) return { error: 'Paste a YouTube video link, like https://youtu.be/abc123XYZ00' }
    const s = (v) => String(v ?? '').trim().slice(0, 150)
    const data = {
        youtubeId: id, titleHi: s(body.titleHi), titleEn: s(body.titleEn),
        category: VIDEO_CATEGORIES.includes(body.category) ? body.category : 'other',
        order: Number.isInteger(Number(body.order)) ? Math.max(0, Math.min(9999, Number(body.order))) : 0,
    }
    if (!data.titleHi && !data.titleEn) return { error: 'Add a title in Hindi or English' }
    return { data }
}

router.get('/', async (req, res) => {
    const filter = VIDEO_CATEGORIES.includes(req.query.category) ? { category: req.query.category } : {}
    const limit = Math.min(Number(req.query.limit) || 200, 200)
    res.json(await Video.find(filter).sort({ order: 1, createdAt: -1 }).limit(limit))
})

router.post('/', protect, requirePermission('content'), async (req, res) => {
    const { data, error } = read(req.body || {})
    if (error) return res.status(400).json({ message: error })
    res.status(201).json(await Video.create(data))
})

router.put('/:id', protect, requirePermission('content'), async (req, res) => {
    const v = await Video.findById(req.params.id).catch(() => null)
    if (!v) return res.status(404).json({ message: 'Not found' })
    const { data, error } = read(req.body || {})
    if (error) return res.status(400).json({ message: error })
    Object.assign(v, data)
    await v.save()
    res.json(v)
})

router.delete('/:id', protect, requirePermission('content'), async (req, res) => {
    const v = await Video.findByIdAndDelete(req.params.id).catch(() => null)
    if (!v) return res.status(404).json({ message: 'Not found' })
    res.json({ ok: true })
})

export default router