import { Router } from 'express'
import { protect, requirePermission } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadImage, deleteImage } from '../config/cloudinary.js'


export default function crud(Model, { fields, sort, filterFields = [], requireTitle = true, requireImage = false }) {
  const router = Router()

  const pick = (body) => {
    const data = {}
    for (const f of fields) if (body[f] !== undefined && body[f] !== '') data[f] = body[f]
    return data
  }

  router.get('/', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const skip = Math.max(Number(req.query.skip) || 0, 0)
    // Only the listed fields can be filtered, and only by plain text (so nobody can sneak in a database operator)
    const filter = {}
    for (const f of filterFields) if (req.query[f]) filter[f] = String(req.query[f])
    res.json(await Model.find(filter).sort(sort).skip(skip).limit(limit))
  })

  router.get('/:id', async (req, res) => {
    const item = await Model.findById(req.params.id).catch(() => null)
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  })

  router.post('/', protect, requirePermission('content'), upload.single('image'), async (req, res) => {
    const data = pick(req.body)
    if (requireTitle && !data.titleHi && !data.titleEn) {
      return res.status(400).json({ message: 'Add a title in Hindi or English' })
    }
    if (requireImage && !req.file) return res.status(400).json({ message: 'Choose an image' })
    if (req.file) data.image = await uploadImage(req.file.buffer)
    try {
      res.status(201).json(await Model.create(data))
    } catch (err) {
      if (err.name === 'ValidationError') {
        const first = Object.values(err.errors)[0]
        return res.status(400).json({ message: first?.kind === 'regexp' ? first.message : 'Please check the details and try again' })
      }
      throw err
    }
  })

  router.put('/:id', protect, requirePermission('content'), upload.single('image'), async (req, res) => {
    const item = await Model.findById(req.params.id).catch(() => null)
    if (!item) return res.status(404).json({ message: 'Not found' })
    for (const f of fields) {
      const v = req.body[f]
      if (v === undefined) continue
      if (f === 'date' && v === '') continue
      item.set(f, v)
    }
    if (requireTitle && !item.titleHi && !item.titleEn) {
      return res.status(400).json({ message: 'Add a title in Hindi or English' })
    }
    if (req.file) {
      await deleteImage(item.image?.publicId)
      item.image = await uploadImage(req.file.buffer)
    }
    try {
      res.json(await item.save())
    } catch (err) {
      if (err.name === 'ValidationError') {
        const first = Object.values(err.errors)[0]
        return res.status(400).json({ message: first?.kind === 'regexp' ? first.message : 'Please check the details and try again' })
      }
      throw err
    }
  })

  router.delete('/:id', protect, requirePermission('content'), async (req, res) => {
    const item = await Model.findById(req.params.id).catch(() => null)
    if (!item) return res.status(404).json({ message: 'Not found' })
    await deleteImage(item.image?.publicId)
    await item.deleteOne()
    res.json({ ok: true })
  })

  return router
}
