import { Router } from 'express'
import Member from '../models/Member.js'
import Message from '../models/Message.js'
import Donation from '../models/Donation.js'
import Admin from '../models/Admin.js'
import Complaint from '../models/Complaint.js'
import Volunteer from '../models/Volunteer.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { memberStateFilter } from '../config/stateNames.js'
import { can } from '../config/roles.js'

const router = Router()


router.get('/summary', protect, async (req, res) => {
  const role = req.admin.role
  const since = req.admin.seenDonationsAt || req.admin.createdAt
  const scope = stateScope(req.admin)
  const mine = scope ? memberStateFilter(scope) : {} // State admins count only their state
  const [members, messages, donations, helpdesk, volunteers] = await Promise.all([
    can(role, 'members') ? Member.countDocuments({ status: 'pending', ...mine }) : 0,
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
    can(role, 'helpdesk') ? Complaint.countDocuments({ status: 'new', ...(scope ? { stateCode: scope } : {}) }) : 0,
    can(role, 'members') ? Volunteer.countDocuments({ status: 'new', ...(scope ? { stateCode: scope } : {}) }) : 0,
  ])
  res.json({ members, messages, donations, helpdesk, volunteers })
})

router.post('/seen/donations', protect, requirePermission('donations'), async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { seenDonationsAt: new Date() })
  res.json({ ok: true })
})

// Numbers and charts for the Overview page. Each part is only sent to roles that may see it.
const TZ = 'Asia/Kolkata'
const monthKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(d).slice(0, 7)

// The last 12 months as 'YYYY-MM', oldest first (Indian time)
function lastMonths(n = 12) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15))))
  return [...new Set(out)]
}
const fill = (months, rows) => {
  const map = Object.fromEntries(rows.map((r) => [r._id, r.n]))
  return months.map((m) => ({ month: m, value: map[m] || 0 }))
}

router.get('/stats', protect, async (req, res) => {
  const role = req.admin.role
  const months = lastMonths()
  const since = new Date(Date.UTC(Number(months[0].slice(0, 4)), Number(months[0].slice(5, 7)) - 1, 1) - 330 * 60e3) // midnight in India
  const thisMonth = months.at(-1)
  const byMonth = (dateField) => ({ $dateToString: { format: '%Y-%m', date: dateField, timezone: TZ } })
  const out = {}

  if (can(role, 'members')) {
    const scope = stateScope(req.admin)
    const mine = { $match: scope ? memberStateFilter(scope) : {} } // State admins see only their state
    const [statusRows, joins, states] = await Promise.all([
      Member.aggregate([mine, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      Member.aggregate([
        mine,
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: byMonth('$createdAt'), n: { $sum: 1 } } },
      ]),
      Member.aggregate([
        mine,
        { $match: { status: 'approved' } },
        { $group: { _id: { $trim: { input: { $ifNull: ['$state', ''] } } }, n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ]),
    ])
    const status = Object.fromEntries(statusRows.map((r) => [r._id, r.n]))
    const perMonth = fill(months, joins)
    out.members = {
      approved: status.approved || 0,
      pending: status.pending || 0,
      rejected: status.rejected || 0,
      thisMonth: perMonth.at(-1)?.value || 0,
      perMonth,
      byState: states.map((r) => ({ state: r._id || 'Not given', value: r.n })),
    }
  }

  if (can(role, 'donations')) {
    const paidDate = { $ifNull: ['$paidAt', '$createdAt'] }
    const [total, perMonthRows] = await Promise.all([
      Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      Donation.aggregate([
        { $match: { status: 'paid' } },
        { $addFields: { paidOn: paidDate } },
        { $match: { paidOn: { $gte: since } } },
        { $group: { _id: byMonth('$paidOn'), n: { $sum: '$amount' } } },
      ]),
    ])
    const perMonth = fill(months, perMonthRows)
    out.donations = {
      total: total[0]?.amount || 0,
      count: total[0]?.n || 0,
      thisMonth: perMonth.find((m) => m.month === thisMonth)?.value || 0,
      perMonth,
    }
  }

  res.json(out)
})

export default router
