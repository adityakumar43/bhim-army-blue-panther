import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'

export default function News() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [news, setNews] = useState(null)
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/news'), api.get('/events')])
      .then(([n, e]) => { setNews(n); setEvents(e) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="px-5 py-16 text-center text-red-700">{error}</p>
  if (!news) return <p className="px-5 py-16 text-center">{t('loading')}</p>

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-16">
      <h1 className="mb-8 text-4xl font-extrabold">{t('sections.news')}</h1>
      {news.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
      <div className="flex flex-col gap-8">
        {news.map((n) => (
          <article key={n._id} className="border-b border-brand/20 pb-8">
            {n.image?.url && <img src={n.image.url} alt="" className="mb-4 max-h-96 w-full object-cover" />}
            <div className="font-semibold text-brand">{formatDate(n.createdAt, lang)}</div>
            <h2 className="my-1 text-2xl font-extrabold">{pickText(n, 'title', lang)}</h2>
            <p className="whitespace-pre-line text-lg">{pickText(n, 'body', lang)}</p>
          </article>
        ))}
      </div>

      <h2 className="mt-16 mb-6 text-3xl font-extrabold">{t('sections.events')}</h2>
      {events.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
      <div className="flex flex-col gap-6">
        {events.map((ev) => (
          <article key={ev._id} className="border border-brand/20 p-5">
            <div className="font-semibold text-brand">
              {formatDate(ev.date, lang)}{ev.location ? `, ${ev.location}` : ''}
            </div>
            <h3 className="my-1 text-xl font-extrabold">{pickText(ev, 'title', lang)}</h3>
            <p className="whitespace-pre-line">{pickText(ev, 'body', lang)}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
