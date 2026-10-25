import { Router } from 'express'
import Activity from '../models/Activity.js'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()

// Latest entries first. Filters: ?admin=<id>&section=<name>&before=<date> (for "Load more")
router.get('/', protect, requirePermission('admins'), async (req, res) => {
  const filter = {}
  if (/^[a-f0-9]{24}$/i.test(req.query.admin || '')) filter.admin = req.query.admin
  if (/^[a-z]+$/.test(req.query.section || '')) filter.section = req.query.section
  const before = new Date(req.query.before)
  if (req.query.before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before }

  const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  const people = await Activity.aggregate([{ $group: { _id: '$admin', name: { $last: '$adminName' } } }, { $sort: { name: 1 } }])
  res.json({ items, people: people.map((p) => ({ id: p._id, name: p.name })), more: items.length === 100 })
})

export default router