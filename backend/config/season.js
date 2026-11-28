// When the Samvidhan pledge is open: month-day windows in Indian time. A window may cross the new year.
// This is the one place to change. To also open it around Ambedkar Jayanti, add { from: '04-10', to: '04-20' }.
export const PLEDGE_SEASONS = [{ from: '11-01', to: '01-26' }]

const parts = (now) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now).map((p) => [p.type, p.value]))
const monthDay = (now) => { const p = parts(now); return `${p.month}-${p.day}` }
const inside = (md, s) => (s.from <= s.to ? md >= s.from && md <= s.to : md >= s.from || md <= s.to)

export const isPledgeOpen = (now = new Date()) => PLEDGE_SEASONS.some((s) => inside(monthDay(now), s))

// The day it opens next, as "MM-DD" (the first opening after today, else the earliest one next year)
export function nextOpening(now = new Date()) {
    const md = monthDay(now)
    const starts = PLEDGE_SEASONS.map((s) => s.from).sort()
    return starts.find((d) => d > md) || starts[0]
}

// The year a pledge belongs to: the year its season started, so a pledge on 10 January 2027
// still counts in the 2026 season and its certificate number continues that series (SD-2026-…)
export function pledgeYear(now = new Date()) {
    const p = parts(now)
    const md = `${p.month}-${p.day}`
    const year = Number(p.year)
    const s = PLEDGE_SEASONS.find((x) => inside(md, x))
    return s && s.from > s.to && md <= s.to ? year - 1 : year
}
