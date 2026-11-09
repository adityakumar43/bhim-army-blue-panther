import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import { thumb } from '../lib/img.js'
import { eventDay, timeText } from '../lib/calendar.js'
import Loading from '../components/Loading.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { WhatsAppShare, ListenButton } from '../components/ShareListen.jsx'

const PAGE = 50
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()) // today in India

// A news picture cut to the same 16:9 shape for every card, so the grid lines up.
// A missing or broken picture leaves a calm blue box instead of an empty hole.
function Picture({ item, width }) {
  const [broken, setBroken] = useState(false)
  if (!item.image?.url || broken) {
    return <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy to-brand text-4xl opacity-90">📰</span>
  }
  return (
    <img src={thumb(item.image.url, width, Math.round((width * 9) / 16))} alt="" loading="lazy" onError={() => setBroken(true)}
      className="absolute inset-0 h-full w-full object-cover motion-safe:transition motion-safe:duration-300 group-hover:scale-[1.03]" />
  )
}

// One news item as a card. The newest one ("featured") is wider, with the picture beside the text on computers.
// The others are cards in a grid; on phones they are compact rows (a small picture beside the text).
function NewsCard({ item, featured = false }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const link = `/news/${item._id}`
  return (
    <article className={`group relative flex overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm motion-safe:transition hover:shadow-md ${featured ? 'flex-col md:flex-row' : 'flex-row sm:flex-col'}`}>
      <Link to={link} tabIndex={-1} aria-hidden="true" className={`relative block shrink-0 overflow-hidden bg-mist ${featured ? 'aspect-video md:aspect-auto md:min-h-80 md:w-1/2' : 'w-28 sm:aspect-video sm:w-auto'}`}>
        <Picture item={item} width={featured ? 960 : 640} />
      </Link>
      <div className={`flex min-w-0 flex-1 flex-col ${featured ? 'p-5 sm:p-7' : 'p-3 sm:p-5'}`}>
        <div className="text-sm font-semibold text-brand">{formatDate(item.createdAt, lang)}</div>
        <h2 className={`mt-1 leading-snug font-extrabold ${featured ? 'text-2xl sm:text-3xl' : 'line-clamp-2 text-base sm:text-lg'}`}>
          <Link to={link} className="group-hover:text-brand after:absolute after:inset-0 after:content-['']">{pickText(item, 'title', lang)}</Link>
        </h2>
        <p className={`mt-2 whitespace-pre-line text-navy/75 ${featured ? 'line-clamp-4 text-lg' : 'hidden sm:line-clamp-2'}`}>{pickText(item, 'body', lang)}</p>
        <div className={`relative z-10 mt-auto flex flex-wrap items-center gap-2 ${featured ? 'pt-4' : 'pt-2 sm:pt-4'}`}>
          <Link to={link} className="inline-flex min-h-10 items-center rounded-full px-1 font-semibold text-brand">{t('detail.readMore')} →</Link>
          {/* Small cards: round icon buttons, so everything fits on one line */}
          <ListenButton item={item} small icon={!featured} />
          <WhatsAppShare item={item} kind="news" small icon={!featured} />
        </div>
      </div>
    </article>
  )
}

