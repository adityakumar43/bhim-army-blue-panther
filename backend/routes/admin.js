import { Router } from 'express'
import Member from '../models/Member.js'
import Message from '../models/Message.js'
import Donation from '../models/Donation.js'
import Admin from '../models/Admin.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { can } from '../config/roles.js'

const router = Router()


router.get('/summary', protect, async (req, res) => {
  const role = req.admin.role
  const since = req.admin.seenDonationsAt || req.admin.createdAt
  const [members, messages, donations] = await Promise.all([
    can(role, 'members') ? Member.countDocuments({ status: 'pending' }) : 0,
    can(role, 'messages') ? Message.countDocuments({ read: false }) : 0,
    can(role, 'donations')
      ? Donation.countDocuments({
          status: 'paid',
          $or: [
            { paidAt: { $gt: since } },
            { paidAt: { $exists: false }, createdAt: { $gt: since } },
          ],
        })
      : 0,
  ])
  res.json({ members, messages, donations })
})

router.post('/seen/donations', protect, requirePermission('donations'), async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { seenDonationsAt: new Date() })
  res.json({ ok: true })
})

export default router
