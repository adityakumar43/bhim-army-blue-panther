import mongoose from 'mongoose'
import Activity from '../models/Activity.js'

// Records every change an admin makes (add, edit, delete, approve...) in the activity log.
// It sits in front of all routes, so the routes themselves need no changes.

// Where the item's name is looked up before an edit or delete (by collection name)
const COLLECTIONS = {
    news: ['news'], events: ['events'], gallery: ['galleries', 'gallery'], slides: ['slides'],
    members: ['members'], leaders: ['leaders'], announcements: ['announcements'],
    contact: ['messages', 'contacts', 'contactmessages'], helpdesk: ['complaints'], volunteers: ['volunteers'], donations: ['donations'], admins: ['admins'],
}

// What one item is called in each section
const NOUN = {
    news: 'a news post', events: 'an event', gallery: 'a gallery photo', slides: 'a home slider photo',
    leaders: 'a leader', announcements: 'a home update', helpdesk: 'a help desk case', volunteers: 'a volunteer',
}

const modelFor = (section) => {
    const names = COLLECTIONS[section] || []
    return Object.values(mongoose.models).find((m) => names.includes(m.collection?.name))
}

const ROLE_NAMES = { superadmin: 'Super admin', editor: 'Content editor', membership: 'Membership manager', finance: 'Finance', stateadmin: 'State admin' }

const nameOf = (doc) => {
    if (!doc || typeof doc !== 'object') return ''
    const name = doc.refNo || doc.titleEn || doc.titleHi || doc.nameEn || doc.nameHi || doc.name || doc.textEn || doc.textHi || doc.receiptNo || doc.email || ''
    return String(name).slice(0, 100)
}

// Turns a request into [action, text], or null when it should not be logged
function describe(section, method, part, body = {}, last = '') {
    switch (section) {
        case 'members':
            if (part === 'status') return body.status === 'approved' ? ['approve', 'approved the membership of'] : ['reject', 'rejected the membership of']
            if (part === 'send-card') return ['email', 'emailed the membership card to']
            if (method === 'DELETE') return ['delete', 'deleted the application of']
            return null
        case 'contact':
            if (part === 'reply') return ['email', 'replied by email to']
            if (part === 'read') return ['read', body.read ? 'marked as read the message from' : 'marked as unread the message from']
            if (method === 'DELETE') return ['delete', 'deleted the message from']
            return null
        case 'donations':
            if (part === 'resend') return ['email', 'emailed the receipt to']
            return null
        case 'admins':
            if (method === 'POST' && part === 'reset-2fa') return ['security', 'reset two-step login for']
            if (method === 'POST') return ['create', 'added the team member']
            if (method === 'DELETE') return ['delete', 'deleted the account of']
            if (body.state && !body.role) return ['role', 'changed the state of']
            if (body.role) return ['role', `changed the role to ${ROLE_NAMES[body.role] || 'another role'} for`]
            if (body.active === false) return ['disable', 'disabled the account of']
            if (body.active === true) return ['enable', 'enabled the account of']
            if (body.password) return ['security', 'changed the password of']
            return ['update', 'updated the account of']
        case 'auth':
            if (last === 'enable') return ['security', 'turned on two-step login', true]
            if (last === 'disable') return ['security', 'turned off two-step login', true]
            return null
        default:
            if (!NOUN[section]) return null
            if (method === 'POST') return ['create', `added ${NOUN[section]}`]
            if (method === 'PUT' || method === 'PATCH') return ['update', `edited ${NOUN[section]}`]
            if (method === 'DELETE') return ['delete', `deleted ${NOUN[section]}`]
            return null
    }
}

export async function activityLog(req, res, next) {
    // Only changes made by a logged-in admin are recorded
    if (req.method === 'GET' || !req.headers.authorization || !req.path.startsWith('/api/')) return next()
    const [, , section, id, part] = req.path.split('/')
    const isId = /^[a-f0-9]{24}$/i.test(id || '')

    // Before an edit or delete, remember the item's name (it may be gone afterwards)
    let before = null
    if (isId) {
        try { before = await modelFor(section)?.findById(id).lean() } catch { before = null }
    }

    // Keep a copy of the reply, to name new items
    const json = res.json.bind(res)
    res.json = (data) => { res.locals.reply = data; return json(data) }

    res.on('finish', () => {
        if (!req.admin || res.statusCode >= 400) return
        const found = describe(section, req.method, isId ? part : id, req.body || {}, part)
        if (!found) return
        const [action, text, noTarget] = found
        const target = noTarget ? '' : nameOf(before) || nameOf(res.locals.reply) || nameOf(res.locals.reply?.admin) || nameOf(req.body)
        Activity.create({
            admin: req.admin._id, adminName: req.admin.name, section, action, text, target, ip: req.ip,
        }).catch((err) => console.error('Activity log failed:', err.message))
    })
    next()
}