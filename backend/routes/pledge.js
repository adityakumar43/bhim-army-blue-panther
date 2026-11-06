import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Pledge from '../models/Pledge.js'
import Counter from '../models/Counter.js'
import { STATE_CODES } from '../config/states.js'
import { canonicalDistrict } from '../config/districts.js'

// The Preamble pledge on the Samvidhan Divas page: take it (and get a certificate number), and the public count.
const router = Router()

// The Indian year, whatever the server's own clock is set to
const indianYear = () => Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date()))

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

    const name = String(b.name || '').trim().replace(/\s+/g, ' ')
    if (!NAME_OK.test(name)) return res.status(400).json({ message: 'Please enter your name (letters only, up to 60).' })
    const stateCode = String(b.stateCode || '')
    if (!STATE_CODES.includes(stateCode)) return res.status(400).json({ message: 'Please choose your state.' })
    const typed = String(b.district || '').trim().slice(0, 100)
    const district = typed ? canonicalDistrict(stateCode, typed) : ''
    if (typed && !district) return res.status(400).json({ message: 'Please choose your district from the list.' })

    // The next number for this year: SD-2026-000001, SD-2026-000002…
    const year = indianYear()
    const c = await Counter.findOneAndUpdate({ _id: `pledge-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true })
    const certNo = `SD-${year}-${String(c.seq).padStart(6, '0')}`
    const p = await Pledge.create({ name, stateCode, district: district || undefined, certNo, year })
    const total = await Pledge.estimatedDocumentCount()

    res.status(201).json({ name: p.name, stateCode, district: p.district || '', certNo, date: p.createdAt, total })
})

// How many people have taken the pledge, and from how many states (shown on the page)
router.get('/count', async (req, res) => {
    const [total, thisYear, states] = await Promise.all([
        Pledge.estimatedDocumentCount(),
        Pledge.countDocuments({ year: indianYear() }),
        Pledge.distinct('stateCode'),
    ])
    res.set('Cache-Control', 'public, max-age=60') // a minute: fresh enough, and cheap
    res.json({ total, thisYear, states: states.length })
})

export default router
