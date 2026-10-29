import { Router } from 'express'
import Member from '../models/Member.js'
import Message from '../models/Message.js'
import Donation from '../models/Donation.js'
import Admin from '../models/Admin.js'
import Complaint from '../models/Complaint.js'
import Volunteer from '../models/Volunteer.js'
import Rsvp from '../models/Rsvp.js'
import Download from '../models/Download.js'
import Certificate from '../models/Certificate.js'
import { Event } from '../models/Content.js'
import { protect, requirePermission, requireAny, stateScope, districtScope, sameDistrict } from '../middleware/auth.js'
import { memberStateFilter, codeFromName, stateNameEn } from '../config/stateNames.js'
import { can } from '../config/roles.js'

const router = Router()


router.get('/summary', protect, async (req, res) => {
  const role = req.admin.role
  const since = req.admin.seenDonationsAt || req.admin.createdAt
  const scope = stateScope(req.admin)
  const mine = scope ? memberStateFilter(scope) : {} // State admins count only their state
  const area = districtScope(req.admin) // District admins count only their district
  const inArea = area ? { district: sameDistrict(area.district) } : {}
  const sees = (p) => can(role, p) || can(role, 'district')
  const [members, messages, donations, helpdesk, volunteers] = await Promise.all([
    sees('members') ? Member.countDocuments({ status: 'pending', ...mine, ...inArea }) : 0,
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
    sees('helpdesk') ? Complaint.countDocuments({ status: 'new', ...(scope ? { stateCode: scope } : {}), ...inArea }) : 0,
    sees('members') ? Volunteer.countDocuments({ status: 'new', ...(scope ? { stateCode: scope } : {}), ...inArea }) : 0,
  ])
  res.json({ members, messages, donations, helpdesk, volunteers })
})

router.post('/seen/donations', protect, requirePermission('donations'), async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { seenDonationsAt: new Date() })
  res.json({ ok: true })
})

// Members grouped by state: by the state chosen from the list, or worked out from what older members typed
// ("UP", "u.p." and "Uttar Pradesh" all count as Uttar Pradesh). Biggest first.
function byStateName(rows) {
  const totals = new Map()
  for (const { _id, n } of rows) {
    const code = _id.code || codeFromName(_id.state)
    const name = code ? stateNameEn(code) : _id.state || 'Not given'
    totals.set(name, (totals.get(name) || 0) + n)
  }
  return [...totals].map(([state, value]) => ({ state, value })).sort((a, b) => b.value - a.value)
}

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
  const jobs = [] // each part runs at the same time, so the page waits for the slowest part, not the sum of all

  if (can(role, 'members')) jobs.push((async () => {
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
        { $group: { _id: { code: '$stateCode', state: { $trim: { input: { $ifNull: ['$state', ''] } } } }, n: { $sum: 1 } } },
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
      byState: byStateName(states),
    }
  })())

  if (can(role, 'donations')) jobs.push((async () => {
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
  })())

  // Help desk: open and solved cases, cases per month and by type
  if (can(role, 'helpdesk')) jobs.push((async () => {
    const scope = stateScope(req.admin)
    const mine = { $match: scope ? { stateCode: scope } : {} }
    const [statusRows, perMonthRows, typeRows] = await Promise.all([
      Complaint.aggregate([mine, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      Complaint.aggregate([mine, { $match: { createdAt: { $gte: since } } }, { $group: { _id: byMonth('$createdAt'), n: { $sum: 1 } } }]),
      Complaint.aggregate([mine, { $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    ])
    const st = Object.fromEntries(statusRows.map((r) => [r._id, r.n]))
    const perMonth = fill(months, perMonthRows)
    out.helpdesk = {
      open: (st.new || 0) + (st.in_progress || 0),
      solved: (st.resolved || 0) + (st.closed || 0),
      thisMonth: perMonth.at(-1)?.value || 0,
      perMonth,
      byType: typeRows.map((r) => ({ key: r._id, value: r.n })),
    }
  })())

  // Volunteers and certificates: shown to the people who manage members
  if (can(role, 'members')) jobs.push((async () => {
    const scope = stateScope(req.admin)
    const mine = { $match: scope ? { stateCode: scope } : {} }
    const yearStart = new Date(Date.UTC(Number(thisMonth.slice(0, 4)), 0, 1) - 330 * 60e3)
    const [volRows, skillRows, certRows] = await Promise.all([
      Volunteer.aggregate([mine, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      Volunteer.aggregate([mine, { $match: { status: { $ne: 'inactive' } } }, { $unwind: '$skills' }, { $group: { _id: '$skills', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
      Certificate.aggregate([mine, { $match: { status: 'active', createdAt: { $gte: yearStart } } }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
    ])
    const vs = Object.fromEntries(volRows.map((r) => [r._id, r.n]))
    out.volunteers = {
      total: Object.values(vs).reduce((a, b) => a + b, 0) - (vs.inactive || 0),
      active: vs.active || 0,
      bySkill: skillRows.map((r) => ({ key: r._id, value: r.n })),
    }
    const cs = Object.fromEntries(certRows.map((r) => [r._id, r.n]))
    out.certificates = { thisYear: Object.values(cs).reduce((a, b) => a + b, 0), appointments: cs.appointment || 0 }
  })())

  // Events and downloads: shown to content editors
  if (can(role, 'content')) jobs.push((async () => {
    const today = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())}T00:00:00Z`)
    const upcoming = await Event.find({ date: { $gte: today }, draft: { $ne: true } }).select('_id').lean()
    const [rsvpRows, dlRows] = await Promise.all([
      upcoming.length ? Rsvp.aggregate([{ $match: { event: { $in: upcoming.map((e) => e._id) } } }, { $group: { _id: null, people: { $sum: '$people' } } }]) : [],
      Download.aggregate([{ $group: { _id: null, files: { $sum: 1 }, count: { $sum: '$count' } } }]),
    ])
    out.events = { upcoming: upcoming.length, coming: rsvpRows[0]?.people || 0 }
    out.downloads = { files: dlRows[0]?.files || 0, count: dlRows[0]?.count || 0 }
  })())

  await Promise.all(jobs)
  res.json(out)
})

export default router
