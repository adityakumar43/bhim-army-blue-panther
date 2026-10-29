import Complaint from '../models/Complaint.js'
import Admin from '../models/Admin.js'
import { ORG } from '../config/org.js'
import { can } from '../config/roles.js'
import { sendMail } from './mailer.js'
import { indiaNow } from './birthdays.js'

// Help desk reminders: an open case where the person has heard nothing from us for 3 days
// is emailed to whoever handles it. Each case is reminded at most once every 3 days.
//   - a case given to a team member  -> that team member
//   - a case given to nobody         -> the state admins of its state
//   - every waiting case             -> ADMIN_NOTIFY_EMAIL (one list of all of them)
// Set HELPDESK_REMINDERS=off in .env to stop them. REMINDER_DAYS changes the 3 days.

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
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0a1a3f;line-height:1.5;max-width:600px">
<p>These help desk cases have had <b>no update for ${days()} days or more</b>. The people who reported them are waiting to hear from us.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
${cases.map((c) => `<tr style="border-top:1px solid #e3e8f3"><td style="padding:8px 6px;vertical-align:top"><b>${esc(c.refNo)}</b>${c.urgent ? ' <b style="color:#b91c1c">URGENT</b>' : ''}<br><span style="color:#555">${esc(c.category)} · ${esc([c.district, c.state].filter(Boolean).join(', '))}</span></td>
<td style="padding:8px 6px;vertical-align:top;text-align:right;white-space:nowrap"><b style="color:#b45309">${ago(lastUpdate(c), now)} days</b><br><span style="color:#555">${c.assignedTo?.name ? esc(c.assignedTo.name) : 'Not given to anyone'}</span></td></tr>`).join('\n')}
</table>
${link ? `<p style="margin-top:18px"><a href="${esc(link)}" style="display:inline-block;background:#0B3C9D;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Open the help desk</a></p>` : ''}
<p style="color:#777;font-size:12px">You get this because you look after these cases. A case is reminded again only if it is still waiting ${days()} days later.</p></div>`
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

// Checks every hour while the server is running (and on the daily /api/birthdays/run wake-up call)
export function startCaseReminderTimer() {
    if (process.env.HELPDESK_REMINDERS === 'off') return
    const tick = () => {
        const { hour } = indiaNow()
        if (hour < FROM_HOUR || hour >= UNTIL_HOUR) return
        sendCaseReminders().catch((err) => console.error('Help desk reminder check failed:', err.message))
    }
    setTimeout(tick, 2 * 60e3) // two minutes after start-up
    setInterval(tick, 60 * 60e3)
}