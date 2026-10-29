import { Router } from 'express'
import crypto from 'crypto'
import Member from '../models/Member.js'
import { protect, requirePermission, stateScope } from '../middleware/auth.js'
import { memberStateFilter } from '../config/stateNames.js'
import { indiaNow, sendBirthdayWishes, FROM_HOUR } from '../services/birthdays.js'
import { sendCaseReminders } from '../services/caseReminders.js'

const router = Router()
const DAY = 864e5
const AHEAD = 7 // show birthdays for today and the next 7 days

const sameKey = (a, b) => {
    const x = Buffer.from(String(a)), y = Buffer.from(String(b))
    return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// For free hosting that sleeps when nobody visits: a free service like cron-job.org can open
// /api/birthdays/run?key=YOUR_CRON_SECRET every morning to wake the server and send the wishes.
router.get('/run', async (req, res) => {
    const secret = process.env.CRON_SECRET
    const key = req.get('x-cron-key') || req.query.key
    if (!secret || !key || !sameKey(key, secret)) return res.status(404).json({ message: 'Not found' })
    if (indiaNow().hour < FROM_HOUR) return res.json({ skipped: `Too early. Wishes go out after ${FROM_HOUR} AM.` })
    // The same wake-up call also sends the help desk reminders
    const [wishes, reminders] = await Promise.all([sendBirthdayWishes(), sendCaseReminders()])
    res.json({ ...wishes, reminders })
})

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

// Days from today until this date of birth comes round again (0 = today)
function daysUntil(dob, today) {
    const start = Date.UTC(today.year, today.month - 1, today.day)
    let month = dob.getUTCMonth(), day = dob.getUTCDate()
    for (const year of [today.year, today.year + 1]) {
        const d = month === 1 && day === 29 && !isLeap(year) ? 28 : day
        const next = Date.UTC(year, month, d)
        if (next >= start) return Math.round((next - start) / DAY)
    }
    return 999
}

// Admin Overview: who has a birthday today and this week
router.get('/', protect, requirePermission('members'), async (req, res) => {
    const scope = stateScope(req.admin)
    const today = indiaNow()
    const members = await Member.find({ status: 'approved', dob: { $ne: null }, ...(scope ? memberStateFilter(scope) : {}) })
        .select('name phone email memberNo dob district state birthdayWishedYear')
        .lean()

    const list = members
        .map((m) => ({ ...m, daysAway: daysUntil(new Date(m.dob), today) }))
        .filter((m) => m.daysAway <= AHEAD)
        .sort((a, b) => a.daysAway - b.daysAway || a.name.localeCompare(b.name))
        .slice(0, 100)
        .map(({ birthdayWishedYear, dob, ...m }) => {
            const born = new Date(dob)
            const when = new Date(Date.UTC(today.year, today.month - 1, today.day) + m.daysAway * DAY)
            return {
                ...m,
                date: when.toISOString().slice(0, 10), // the birthday this time round
                turning: when.getUTCFullYear() - born.getUTCFullYear(),
                emailed: m.daysAway === 0 && birthdayWishedYear === today.year,
            }
        })

    res.json({ emailOn: Boolean(process.env.SMTP_HOST) && process.env.BIRTHDAY_EMAILS !== 'off', list })
})

export default router