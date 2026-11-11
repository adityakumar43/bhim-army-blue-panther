import Complaint from '../models/Complaint.js'
import Admin from '../models/Admin.js'
import { ORG } from '../config/org.js'
import { can } from '../config/roles.js'
import { sendMail } from './mailer.js'
import { button, hero } from './emailLayout.js'
import { indiaNow } from './birthdays.js'

// Help desk reminders: an open case where the person has heard nothing from us for 3 days
// is emailed to whoever handles it. Each case is reminded at most once every 3 days.
//   - a case given to a team member  -> that team member
//   - a case given to nobody         -> the state admins of its state
//   - every waiting case             -> ADMIN_NOTIFY_EMAIL (one list of all of them)
// Set HELPDESK_REMINDERS=off in .env to stop them. REMINDER_DAYS changes the 3 days.
//
// Escalation, when a case is still waiting much longer (each level once, until the case gets an update):
//   - no update for 7 days  -> the State Admins of its state ("escalated")
//   - no update for 14 days -> the Super Admins
// ESCALATE_DAYS changes the 7 (the second step is always twice that). HELPDESK_ESCALATION=off stops only this part.

const DAY = 864e5
const FROM_HOUR = 9 // send between 9 AM
const UNTIL_HOUR = 21 // and 9 PM (Indian time)
const days = () => Math.max(1, Number(process.env.REMINDER_DAYS) || 3)

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
// When the person last heard from us: the newest line in their timeline (older cases: when the case last changed)
const lastUpdate = (c) => new Date(c.history?.at(-1)?.at || c.updatedAt || c.createdAt)
const ago = (d, now) => Math.floor((now - d) / DAY)

