import Member from '../models/Member.js'
import { ORG } from '../config/org.js'
import { sendMail } from './mailer.js'
import { button, hero, greet, both, quote, details, signoff } from './emailLayout.js'

// Birthday wishes: every morning (from 8 AM Indian time) approved members whose birthday is today
// get a greeting email. Each member gets at most one per year, even if the server restarts.

const TZ = 'Asia/Kolkata'
const FROM_HOUR = 8 // don't send before 8 AM
const UNTIL_HOUR = 22 // or after 10 PM

// Today's date and hour in India
export function indiaNow(now = new Date()) {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' })
            .formatToParts(now).map((p) => [p.type, Number(p.value)])
    )
    return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour }
}

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

// Database condition for "born on this day". Dates of birth are saved at midnight UTC, so UTC day = their birthday.
// People born on 29 February are wished on 28 February when the year has no 29th.
export function bornOn({ year, month, day }) {
    const days = [[month, day]]
    if (month === 2 && day === 28 && !isLeap(year)) days.push([2, 29])
    return {
        $or: days.map(([m, d]) => ({ $and: [{ $eq: [{ $month: '$dob' }, m] }, { $eq: [{ $dayOfMonth: '$dob' }, d] }] })),
    }
}

export function birthdayEmail(m) {
    const site = (process.env.CLIENT_URL || '').replace(/\/+$/, '')
    const card = m.cardToken && site ? `${site}/card/${m.cardToken}` : ''
    const subject = `🎂 जन्मदिन की हार्दिक शुभकामनाएँ, ${m.name}! Happy Birthday from ${ORG.name}`
    const text = [
        `जय भीम ${m.name} जी!`,
        `${ORG.name} परिवार की ओर से आपको जन्मदिन की हार्दिक शुभकामनाएँ। आप स्वस्थ रहें, आगे बढ़ते रहें और समाज के हक़ की लड़ाई में यूँ ही साथ खड़े रहें।`,
        '',
        `Jai Bhim ${m.name}!`,
        `The whole ${ORG.name} family wishes you a very happy birthday. Stay healthy, keep growing, and keep standing with us for justice and equality.`,
        '',
        '"शिक्षित बनो, संगठित रहो, संघर्ष करो" — डॉ. बी. आर. आंबेडकर',
        m.memberNo ? `\nसदस्यता संख्या / Member no.: ${m.memberNo}` : '',
        card ? `सदस्यता कार्ड / Membership card: ${card}` : '',
        '',
        ORG.name,
    ].filter((l) => l !== '').join('\n')

    const html = `${hero('🎂', 'जन्मदिन मुबारक हो!', 'Happy Birthday')}
${greet(m.name)}
${both(`${ORG.name} परिवार की ओर से आपको जन्मदिन की हार्दिक शुभकामनाएँ। आप स्वस्थ रहें, आगे बढ़ते रहें और समाज के हक़ की लड़ाई में यूँ ही साथ खड़े रहें।`, `The whole ${ORG.name} family wishes you a very happy birthday. Stay healthy, keep growing, and keep standing with us for justice and equality.`)}
${quote()}
${details([['सदस्यता संख्या / Member no.', m.memberNo]])}
${card ? button('अपना सदस्यता कार्ड देखें / View your card', card, { fallback: false }) : ''}
${signoff()}`
    return { subject, text, html }
}

let running = false

// Sends today's wishes. Safe to run many times a day: nobody gets two emails in one year.
export async function sendBirthdayWishes(now = new Date()) {
    if (running) return { skipped: 'already running' }
    running = true
    const result = { sent: 0, failed: 0 }
    try {
        const today = indiaNow(now)
        const people = await Member.find({
            status: 'approved',
            email: { $nin: [null, ''] },
            dob: { $ne: null },
            birthdayWishedYear: { $ne: today.year },
            $expr: bornOn(today),
        }).limit(500)

        for (const m of people) {
            // Mark first, so a second copy of the server can't send the same email
            const claim = await Member.updateOne({ _id: m._id, birthdayWishedYear: { $ne: today.year } }, { $set: { birthdayWishedYear: today.year } })
            if (!claim.modifiedCount) continue
            try {
                const sent = await sendMail({ to: m.email, ...birthdayEmail(m) })
                if (!sent) {
                    await Member.updateOne({ _id: m._id }, { $set: { birthdayWishedYear: m.birthdayWishedYear ?? null } })
                    console.warn('Birthday emails NOT sent: email is not set up. Add SMTP_HOST, SMTP_USER and SMTP_PASS to backend/.env and restart.')
                    break
                }
                result.sent++
            } catch (err) {
                await Member.updateOne({ _id: m._id }, { $set: { birthdayWishedYear: m.birthdayWishedYear ?? null } }) // try again on the next run
                result.failed++
                console.error(`Birthday email to ${m.email} failed:`, err.message)
            }
        }
        if (result.sent || result.failed) console.log(`Birthday wishes: ${result.sent} sent, ${result.failed} failed`)
        return result
    } finally {
        running = false
    }
}

// Checks every 30 minutes while the server is running. Set BIRTHDAY_EMAILS=off in .env to stop it.
export function startBirthdayTimer() {
    if (process.env.BIRTHDAY_EMAILS === 'off') return
    const tick = () => {
        const { hour } = indiaNow()
        if (hour < FROM_HOUR || hour >= UNTIL_HOUR) return
        sendBirthdayWishes().catch((err) => console.error('Birthday check failed:', err.message))
    }
    setTimeout(tick, 60e3) // a minute after start-up
    setInterval(tick, 30 * 60e3)
}

export { FROM_HOUR }