// One event as a compact row with a calendar-style date, like the Events calendar page
function EventRow({ ev, today }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const day = eventDay(ev)
  const d = new Date(`${day}T00:00:00Z`)
  const past = day < today
  const link = `/events/${ev._id}`
  return (
    <li className={`group relative flex gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm motion-safe:transition hover:shadow-md ${past ? 'opacity-75' : ''}`}>
      <Link to={link} tabIndex={-1} aria-hidden="true" className="flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-xl bg-brand py-2 text-white">
        <span className="text-[11px] font-semibold uppercase opacity-80">{d.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' })}</span>
        <span className="text-2xl leading-none font-extrabold">{d.getUTCDate()}</span>
        <span className="text-[11px] opacity-80">{d.getUTCFullYear()}</span>
      </Link>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-lg leading-snug font-extrabold">
          <Link to={link} className="group-hover:text-brand after:absolute after:inset-0 after:content-['']">{pickText(ev, 'title', lang)}</Link>
        </h3>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy/70">
          {ev.time && <span>🕒 {timeText(ev.time, lang)}</span>}
          {ev.location && <span>📍 {ev.location}</span>}
          {past && <span className="font-semibold">{t('cal.past', { defaultValue: 'Already held' })}</span>}
        </div>
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          <Link to={link} className="inline-flex min-h-10 items-center rounded-full px-1 font-semibold text-brand">{t('detail.readMore')} →</Link>
          <ListenButton item={ev} kind="events" small icon />
          <WhatsAppShare item={ev} kind="events" small icon />
        </div>
      </div>
      {ev.image?.url && (
        <Link to={link} tabIndex={-1} aria-hidden="true" className="hidden h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-mist sm:block">
          <img src={thumb(ev.image.url, 288, 192)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="h-full w-full object-cover" />
        </Link>
      )}
    </li>
  )
}

export default function News() {
  const { t } = useTranslation()
  const [news, setNews] = useState(null)
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')
  const [more, setMore] = useState({ news: false, events: false }) // a full page came back: there may be older ones
  const [busy, setBusy] = useState('')
  const [olderFailed, setOlderFailed] = useState('')
  const today = todayKey()

  function load() {
    setError('')
    setNews(null)
    Promise.all([api.get(`/news?limit=${PAGE}`), api.get(`/events?limit=${PAGE}`)])
      .then(([n, e]) => { setNews(n); setEvents(e); setMore({ news: n.length === PAGE, events: e.length === PAGE }) })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  // The next older ones, added below
  async function older(kind) {
    const list = kind === 'news' ? news : events
    setBusy(kind)
    setOlderFailed('')
    try {
      const page = await api.get(`/${kind}?limit=${PAGE}&skip=${list.length}`)
      const add = page.filter((x) => !list.some((y) => y._id === x._id))
      ;(kind === 'news' ? setNews : setEvents)([...list, ...add])
      setMore((m) => ({ ...m, [kind]: page.length === PAGE }))
    } catch {
      setOlderFailed(kind)
    } finally {
      setBusy('')
    }
  }
  const olderButton = (kind) => (more[kind] || olderFailed === kind) && (
    <div className="mt-6 text-center">
      {olderFailed === kind && <p role="alert" className="mb-2 text-sm text-red-700">⚠️ {t('errors.offline')}</p>}
      <button type="button" onClick={() => older(kind)} disabled={!!busy} className="btn border-2 border-brand bg-white text-brand hover:bg-mist disabled:opacity-60">
        {busy === kind ? t('loading', { defaultValue: 'Loading…' }) : kind === 'news' ? `⬇️ ${t('detail.olderNews', { defaultValue: 'Show older news' })}` : `⬇️ ${t('detail.olderEvents', { defaultValue: 'Show older events' })}`}
      </button>
    </div>
  )

  // Could not load (even after trying again): a clear message and a button, not a bare error
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="rounded-2xl border border-navy/10 bg-white px-6 py-10 shadow-sm">
          <p className="text-3xl" aria-hidden="true">📡</p>
          <p role="alert" className="mt-3 font-semibold text-navy">{error}</p>
          <button type="button" onClick={load} className="btn mt-5 bg-brand text-white hover:bg-navy">🔄 {t('errors.retry', { defaultValue: 'Try again' })}</button>
        </div>
      </div>
    )
  }
  if (!news) return <Loading page />

  const [first, ...rest] = news
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12 lg:px-8">
      {/* News: the newest one large, the rest as a grid of cards (3 across on computers, 2 on tablets, 1 on phones) */}
      {news.length === 0 && <EmptyState icon="news" />}
      {first && <NewsCard item={first} featured />}
      {rest.length > 0 && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((n) => <NewsCard key={n._id} item={n} />)}
        </div>
      )}
      {olderButton('news')}

      {/* Events: compact rows with the date, not big picture cards */}
      <div className="mt-14 mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-extrabold">{t('sections.events')}</h2>
        <Link to="/events" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand/20 bg-white px-4 font-semibold text-brand hover:bg-mist">📅 {t('cal.open')}</Link>
      </div>
      {events.length === 0 && <EmptyState icon="calendar" />}
      <ul className="grid gap-3 lg:grid-cols-2">
        {events.map((ev) => <EventRow key={ev._id} ev={ev} today={today} />)}
      </ul>
      {olderButton('events')}
    </div>
  )
}
