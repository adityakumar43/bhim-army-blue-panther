import { Router } from 'express'
import Member from '../models/Member.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { STATE_CODES } from '../config/states.js'
import { memberStateFilter, memberInState, codeFromName, stateNameEn } from '../config/stateNames.js'
import { canonicalDistrict, districtsOfState } from '../config/districts.js'

// Member growth: where the members are, how fast they are joining, and who brings in the most new members.
const router = Router()
const TZ = 'Asia/Kolkata'
const monthKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(d).slice(0, 7)

// The last 12 months as 'YYYY-MM', oldest first (Indian time)
function lastMonths(n = 12) {
    const out = []
    const now = new Date()
    for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15))))
    return [...new Set(out)]
}

// Only the first name and the first letter of the last name go on the public leaderboard: "Ravi Kumar" -> "Ravi K."
const shortName = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
    const first = (parts[0] || '').charAt(0).toUpperCase() + (parts[0] || '').slice(1)
    return parts.length > 1 ? `${first} ${parts.at(-1)[0].toUpperCase()}.` : first
}

// Public invite leaderboard: members whose invite link brought in the most APPROVED members.
// ?state=uttar-pradesh&district=Agra narrows it to where the inviter lives; ?period=30 counts only the last 30 days.
router.get('/leaderboard', async (req, res) => {
    const state = STATE_CODES.includes(req.query.state) ? req.query.state : null
    const district = state && typeof req.query.district === 'string' ? req.query.district.trim().slice(0, 100) : ''
    const days = req.query.period === '30' ? 30 : 0
    const match = { status: 'approved', referredBy: { $ne: null } }
    if (days) match.$expr = { $gte: [{ $ifNull: ['$approvedAt', '$createdAt'] }, new Date(Date.now() - days * 864e5)] }

    const rows = await Member.aggregate([
        { $match: match },
        { $group: { _id: '$referredBy', n: { $sum: 1 } } },
        { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'who' } },
        { $unwind: '$who' },
        { $match: { 'who.status': 'approved', 'who.hideFromBoard': { $ne: true } } },
        { $project: { n: 1, name: '$who.name', stateCode: '$who.stateCode', state: '$who.state', district: '$who.district' } },
    ])
    // Districts were sometimes typed by hand: match them to the official list of the state
    const sameName = (code, d) => (code && canonicalDistrict(code, d || '')) || String(d || '').trim()
    const want = district && sameName(state, district).toLowerCase()
    const list = rows
        .map((r) => ({ ...r, stateCode: r.stateCode || codeFromName(r.state) || null }))
        .map((r) => ({ ...r, district: sameName(r.stateCode, r.district) }))
        .filter((r) => !state || memberInState(r, state))
        .filter((r) => !want || r.district.toLowerCase() === want)
        .sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name)))

    res.set('Cache-Control', 'public, max-age=600') // ten minutes: fresh enough, and cheap
    res.json({
        joined: list.reduce((sum, r) => sum + r.n, 0), // members brought in by everyone on this list
        inviters: list.length,
        top: list.slice(0, 20).map((r) => ({
            rank: 1 + list.filter((x) => x.n > r.n).length, // equal numbers share a place
            name: shortName(r.name),
            district: r.district,
            stateCode: r.stateCode,
            value: r.n,
        })),
    })
})

