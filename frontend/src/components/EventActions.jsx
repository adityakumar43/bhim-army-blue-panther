import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { googleCalendarLink, downloadIcs, mapsLink } from '../lib/calendar.js'

// Under an event: "Add to my calendar" (Google Calendar, or a file for iPhone and others) and "Directions"
export default function EventActions({ event, className = '' }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [open, setOpen] = useState(false)
    const btn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand/20 bg-white px-3 text-sm font-semibold text-brand hover:bg-mist'
    return (
        <div className={`flex flex-wrap items-start gap-2 ${className}`}>
            <div className="relative">
                <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={btn}>📅 {t('cal.add', { defaultValue: 'Add to my calendar' })}</button>
                {open && (
                    <div className="absolute left-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-navy/10 bg-white text-sm shadow-lg">
                        <a href={googleCalendarLink(event, lang)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block px-4 py-3 font-semibold hover:bg-mist">Google Calendar</a>
                        <button type="button" onClick={() => { downloadIcs(event, lang); setOpen(false) }} className="block w-full px-4 py-3 text-left font-semibold hover:bg-mist">
                            {t('cal.other', { defaultValue: 'iPhone, Outlook & others' })}
                        </button>
                    </div>
                )}
            </div>
            {event.location && (
                <a href={mapsLink(event.location)} target="_blank" rel="noreferrer" className={btn}>🧭 {t('cal.directions', { defaultValue: 'Directions' })}</a>
            )}
        </div>
    )
}