export function reminderEmail(cases, now = Date.now()) {
    const site = (process.env.CLIENT_URL || '').replace(/\/+$/, '')
    const link = site ? `${site}/admin/helpdesk` : ''
    const n = cases.length
    const subject = `⏰ ${n} help desk ${n === 1 ? 'case is' : 'cases are'} waiting for an update`
    const line = (c) => `${c.refNo}${c.urgent ? ' (URGENT)' : ''} · ${c.category} · ${[c.district, c.state].filter(Boolean).join(', ')} · no update for ${ago(lastUpdate(c), now)} days${c.assignedTo?.name ? ` · with ${c.assignedTo.name}` : ' · not given to anyone'}`
    const text = [
        `These help desk cases have had no update for ${days()} days or more. The people who reported them are waiting to hear from us.`,
        '',
        ...cases.map(line),
        '',
        link ? `Open the help desk: ${link}` : '',
        `— ${ORG.name}`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n')
    const html = `${hero('⏰', 'Cases waiting for an update', `${n} ${n === 1 ? 'case' : 'cases'}`)}
<p>These help desk cases have had <b>no update for ${days()} days or more</b>. The people who reported them are waiting to hear from us.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
${cases.map((c) => `<tr style="border-top:1px solid #e3e8f3"><td style="padding:8px 6px;vertical-align:top"><b>${esc(c.refNo)}</b>${c.urgent ? ' <b style="color:#b91c1c">URGENT</b>' : ''}<br><span style="color:#555">${esc(c.category)} · ${esc([c.district, c.state].filter(Boolean).join(', '))}</span></td>
<td style="padding:8px 6px;vertical-align:top;text-align:right;white-space:nowrap"><b style="color:#b45309">${ago(lastUpdate(c), now)} days</b><br><span style="color:#555">${c.assignedTo?.name ? esc(c.assignedTo.name) : 'Not given to anyone'}</span></td></tr>`).join('\n')}
</table>
${link ? button('Open the help desk', link, { fallback: false }) : ''}
<p style="color:#777;font-size:12px">You get this because you look after these cases. A case is reminded again only if it is still waiting ${days()} days later.</p>`
    return { subject, text, html }
}

let running = false

// Finds the waiting cases and sends the emails. Safe to run many times a day.
export async function sendCaseReminders(now = new Date()) {
    if (process.env.HELPDESK_REMINDERS === 'off') return { skipped: 'off' }
    if (running) return { skipped: 'already running' }
    running = true
    try {
        const cutoff = new Date(now.getTime() - days() * DAY)
        const open = await Complaint.find({
            status: { $in: ['new', 'in_progress'] },
            $or: [{ remindedAt: null }, { remindedAt: { $lte: cutoff } }],
        }).select('refNo category state stateCode district urgent assignedTo history updatedAt createdAt remindedAt').limit(2000).lean()
        const waiting = open
            .filter((c) => lastUpdate(c) <= cutoff)
            .sort((a, b) => Number(b.urgent) - Number(a.urgent) || lastUpdate(a) - lastUpdate(b))
        if (!waiting.length) return { cases: 0, emails: 0 }

        // Who gets which cases
        const admins = await Admin.find({ active: true }).select('name email role state district').lean()
        const byId = new Map(admins.map((a) => [String(a._id), a]))
        const inbox = new Map() // email -> cases
        const add = (email, c) => { if (!email) return; const k = email.toLowerCase(); if (!inbox.has(k)) inbox.set(k, []); inbox.get(k).push(c) }
        for (const c of waiting) {
            const owner = c.assignedTo?.adminId && byId.get(String(c.assignedTo.adminId))
            if (owner && (can(owner.role, 'helpdesk') || owner.role === 'districtadmin')) add(owner.email, c)
            else {
                // Nobody has it: the state admins of its state, and the district admins of its district
                const sameArea = (a) => a.role === 'districtadmin' && a.state === c.stateCode && a.district && c.district && a.district.toLowerCase() === c.district.trim().toLowerCase()
                admins.filter((a) => (a.role === 'stateadmin' && a.state === c.stateCode) || sameArea(a)).forEach((a) => add(a.email, c))
            }
            add(process.env.ADMIN_NOTIFY_EMAIL, c)
        }
        if (!inbox.size) return { cases: waiting.length, emails: 0 }

        // Mark first, so two copies of the server don't both send
        const ids = waiting.map((c) => c._id)
        await Complaint.updateMany({ _id: { $in: ids } }, { $set: { remindedAt: now } }, { timestamps: false })
        let emails = 0, failed = 0
        for (const [to, cases] of inbox) {
            try {
                if (!(await sendMail({ to, ...reminderEmail(cases, now.getTime()) }))) {
                    console.warn('Help desk reminders NOT sent: email is not set up.')
                    await Complaint.updateMany({ _id: { $in: ids } }, { $set: { remindedAt: null } }, { timestamps: false })
                    return { cases: waiting.length, emails: 0, skipped: 'email not set up' }
                }
                emails++
            } catch (err) {
                failed++
                console.error(`Help desk reminder to ${to} failed:`, err.message)
            }
        }
        console.log(`Help desk reminders: ${waiting.length} waiting cases, ${emails} emails sent${failed ? `, ${failed} failed` : ''}`)
        return { cases: waiting.length, emails, failed }
    } finally {
        running = false
    }
}

// ---------- Escalation ----------

const escalateDays = () => Math.max(days() + 1, Number(process.env.ESCALATE_DAYS) || 7)
const LEVEL_NAME = { 1: 'State Admin', 2: 'Super Admin' }

// The level a case has already reached since its last update (an update starts it again from 0)
export const escalationLevel = (c) => (c.escalation?.level && new Date(c.escalation.at) >= lastUpdate(c) ? c.escalation.level : 0)

// The level a case should be at now
export const dueLevel = (c, now = Date.now()) => {
    const idle = ago(lastUpdate(c), now)
    return idle >= 2 * escalateDays() ? 2 : idle >= escalateDays() ? 1 : 0
}

export function escalationEmail(cases, level, now = Date.now()) {
    const site = (process.env.CLIENT_URL || '').replace(/\/+$/, '')
    const link = site ? `${site}/admin/helpdesk` : ''
    const n = cases.length
    const limit = Math.min(...cases.map((c) => ago(lastUpdate(c), now))) // the quietest case's days, for the subject line
    const who = level === 2 ? 'As a Super Admin, please make sure someone takes these up.' : 'As State Admin, please check with the person handling each case, or take it over.'
    const subject = `🚨 Escalated: ${n} help desk ${n === 1 ? 'case has' : 'cases have'} had no update for ${limit}+ days`
    const owner = (c) => (c.assignedTo?.name ? `with ${c.assignedTo.name}` : 'not given to anyone')
    const text = [
        `These help desk cases have had no update for ${limit} days or more, even after reminders. ${who}`,
        '',
        ...cases.map((c) => `${c.refNo}${c.urgent ? ' (URGENT)' : ''} · ${c.category} · ${[c.district, c.state].filter(Boolean).join(', ')} · no update for ${ago(lastUpdate(c), now)} days · ${owner(c)}`),
        '',
        link ? `Open the help desk: ${link}` : '',
        `— ${ORG.name}`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n')
    const html = `${hero('🚨', 'Escalated cases', `${n} ${n === 1 ? 'case' : 'cases'}`)}
<p style="background:#fef2f2;border-left:4px solid #b91c1c;padding:10px 12px;margin:0 0 14px"><b style="color:#b91c1c">Escalated to you (${LEVEL_NAME[level]})</b><br>These cases have had <b>no update for ${limit} days or more</b>, even after reminders. ${esc(who)}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
${cases.map((c) => `<tr style="border-top:1px solid #e3e8f3"><td style="padding:8px 6px;vertical-align:top"><b>${esc(c.refNo)}</b>${c.urgent ? ' <b style="color:#b91c1c">URGENT</b>' : ''}<br><span style="color:#555">${esc(c.category)} · ${esc([c.district, c.state].filter(Boolean).join(', '))}</span></td>
<td style="padding:8px 6px;vertical-align:top;text-align:right;white-space:nowrap"><b style="color:#b91c1c">${ago(lastUpdate(c), now)} days</b><br><span style="color:#555">${c.assignedTo?.name ? esc(c.assignedTo.name) : 'Not given to anyone'}</span></td></tr>`).join('\n')}
</table>
${link ? button('Open the help desk', link, { color: '#B91C1C', fallback: false }) : ''}
<p style="color:#777;font-size:12px">You are told about each case once at this level. If the case gets an update and then goes quiet again, it can be escalated again.</p>`
    return { subject, text, html }
}

let escalating = false

// Finds cases that need escalating and emails the State Admins (level 1) or Super Admins (level 2). Safe to run many times a day.
export async function sendEscalations(now = new Date()) {
    if (process.env.HELPDESK_REMINDERS === 'off' || process.env.HELPDESK_ESCALATION === 'off') return { skipped: 'off' }
    if (escalating) return { skipped: 'already running' }
    escalating = true
    try {
        const cutoff = new Date(now.getTime() - escalateDays() * 864e5)
        const open = await Complaint.find({ status: { $in: ['new', 'in_progress'] }, createdAt: { $lte: cutoff } })
            .select('refNo category state stateCode district urgent assignedTo history updatedAt createdAt escalation').limit(2000).lean()
        const todo = open
            .map((c) => ({ c, level: dueLevel(c, now.getTime()) }))
            .filter(({ c, level }) => level > escalationLevel(c))
        if (!todo.length) return { cases: 0, emails: 0 }

        const admins = await Admin.find({ active: true, role: { $in: ['stateadmin', 'superadmin'] } }).select('name email role state').lean()
        const supers = admins.filter((a) => a.role === 'superadmin')
        const inbox = new Map() // `${level}|email` -> cases
        const add = (level, email, c) => {
            if (!email) return
            const k = `${level}|${email.toLowerCase()}`
            if (!inbox.has(k)) inbox.set(k, [])
            inbox.get(k).push(c)
        }
        for (const item of todo) {
            const stateAdmins = admins.filter((a) => a.role === 'stateadmin' && a.state === item.c.stateCode)
            // Level 1 goes to the state's admins; a state without one goes straight to the Super Admins (level 2)
            if (item.level === 1 && !stateAdmins.length) item.level = 2
            ;(item.level === 1 ? stateAdmins : supers).forEach((a) => add(item.level, a.email, item.c))
        }
        if (!inbox.size) return { cases: todo.length, emails: 0 }

        // Mark first, so two copies of the server don't both send
        const mark = (list) => Complaint.bulkWrite(list.map(({ c, level }) => ({
            updateOne: { filter: { _id: c._id }, update: { $set: { escalation: level ? { level, at: now } : c.escalation || null } }, timestamps: false },
        })))
        await mark(todo)
        let emails = 0, failed = 0
        for (const [key, cases] of inbox) {
            const [level, to] = [Number(key.split('|')[0]), key.slice(key.indexOf('|') + 1)]
            try {
                if (!(await sendMail({ to, ...escalationEmail(cases, level, now.getTime()) }))) {
                    console.warn('Help desk escalations NOT sent: email is not set up.')
                    await mark(todo.map(({ c }) => ({ c, level: 0 }))) // put back what was there before
                    return { cases: todo.length, emails: 0, skipped: 'email not set up' }
                }
                emails++
            } catch (err) {
                failed++
                console.error(`Help desk escalation to ${to} failed:`, err.message)
            }
        }
        console.log(`Help desk escalations: ${todo.length} cases, ${emails} emails sent${failed ? `, ${failed} failed` : ''}`)
        return { cases: todo.length, emails, failed }
    } finally {
        escalating = false
    }
}

// Both checks, one after the other (used by the timer and the daily /api/birthdays/run wake-up call)
export async function runHelpdeskChecks(now = new Date()) {
    const reminders = await sendCaseReminders(now)
    const escalations = await sendEscalations(now)
    return { ...reminders, escalations }
}

// Checks every hour while the server is running (and on the daily /api/birthdays/run wake-up call)
export function startCaseReminderTimer() {
    if (process.env.HELPDESK_REMINDERS === 'off') return
    const tick = () => {
        const { hour } = indiaNow()
        if (hour < FROM_HOUR || hour >= UNTIL_HOUR) return
        runHelpdeskChecks().catch((err) => console.error('Help desk reminder check failed:', err.message))
    }
    setTimeout(tick, 2 * 60e3) // two minutes after start-up
    setInterval(tick, 60 * 60e3)
}