router.get('/', protect, requirePermission('members'), async (req, res) => {
    // State admins always see their own state; others may pick one, or see all of India
    const scope = stateScope(req.admin)
    const state = scope || (STATE_CODES.includes(req.query.state) ? req.query.state : null)
    const inScope = state ? memberStateFilter(state) : {}
    const approved = { ...inScope, status: 'approved' }

    const months = lastMonths()
    const since = new Date(Date.UTC(Number(months[0].slice(0, 4)), Number(months[0].slice(5, 7)) - 1, 1) - 330 * 60e3) // midnight in India
    const month30 = new Date(Date.now() - 30 * 864e5)
    const joinedOn = { $ifNull: ['$approvedAt', '$createdAt'] }

    const [statusRows, perMonthRows, before, places, inviters] = await Promise.all([
        Member.aggregate([{ $match: inScope }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
        Member.aggregate([
            { $match: approved },
            { $addFields: { joinedOn } },
            { $match: { joinedOn: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$joinedOn', timezone: TZ } }, n: { $sum: 1 } } },
        ]),
        Member.aggregate([{ $match: approved }, { $addFields: { joinedOn } }, { $match: { joinedOn: { $lt: since } } }, { $count: 'n' }]),
        // Every approved member's state and district, counted (small enough to group here)
        Member.aggregate([
            { $match: approved },
            { $addFields: { joinedOn } },
            {
                $group: {
                    _id: { code: '$stateCode', state: '$state', district: '$district' },
                    n: { $sum: 1 },
                    recent: { $sum: { $cond: [{ $gte: ['$joinedOn', month30] }, 1, 0] } },
                },
            },
        ]),
        // Who invited the most approved members
        Member.aggregate([
            { $match: { ...approved, referredBy: { $ne: null } } },
            { $group: { _id: '$referredBy', n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 15 },
            { $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'who' } },
            { $unwind: '$who' },
            { $project: { n: 1, name: '$who.name', memberNo: '$who.memberNo', district: '$who.district', stateCode: '$who.stateCode', state: '$who.state' } },
        ]),
    ])

    const status = Object.fromEntries(statusRows.map((r) => [r._id, r.n]))
    const perMonthMap = Object.fromEntries(perMonthRows.map((r) => [r._id, r.n]))
    const perMonth = months.map((m) => ({ month: m, value: perMonthMap[m] || 0 }))
    // Running total at the end of each month
    let running = before[0]?.n || 0
    const total = perMonth.map((m) => ({ month: m.month, value: (running += m.value) }))

    // By state (all of India) and by district (one state). Older members typed their state and district,
    // so both are matched to the lists here; anything that does not match is shown as typed.
    const byState = new Map()
    const byDistrict = new Map()
    let noDistrict = 0
    for (const r of places) {
        const code = r._id.code || codeFromName(r._id.state)
        const stateKey = code ? stateNameEn(code) : (r._id.state || '').trim() || 'State not given'
        const s = byState.get(stateKey) || { label: stateKey, code, value: 0, recent: 0 }
        s.value += r.n; s.recent += r.recent
        byState.set(stateKey, s)
        if (state) {
            const typed = (r._id.district || '').trim()
            if (!typed) { noDistrict += r.n; continue }
            const name = canonicalDistrict(state, typed) || typed
            const d = byDistrict.get(name.toLowerCase()) || { label: name, value: 0, recent: 0 }
            d.value += r.n; d.recent += r.recent
            byDistrict.set(name.toLowerCase(), d)
        }
    }
    const sortBig = (list) => [...list].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    const districts = sortBig(byDistrict.values())
    const have = new Set(districts.map((d) => d.label.toLowerCase()))

    res.json({
        state,
        locked: !!scope,
        approved: status.approved || 0,
        pending: status.pending || 0,
        thisMonth: perMonth.at(-1)?.value || 0,
        lastMonth: perMonth.at(-2)?.value || 0,
        perMonth,
        total,
        byState: state ? [] : sortBig(byState.values()),
        byDistrict: districts,
        noDistrict,
        // Districts of the state with no approved member yet: where to grow next
        emptyDistricts: state ? districtsOfState(state).filter((d) => !have.has(d.toLowerCase())) : [],
        districtCount: state ? districtsOfState(state).length : 0,
        inviters: inviters.map((r) => ({
            name: r.name, memberNo: r.memberNo, value: r.n,
            place: [r.district, stateNameEn(r.stateCode) || r.state].filter(Boolean).join(', '),
        })),
    })
})

export default router