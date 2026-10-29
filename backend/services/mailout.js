import Member from '../models/Member.js'
import Mailout from '../models/Mailout.js'
import { sendMail } from './mailer.js'
import { ORG } from '../config/org.js'
import { memberStateFilter } from '../config/stateNames.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Who an announcement goes to: approved members with an email who have not said "stop"
export function audience(stateCode, district) {
    const f = { status: 'approved', email: { $nin: [null, ''] }, emailOptOut: { $ne: true } }
    if (stateCode) Object.assign(f, memberStateFilter(stateCode))
    if (district) f.district = new RegExp(`^\\s*${escRe(district.trim())}\\s*$`, 'i')
    return f
}

// The email one member gets. Paragraphs are kept; nothing the admin types can become HTML.
export function mailoutEmail({ subject, body }, m) {
    const stop = `${process.env.CLIENT_URL}/unsubscribe/${m.cardToken}`
    const paras = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    const text = [`जय भीम ${m.name},`, '', body, '', `— ${ORG.name}`, '', `ये ईमेल बंद करने के लिए / To stop these emails: ${stop}`].join('\n')
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0A1A3F;line-height:1.6">
<div style="background:#0B3C9D;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0"><b style="font-size:18px">भीम आर्मी ब्लू पैंथर</b><br><span style="font-size:13px;opacity:.85">${esc(ORG.name)}</span></div>
<div style="border:1px solid #dbe4f3;border-top:0;padding:18px;border-radius:0 0 8px 8px">
<p>जय भीम <b>${esc(m.name)}</b>,</p>
${paras.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n')}
<p>— ${esc(ORG.name)}</p>
</div>
<p style="color:#777;font-size:12px;margin-top:14px">आपको यह ईमेल इसलिए मिला क्योंकि आप ${esc(ORG.name)} के सदस्य हैं${m.memberNo ? ` (${esc(m.memberNo)})` : ''}। You get this email because you are a member.<br>
<a href="${esc(stop)}" style="color:#777">ये ईमेल बंद करें / Stop these emails</a></p>
</div>`
    return { subject, text, html }
}

// Sends one announcement, one member at a time with a short pause, so the mail server does not block us.
// Counts are saved as it goes; the admin page shows them and can stop it.
export async function runMailout(id) {
    const pause = Number(process.env.MAILOUT_DELAY_MS ?? 1500)
    const mo = await Mailout.findById(id)
    if (!mo) return
    const members = await Member.find(audience(mo.stateCode, mo.district)).select('name email memberNo cardToken').lean()
    let sent = 0, failed = 0, n = 0
    const save = (extra = {}) => Mailout.updateOne({ _id: id }, { $set: { sent, failed, ...extra } })
    for (const m of members) {
        if (n++ % 10 === 0) {
            const now = await Mailout.findById(id).select('status').lean()
            if (now?.status === 'stopped') return save()
            await save()
        }
        try {
            const ok = await sendMail({ to: m.email, ...mailoutEmail(mo, m) })
            if (!ok) return save({ status: 'stopped', note: 'Email is not set up on the server (SMTP settings in .env).', finishedAt: new Date() })
            sent++
        } catch (err) {
            failed++
            console.error(`Announcement to ${m.email} failed:`, err.message)
        }
        if (pause) await sleep(pause)
    }
    await save({ status: 'done', finishedAt: new Date() })
}