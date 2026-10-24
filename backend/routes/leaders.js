import { Router } from 'express'
import Leader from '../models/Leader.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { uploadImage, deleteImage } from '../config/cloudinary.js'
import { STATE_CODES } from '../config/states.js'

const router = Router()

// What the public pages need (nothing internal)
const view = (l) => ({
  _id: l._id, level: l.level, state: l.state, nameHi: l.nameHi, nameEn: l.nameEn, roleHi: l.roleHi, roleEn: l.roleEn,
  areaHi: l.areaHi, areaEn: l.areaEn, phone: l.phone, photo: l.photo?.url, order: l.order,
})

function read(body) {
  const s = (v) => String(v ?? '').trim()
  const level = s(body.level)
  if (!['national', 'state'].includes(level)) return { error: 'Choose National or State' }
  const state = level === 'state' ? s(body.state) : null
  if (level === 'state' && !STATE_CODES.includes(state)) return { error: 'Choose the state' }
  const data = {
    level, state,
    nameHi: s(body.nameHi), nameEn: s(body.nameEn), roleHi: s(body.roleHi), roleEn: s(body.roleEn),
    areaHi: s(body.areaHi), areaEn: s(body.areaEn), phone: s(body.phone),
  }
  if (!data.nameHi && !data.nameEn) return { error: 'Write the name in Hindi or English' }
  if (['nameHi', 'nameEn', 'roleHi', 'roleEn', 'areaHi', 'areaEn'].some((k) => data[k].length > 100)) {
    return { error: 'Each text can be up to 100 characters' }
  }
  if (data.phone && !/^\+?[0-9][0-9 -]{6,18}$/.test(data.phone)) return { error: 'Enter a valid phone number, or leave it empty' }
  const order = s(body.order) === '' ? 0 : Number(body.order)
  if (!Number.isInteger(order) || order < 0 || order > 9999) return { error: 'Order must be a whole number like 1, 2, 3' }
  data.order = order
  return { data }
}

// Public: ?level=national or ?state=uttar-pradesh
router.get('/', async (req, res) => {
  const filter = {}
  if (['national', 'state'].includes(req.query.level)) filter.level = req.query.level
  if (req.query.state) {
    if (!STATE_CODES.includes(String(req.query.state))) return res.json([])
    filter.level = 'state'
    filter.state = String(req.query.state)
  }
  const items = await Leader.find(filter).sort({ order: 1, createdAt: 1 }).limit(500)
  res.json(items.map(view))
})

// Public: how many leaders each state has, for the list of states
router.get('/counts', async (req, res) => {
  const rows = await Leader.aggregate([{ $match: { level: 'state' } }, { $group: { _id: '$state', n: { $sum: 1 } } }])
  res.json(Object.fromEntries(rows.map((r) => [r._id, r.n])))
})

router.post('/', protect, requirePermission('content'), upload.single('photo'), async (req, res) => {
  const { data, error } = read(req.body || {})
  if (error) return res.status(400).json({ message: error })
  if (req.file) data.photo = await uploadImage(req.file.buffer, 'bluepanther/leaders')
  res.status(201).json(view(await Leader.create(data)))
})

router.put('/:id', protect, requirePermission('content'), upload.single('photo'), async (req, res) => {
  const leader = await Leader.findById(req.params.id).catch(() => null)
  if (!leader) return res.status(404).json({ message: 'Not found' })
  const { data, error } = read(req.body || {})
  if (error) return res.status(400).json({ message: error })
  Object.assign(leader, data)
  if (req.file) {
    await deleteImage(leader.photo?.publicId)
    leader.photo = await uploadImage(req.file.buffer, 'bluepanther/leaders')
  } else if (req.body.removePhoto === 'true') {
    await deleteImage(leader.photo?.publicId)
    leader.photo = undefined
  }
  await leader.save()
  res.json(view(leader))
})

router.delete('/:id', protect, requirePermission('content'), async (req, res) => {
  const leader = await Leader.findByIdAndDelete(req.params.id).catch(() => null)
  if (!leader) return res.status(404).json({ message: 'Not found' })
  await deleteImage(leader.photo?.publicId)
  res.json({ ok: true })
})

export default router