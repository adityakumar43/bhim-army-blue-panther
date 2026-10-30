import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import { STATES, stateName, stateByCode } from '../data/states.js'
import { eventDay, timeText, pad } from '../lib/calendar.js'
import EventActions from '../components/EventActions.jsx'
import Loading from '../components/Loading.jsx'

// Today's date in India, like 2026-10-30
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

// The six weeks shown for a month: from the Sunday on or before the 1st
function monthGrid(year, month) {
    const first = new Date(Date.UTC(year, month, 1))
    const start = new Date(first)
    start.setUTCDate(1 - first.getUTCDay())
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start)
        d.setUTCDate(start.getUTCDate() + i)
        return { key: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month }
    })
}

// Events calendar: a small month calendar on the side (on top on phones), and the events beside it.
// Days with events have a gold dot; tap a day to see only its events.
export default function Events() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
    const today = todayKey()
    const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }))
    const [state, setState] = useState('')
    const [picked, setPicked] = useState('') // a day, or '' for the whole month
    const [events, setEvents] = useState(null)
    const [failed, setFailed] = useState(false)
    const listRef = useRef(null)

    const grid = useMemo(() => monthGrid(ym.y, ym.m), [ym])
    useEffect(() => {
        setEvents(null); setFailed(false); setPicked('')
        api.get(`/calendar?from=${grid[0].key}&to=${grid[41].key}`).then(setEvents).catch(() => { setEvents([]); setFailed(true) })
    }, [grid])

    const shown = useMemo(() => (events || [])
        .filter((e) => !state || e.stateCode === state)
        .sort((a, b) => `${eventDay(a)} ${a.time || ''}`.localeCompare(`${eventDay(b)} ${b.time || ''}`)), [events, state])
    const byDay = useMemo(() => {
        const map = {}
        for (const e of shown) (map[eventDay(e)] ||= []).push(e)
        return map
    }, [shown])
    const monthKey = `${ym.y}-${pad(ym.m + 1)}`
    const list = picked ? byDay[picked] || [] : shown.filter((e) => eventDay(e).startsWith(monthKey))

    const monthTitle = new Date(Date.UTC(ym.y, ym.m, 1)).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 1, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })) // 1 Feb 2026 is a Sunday
    const move = (n) => setYm(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() } })
    const goToday = () => setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })
    const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])
    const dayTitle = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

    function pick(key) {
        setPicked(picked === key ? '' : key)
        // On phones the list is below the calendar, so bring it into view
        if (window.innerWidth < 1024) setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    const navBtn = 'grid h-9 w-9 place-items-center rounded-full text-xl font-bold text-brand hover:bg-mist'

    return (
        <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8">

                {/* The small month calendar, and the state filter */}
                <aside className="flex flex-col gap-3 lg:sticky lg:top-24">
                    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <button onClick={() => move(-1)} aria-label={t('cal.prev', { defaultValue: 'Previous month' })} className={navBtn}>‹</button>
                            <h2 className="text-lg font-extrabold" aria-live="polite">{monthTitle}</h2>
                            <button onClick={() => move(1)} aria-label={t('cal.next', { defaultValue: 'Next month' })} className={navBtn}>›</button>
                        </div>

                        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-navy/45 uppercase">
                            {weekdays.map((w) => <div key={w} className="pb-1.5">{w}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                            {grid.map(({ key, day, inMonth }) => {
                                const count = (byDay[key] || []).length
                                const isToday = key === today
                                const isPicked = key === picked
                                return (
                                    <button key={key} type="button" onClick={() => pick(key)} disabled={!inMonth}
                                        aria-label={`${dayTitle(key)}${count ? ` – ${count} ${t('cal.events', { defaultValue: 'events' })}` : ''}`}
                                        aria-pressed={isPicked}
                                        className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition
                      ${!inMonth ? 'text-navy/20' : isPicked ? 'bg-brand text-white shadow-md shadow-brand/30' : isToday ? 'bg-mist text-brand ring-1 ring-brand/40' : 'text-navy hover:bg-mist'}
                      ${inMonth && count ? 'font-extrabold' : ''}`}>
                                        {day}
                                        {inMonth && count > 0 && (
                                            <span className="absolute bottom-1 flex gap-0.5" aria-hidden="true">
                                                {Array.from({ length: Math.min(count, 3) }, (_, i) => <span key={i} className={`h-1 w-1 rounded-full ${isPicked ? 'bg-white' : 'bg-gold'}`} />)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-navy/5 pt-3 text-xs text-navy/55">
                            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />{t('cal.hasEvents', { defaultValue: 'Has events' })}</span>
                            <button onClick={() => { goToday(); setPicked('') }} className="rounded-lg px-2 py-1 font-semibold text-brand hover:bg-mist">{t('cal.today', { defaultValue: 'Today' })}</button>
                        </div>
                    </div>

                    <select value={state} onChange={(e) => { setState(e.target.value); setPicked('') }} aria-label={t('cal.state', { defaultValue: 'State' })} className="input min-h-11 py-2">
                        <option value="">📍 {t('cal.allStates', { defaultValue: 'All states' })}</option>
                        {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                    </select>
                    {failed && <p role="alert" className="text-sm text-red-700">⚠️ {t('cal.failed', { defaultValue: 'Could not load the events. Please try again.' })}</p>}
                </aside>

                {/* The events of the month, or of the chosen day */}
                <section ref={listRef} className="min-w-0 scroll-mt-24">
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-xl font-extrabold sm:text-2xl">
                            {picked ? dayTitle(picked) : t('cal.thisMonth', { month: monthTitle, defaultValue: 'Events in {{month}}' })}
                        </h2>
                        {picked && <button onClick={() => setPicked('')} className="text-sm font-semibold text-brand underline">{t('cal.wholeMonth', { defaultValue: 'Show the whole month' })}</button>}
                    </div>
                    {events === null && <Loading />}
                    {events && list.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-10 text-center text-navy/65">
                            <p className="text-3xl" aria-hidden="true">📭</p>
                            <p className="mt-2">{picked ? t('cal.noneDay', { defaultValue: 'No events on this day.' }) : t('cal.noneMonth', { defaultValue: 'No events this month. Try the next month.' })}</p>
                            {!picked && <button onClick={() => move(1)} className="mt-3 text-sm font-semibold text-brand underline">{t('cal.next', { defaultValue: 'Next month' })} →</button>}
                        </div>
                    )}
                    <ul className="flex flex-col gap-3">
                        {list.map((e) => {
                            const d = new Date(`${eventDay(e)}T00:00:00Z`)
                            const past = eventDay(e) < today
                            return (
                                <li key={e._id} className={`flex gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm ${past ? 'opacity-70' : ''}`}>
                                    <div className="flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-xl bg-brand py-2 text-white">
                                        <span className="text-[11px] font-semibold uppercase opacity-80">{d.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' })}</span>
                                        <span className="text-2xl leading-none font-extrabold">{d.getUTCDate()}</span>
                                        <span className="text-[11px] opacity-80">{d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Link to={`/events/${e._id}`} className="text-lg leading-snug font-extrabold hover:text-brand hover:underline">{pickText(e, 'title', lang)}</Link>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy/70">
                                            {e.time && <span>🕒 {timeText(e.time, lang)}</span>}
                                            {e.location && <span>📍 {e.location}</span>}
                                            {e.stateCode && <span>🗺️ {stateName(stateByCode(e.stateCode) || { en: e.stateCode, hi: e.stateCode }, lang)}</span>}
                                            {past && <span className="font-semibold">{t('cal.past', { defaultValue: 'Already held' })}</span>}
                                        </div>
                                        {!past && <EventActions event={e} className="mt-3" />}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            </div>
        </div>
    )
}
