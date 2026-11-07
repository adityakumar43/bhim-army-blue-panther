import { Router } from 'express'
import Member from '../models/Member.js'
import Complaint from '../models/Complaint.js'
import Volunteer from '../models/Volunteer.js'
import Message from '../models/Message.js'
import Donation from '../models/Donation.js'
import { News, Event } from '../models/Content.js'
import { protect, stateScope, districtScope, sameDistrict } from '../middleware/auth.js'
import { memberStateFilter, stateNameEn } from '../config/stateNames.js'
import { can } from '../config/roles.js'

// One search box for the admin panel: finds members, help desk cases, volunteers, messages, donations, news and events.
// Each person only gets the kinds they are allowed to see, and only from their own state or district.
const router = Router()
const LIMIT = 5

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

router.get('/', protect, async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 60)
    if (q.length < 2) return res.json([])
    const role = req.admin.role
    const any = (...p) => p.some((x) => can(role, x))

    const text = new RegExp(escape(q), 'i')
    const digits = q.replace(/\D/g, '')
    const phone = digits.length >= 4 && digits.length === q.replace(/[\s+-]/g, '').length ? new RegExp(`${digits.slice(-10)}`) : null
    const or = (fields) => [...fields.map((f) => ({ [f]: text })), ...(phone ? [{ phone }] : [])]

    // Where this person may look
    const scope = stateScope(req.admin)
    const area = districtScope(req.admin)
    const inState = area ? { stateCode: area.state, district: sameDistrict(area.district) } : scope ? { stateCode: scope } : {}
    const memberArea = { ...(scope ? memberStateFilter(scope) : {}), ...(area ? { district: sameDistrict(area.district) } : {}) }
    const place = (r) => [r.district, stateNameEn(r.stateCode) || r.state].filter(Boolean).join(', ')

    const jobs = []

    if (any('members', 'district')) {
        jobs.push(Member.find({ $and: [memberArea, { $or: or(['name', 'email', 'memberNo']) }] })
            .select('name memberNo phone status district stateCode state photo').sort({ createdAt: -1 }).limit(LIMIT).lean()
            .then((rows) => rows.map((m) => ({
                kind: 'member', id: m._id, title: m.name, sub: [m.memberNo, m.phone, place(m)].filter(Boolean).join(' · '),
                status: m.status, photo: m.photo?.url || '', link: `/admin/members?status=${m.status}&find=${encodeURIComponent(m.memberNo || m.phone)}`,
            }))))
    }
    if (any('helpdesk', 'district')) {
        jobs.push(Complaint.find({ $and: [inState, { $or: or(['refNo', 'name', 'email', 'village']) }] })
            .select('refNo name phone status district stateCode state urgent').sort({ createdAt: -1 }).limit(LIMIT).lean()
            .then((rows) => rows.map((c) => ({
                kind: 'case', id: c._id, title: `${c.refNo} · ${c.name}`, sub: [c.phone, place(c)].filter(Boolean).join(' · '),
                status: c.status, urgent: !!c.urgent, link: `/admin/helpdesk?status=${c.status}&find=${encodeURIComponent(c.refNo)}`,
            }))))
    }
    if (any('members', 'district')) {
        jobs.push(Volunteer.find({ $and: [inState, { $or: or(['name', 'email']) }] })
            .select('name phone status district stateCode state').sort({ createdAt: -1 }).limit(LIMIT).lean()
            .then((rows) => rows.map((v) => ({
                kind: 'volunteer', id: v._id, title: v.name, sub: [v.phone, place(v)].filter(Boolean).join(' · '),
                status: v.status, link: `/admin/volunteers?status=${v.status}&find=${encodeURIComponent(v.phone || v.name)}`,
            }))))
    }
    if (any('messages')) {
        jobs.push(Message.find({ $or: or(['name', 'email', 'message']) })
            .select('name email phone message read createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean()
            .then((rows) => rows.map((m) => ({
                kind: 'message', id: m._id, title: m.name, sub: String(m.message || '').slice(0, 90),
                status: m.read ? 'read' : 'unread', link: `/admin/messages?find=${encodeURIComponent(m.email || m.phone || m.name)}`,
            }))))
    }
    if (any('donations')) {
        jobs.push(Donation.find({ status: 'paid', $or: or(['receiptNo', 'name', 'email', 'paymentId']) })
            .select('receiptNo name amount paidAt createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean()
            .then((rows) => rows.map((d) => ({
                kind: 'donation', id: d._id, title: `₹${Number(d.amount || 0).toLocaleString('en-IN')} · ${d.name || 'Anonymous'}`,
                sub: [d.receiptNo, new Date(d.paidAt || d.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })].filter(Boolean).join(' · '),
                link: `/admin/donations?find=${encodeURIComponent(d.receiptNo || d.name || '')}`,
            }))))
    }
    if (any('content')) {
        for (const [Model, kind, path] of [[News, 'news', 'news'], [Event, 'event', 'events']]) {
            jobs.push(Model.find({ $or: [{ titleEn: text }, { titleHi: text }] })
                .select('titleEn titleHi date createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean()
                .then((rows) => rows.map((n) => ({
                    kind, id: n._id, title: n.titleEn || n.titleHi, sub: [n.titleEn && n.titleHi, new Date(n.date || n.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })].filter(Boolean).join(' · '),
                    link: `/admin/${path}?find=${encodeURIComponent(n.titleEn || n.titleHi || '')}`,
                }))))
        }
    }

    res.json((await Promise.all(jobs)).flat())
})

export default router