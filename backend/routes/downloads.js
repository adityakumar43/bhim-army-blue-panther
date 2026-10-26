import { Router } from 'express'
import multer from 'multer'
import Download, { DOWNLOAD_CATEGORIES } from '../models/Download.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { uploadFile, deleteFile } from '../services/files.js'

const router = Router()

// PDFs and pictures, up to 10 MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        /^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.mimetype)
            ? cb(null, true)
            : cb(Object.assign(new Error('Only PDF, JPG, PNG or WebP files are allowed'), { status: 400 })),
})
// Turn "file too large" into a clear message
const takeFile = (req, res, next) => upload.single('file')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'The file must be under 10 MB' })
    if (err) return res.status(err.status || 400).json({ message: err.message })
    next()
})

function read(body) {
    const s = (v, n) => String(v ?? '').trim().slice(0, n)
    const data = {
        titleHi: s(body.titleHi, 150), titleEn: s(body.titleEn, 150),
        descriptionHi: s(body.descriptionHi, 400), descriptionEn: s(body.descriptionEn, 400),
        category: DOWNLOAD_CATEGORIES.includes(body.category) ? body.category : 'other',
        order: Number.isInteger(Number(body.order)) ? Math.max(0, Math.min(9999, Number(body.order))) : 0,
    }
    if (!data.titleHi && !data.titleEn) return { error: 'Add a title in Hindi or English' }
    return { data }
}

// Public list (the file address is not given out directly; downloads go through /:id/file so they can be counted)
const view = (d) => ({
    _id: d._id, titleHi: d.titleHi, titleEn: d.titleEn, descriptionHi: d.descriptionHi, descriptionEn: d.descriptionEn,
    category: d.category, format: d.file?.format, bytes: d.file?.bytes, count: d.count, createdAt: d.createdAt,
    preview: d.file?.resourceType === 'image' ? d.file.url : null,
})

router.get('/', async (req, res) => {
    const filter = DOWNLOAD_CATEGORIES.includes(req.query.category) ? { category: req.query.category } : {}
    res.json((await Download.find(filter).sort({ order: 1, createdAt: -1 }).limit(500)).map(view))
})

// Counts the download, then sends the visitor to the file
router.get('/:id/file', async (req, res) => {
    const d = await Download.findByIdAndUpdate(req.params.id, { $inc: { count: 1 } }, { new: true }).catch(() => null)
    if (!d?.file?.url) return res.status(404).json({ message: 'File not found' })
    res.redirect(302, d.file.url)
})

router.post('/', protect, requirePermission('content'), takeFile, async (req, res) => {
    const { data, error } = read(req.body || {})
    if (error) return res.status(400).json({ message: error })
    if (!req.file) return res.status(400).json({ message: 'Choose a file to upload' })
    data.file = await uploadFile(req.file.buffer, req.file)
    res.status(201).json(view(await Download.create(data)))
})

router.put('/:id', protect, requirePermission('content'), takeFile, async (req, res) => {
    const d = await Download.findById(req.params.id).catch(() => null)
    if (!d) return res.status(404).json({ message: 'Not found' })
    const { data, error } = read(req.body || {})
    if (error) return res.status(400).json({ message: error })
    Object.assign(d, data)
    if (req.file) {
        const old = d.file
        d.file = await uploadFile(req.file.buffer, req.file)
        await deleteFile(old)
    }
    await d.save()
    res.json(view(d))
})

router.delete('/:id', protect, requirePermission('content'), async (req, res) => {
    const d = await Download.findByIdAndDelete(req.params.id).catch(() => null)
    if (!d) return res.status(404).json({ message: 'Not found' })
    await deleteFile(d.file)
    res.json({ ok: true })
})

export default router