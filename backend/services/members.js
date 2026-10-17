import crypto from 'crypto'
import Member from '../models/Member.js'
import Counter from '../models/Counter.js'
import { sendMail } from './mailer.js'
import { welcomeEmail } from './welcome.js'

async function nextMemberNo() {
    const c = await Counter.findOneAndUpdate({ _id: 'member' }, { $inc: { seq: 1 } }, { new: true, upsert: true })
    return `BBP-${String(c.seq).padStart(5, '0')}`
}

// Gives an approved member a membership number and a card link.
// Safe to call many times: only the first call changes anything, and it reports isNew only once.
export async function issueCard(id) {
    const member = await Member.findById(id)
    if (!member) return { member: null, isNew: false }
    if (member.memberNo) return { member, isNew: false }

    const claimed = await Member.findOneAndUpdate(
        { _id: id, memberNo: { $exists: false } },
        {
            $set: {
                memberNo: await nextMemberNo(),
                approvedAt: new Date(),
                cardToken: member.cardToken || crypto.randomBytes(16).toString('hex'),
            },
        },
        { new: true }
    )
    return claimed ? { member: claimed, isNew: true } : { member: await Member.findById(id), isNew: false }
}

// Returns false when email is not set up. Throws if the mail server refuses.
export async function emailCard(member) {
    const { subject, text, html } = welcomeEmail(member)
    const sent = await sendMail({ to: member.email, subject, text, html })
    if (sent) await Member.updateOne({ _id: member._id }, { $set: { cardEmailedAt: new Date() } })
    return sent
}

// Runs in the background after an approval, so a slow mail server never delays the admin
export function sendWelcome(member) {
    if (!member.email) return
    emailCard(member)
        .then((sent) => {
            if (!sent) console.warn('Card email NOT sent: email is not set up. Add SMTP_HOST, SMTP_USER and SMTP_PASS to backend/.env and restart.')
        })
        .catch((err) => console.error('Membership email failed:', err.message))
}

// Members approved before this feature existed get their numbers once, with no email
export async function backfillCards() {
    const old = await Member.find({ status: 'approved', memberNo: { $exists: false } }).sort({ createdAt: 1 })
    for (const m of old) await issueCard(m._id)
    if (old.length) console.log(`Issued membership numbers to ${old.length} existing approved member(s)`)
}