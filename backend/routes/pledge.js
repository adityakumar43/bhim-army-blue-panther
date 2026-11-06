import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Pledge from '../models/Pledge.js'
import Counter from '../models/Counter.js'
import { STATE_CODES } from '../config/states.js'
import { canonicalDistrict } from '../config/districts.js'
import { isPledgeOpen, nextOpening, pledgeYear } from '../config/season.js'

// The Preamble pledge on the Samvidhan Divas page: take it (and get a certificate number), and the public count.
const router = Router()

// Names in any language: letters, marks (Hindi matras), spaces, dots, hyphens and apostrophes
const NAME_OK = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u

// 10 pledges an hour from one network: enough for a family or a classroom on one phone, too few for a bot
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: 'Too many pledges from this network. Please try again later.' },
})

router.post('/', limiter, async (req, res) => {
    const b = req.body || {}
    if (b.website) return res.status(201).json({ ok: true }) // hidden field filled = a bot: pretend it worked
    // Only in the Samvidhan season. The page hides the form too, but this rule is what really counts:
    // it also stops anyone who sends a pledge to the server directly.
    if (!isPledgeOpen()) return res.status(403).json({ code: 'closed', opensOn: nextOpening(), message: 'The pledge is closed for now. It opens again before Samvidhan Divas.' })

    const name = String(b.name || '').trim().replace(/\s+/g, ' ')
    if (!NAME_OK.test(name)) return res.status(400).json({ message: 'Please enter your name (letters only, up to 60).' })
    const stateCode = String(b.stateCode || '')
    if (!STATE_CODES.includes(stateCode)) return res.status(400).json({ message: 'Please choose your state.' })
    const typed = String(b.district || '').trim().slice(0, 100)
    const district = typed ? canonicalDistrict(stateCode, typed) : ''
    if (typed && !district) return res.status(400).json({ message: 'Please choose your district from the list.' })

    // The next number for this season: SD-2026-000001, SD-2026-000002…
    const year = pledgeYear()
    const c = await Counter.findOneAndUpdate({ _id: `pledge-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true })
    const certNo = `SD-${year}-${String(c.seq).padStart(6, '0')}`
    const p = await Pledge.create({ name, stateCode, district: district || undefined, certNo, year })
    const [total, thisYear] = await Promise.all([Pledge.estimatedDocumentCount(), Pledge.countDocuments({ year })])

    res.status(201).json({ name: p.name, stateCode, district: p.district || '', certNo, date: p.createdAt, total, thisYear })
})

// How many people have taken the pledge (this season and in all), since which year, from how many states,
// and whether it is open (shown on the page)
router.get('/count', async (req, res) => {
    const [total, thisYear, states, first] = await Promise.all([
        Pledge.estimatedDocumentCount(),
        Pledge.countDocuments({ year: pledgeYear() }),
        Pledge.distinct('stateCode'),
        Pledge.findOne({}, { year: 1 }).sort({ year: 1 }).lean(), // the oldest season
    ])
    res.set('Cache-Control', 'public, max-age=60') // a minute: fresh enough, and cheap
    res.json({ total, thisYear, since: first?.year || pledgeYear(), states: states.length, open: isPledgeOpen(), opensOn: nextOpening() })
})

export default router
