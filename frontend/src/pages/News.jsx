import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import ZoomPhoto from '../components/ZoomPhoto.jsx'
import { pickText, formatDate } from '../lib/text.js'
import Loading from '../components/Loading.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { WhatsAppShare, ListenButton } from '../components/ShareListen.jsx'

const PAGE = 50

export default function News() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [news, setNews] = useState(null)
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')
  const [more, setMore] = useState({ news: false, events: false }) // a full page came back: there may be older ones
  const [busy, setBusy] = useState('')
  const [olderFailed, setOlderFailed] = useState('')

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

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-16">

      {news.length === 0 && <EmptyState icon="news" />}
      <div className="flex flex-col gap-8">
        {news.map((n) => (
          <article key={n._id} className="panel">
            {n.image?.url && <ZoomPhoto item={n} width={1000} buttonClassName="mb-4" className="max-h-96 w-full object-cover" />}
            <div className="font-semibold text-brand">{formatDate(n.createdAt, lang)}</div>
            <h2 className="my-1 text-2xl font-extrabold">
              <Link to={`/news/${n._id}`} className="hover:text-brand hover:underline">{pickText(n, 'title', lang)}</Link>
            </h2>
            {/* Only the first 3 lines here; the whole text, poster and more are on its own page */}
            <p className="line-clamp-3 whitespace-pre-line text-lg">{pickText(n, 'body', lang)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to={`/news/${n._id}`} className="inline-flex min-h-10 items-center rounded-full px-1 font-semibold text-brand hover:underline">{t('detail.readMore')} →</Link>
              <ListenButton item={n} small />
              <WhatsAppShare item={n} kind="news" small />
            </div>
          </article>
        ))}
      </div>
      {olderButton('news')}

      <div className="mt-16 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-extrabold">{t('sections.events')}</h2>
        <Link to="/events" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand/20 bg-white px-4 font-semibold text-brand hover:bg-mist">📅 {t('cal.open')}</Link>
      </div>
      {events.length === 0 && <EmptyState icon="calendar" />}
      <div className="flex flex-col gap-6">
        {events.map((ev) => (
          <article key={ev._id} className="panel">
            {ev.image?.url && <ZoomPhoto item={ev} width={1000} buttonClassName="mb-4" className="max-h-80 w-full object-cover" />}
            <div className="font-semibold text-brand">
              {formatDate(ev.date, lang)}{ev.location ? `, ${ev.location}` : ''}
            </div>
            <h3 className="my-1 text-xl font-extrabold">
              <Link to={`/events/${ev._id}`} className="hover:text-brand hover:underline">{pickText(ev, 'title', lang)}</Link>
            </h3>
            <p className="line-clamp-3 whitespace-pre-line">{pickText(ev, 'body', lang)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to={`/events/${ev._id}`} className="inline-flex min-h-10 items-center rounded-full px-1 font-semibold text-brand hover:underline">{t('detail.readMore')} →</Link>
              <ListenButton item={ev} kind="events" small />
              <WhatsAppShare item={ev} kind="events" small />
            </div>
          </article>
        ))}
      </div>
      {olderButton('events')}
    </div>
  )
}
