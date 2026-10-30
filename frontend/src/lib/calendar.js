import { pickText } from './text.js'

// "Add to my calendar" and "Directions" for an event. Times are Indian time; events without a time last all day.

const SITE = typeof window !== 'undefined' ? window.location.origin : ''
const pad = (n) => String(n).padStart(2, '0')
const day = (ev) => String(ev.date).slice(0, 10) // the event's date, like 2026-11-14

// Start and end as UTC text for calendars (2 hours long when a time is given)
function times(ev) {
    const d = day(ev)
    if (!ev.time) {
        const next = new Date(`${d}T00:00:00Z`)
        next.setUTCDate(next.getUTCDate() + 1)
        return { allDay: true, start: d.replace(/-/g, ''), end: next.toISOString().slice(0, 10).replace(/-/g, '') }
    }
    const start = new Date(`${d}T${ev.time}:00+05:30`)
    const end = new Date(start.getTime() + 2 * 3600e3)
    const utc = (t) => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    return { allDay: false, start: utc(start), end: utc(end) }
}

const details = (ev, lang) => `${pickText(ev, 'body', lang).slice(0, 500)}\n\n${SITE}/events/${ev._id}`.trim()

export function googleCalendarLink(ev, lang) {
    const { start, end } = times(ev)
    const q = new URLSearchParams({ action: 'TEMPLATE', text: pickText(ev, 'title', lang), dates: `${start}/${end}`, details: details(ev, lang), location: ev.location || '', ctz: 'Asia/Kolkata' })
    return `https://calendar.google.com/calendar/render?${q}`
}

// A calendar file for iPhone, Outlook and other calendar apps
export function downloadIcs(ev, lang) {
    const { allDay, start, end } = times(ev)
    const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`)
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const when = allDay ? [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`] : [`DTSTART:${start}`, `DTEND:${end}`]
    const text = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bhim Army Blue Panther//Events//EN', 'BEGIN:VEVENT',
        `UID:${ev._id}@bhimarmybluepanther`, `DTSTAMP:${now}`, ...when,
        `SUMMARY:${esc(pickText(ev, 'title', lang))}`, ev.location ? `LOCATION:${esc(ev.location)}` : '',
        `DESCRIPTION:${esc(details(ev, lang))}`, `URL:${SITE}/events/${ev._id}`, 'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
    a.download = 'event.ics'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const mapsLink = (location) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

// "10:30" becomes "10:30 am" (English) or "सुबह 10:30" style text from the browser
export function timeText(time, lang) {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
}

export { day as eventDay, pad }