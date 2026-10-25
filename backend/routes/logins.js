import { Router } from 'express'
import LoginEvent from '../models/LoginEvent.js'
import { protect } from '../middleware/auth.js'
import { can } from '../config/roles.js'

const router = Router()

// Super admins can see everyone's logins (?admin=<id> for one person). Everyone else sees only their own.
router.get('/', protect, async (req, res) => {
  const all = can(req.admin.role, 'admins') && req.query.mine !== '1'
  const filter = all ? {} : { admin: req.admin._id }
  if (all && /^[a-f0-9]{24}$/i.test(req.query.admin || '')) filter.admin = req.query.admin
  if (req.query.failed === '1') filter.success = false
  const limit = Math.min(Number(req.query.limit) || 100, 200)
  const items = await LoginEvent.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  const people = all
    ? await LoginEvent.aggregate([{ $match: { admin: { $ne: null } } }, { $group: { _id: '$admin', name: { $last: '$name' } } }, { $sort: { name: 1 } }])
    : []
  res.json({ items, people: people.map((p) => ({ id: p._id, name: p.name })) })
})

export default router