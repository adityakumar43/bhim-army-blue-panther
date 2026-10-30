import { Router } from 'express'
import { Event } from '../models/Content.js'

// The events calendar: published events between two dates (a month view asks for about six weeks)
const router = Router()
const DAY = /^\d{4}-\d{2}-\d{2}$/

router.get('/', async (req, res) => {
    const { from, to } = req.query
    if (!DAY.test(String(from)) || !DAY.test(String(to))) return res.status(400).json({ message: 'Give from and to as YYYY-MM-DD' })
    const start = new Date(`${from}T00:00:00Z`)
    const end = new Date(`${to}T23:59:59Z`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start || end - start > 120 * 864e5) {
        return res.status(400).json({ message: 'Choose at most 120 days' })
    }
    const events = await Event.find({
        date: { $gte: start, $lte: end },
        draft: { $ne: true },
        $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }],
    })
        .select('titleHi titleEn date time location stateCode image')
        .sort({ date: 1, time: 1 })
        .limit(300)
        .lean()
    res.set('Cache-Control', 'public, max-age=60')
    res.json(events)
})

export default router