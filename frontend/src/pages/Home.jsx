import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero.jsx'
import Slider from '../components/Slider.jsx'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import { campaigns } from '../data/compaigns.js'
import { cdn } from '../lib/img.js'

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [news, setNews] = useState([])
  const [slides, setSlides] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    api.get('/news?limit=3').then(setNews).catch(() => setNews([]))
    api.get('/slides').then(setSlides).catch(() => setSlides([]))
    // Upcoming events first (soonest on top), then the most recent past ones. Three are shown.
    api.get('/events?limit=20').then((all) => {
      const today = new Date().toLocaleDateString('en-CA') // like 2026-10-12
      const upcoming = all.filter((e) => e.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date))
      const past = all.filter((e) => e.date.slice(0, 10) < today).sort((a, b) => b.date.localeCompare(a.date))
      setEvents([...upcoming, ...past].slice(0, 3))
    }).catch(() => setEvents([]))
  }, [])

  return (
    <>
      {slides.length > 0 && <Slider slides={slides} />}
      <Hero />

      <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-16">
        <div className="mb-7 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-extrabold">{t('sections.campaigns')}</h2>
          <Link to="/campaigns" className="shrink-0 font-semibold text-brand">{t('viewAll')}</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <article key={c.id} className="border border-brand/20 border-t-4 border-t-brand bg-white p-6">
              <h3 className="mb-2 text-xl font-extrabold">{pickText(c, 'title', lang)}</h3>
              <p className="text-navy/80">{pickText(c, 'body', lang)}</p>
            </article>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pt-14 lg:px-16">
          <div className="mb-7 flex items-baseline justify-between gap-4">
            <h2 className="text-3xl font-extrabold">{t('sections.events')}</h2>
            <Link to="/news" className="shrink-0 font-semibold text-brand">{t('viewAll')}</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link key={ev._id} to={`/events/${ev._id}`}
                className="block border border-brand/20 border-t-4 border-t-brand bg-white p-6 hover:bg-mist">
                {ev.image?.url && <img src={cdn(ev.image.url, 600)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="mb-4 aspect-video w-full object-cover" />}
                <div className="font-semibold text-brand">{formatDate(ev.date, lang)}</div>
                <h3 className="my-1 text-xl font-extrabold">{pickText(ev, 'title', lang)}</h3>
                {ev.location && <div className="text-navy/70">{ev.location}</div>}
                <p className="mt-2 line-clamp-2 text-navy/80">{pickText(ev, 'body', lang)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-16">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-extrabold">{t('sections.news')}</h2>
          <Link to="/news" className="shrink-0 font-semibold text-brand">{t('viewAll')}</Link>
        </div>
        {news.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
        {news.map((n) => (
          <Link to={`/news/${n._id}`} key={n._id}
            className="flex flex-col gap-2 border-b border-brand/20 py-4 hover:bg-mist sm:flex-row sm:items-center sm:gap-6">
            <span className="shrink-0 font-semibold text-brand sm:w-44">{formatDate(n.createdAt, lang)}</span>
            {n.image?.url && <img src={cdn(n.image.url, 240)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="h-20 w-32 shrink-0 object-cover" />}
            <span className="text-lg">{pickText(n, 'title', lang)}</span>
          </Link>
        ))}
      </section>

      <section className="bg-gold">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-10 lg:flex-row lg:items-center lg:px-16">
          <h2 className="text-2xl font-extrabold lg:text-3xl">{t('sections.band')}</h2>
          <Link to="/join" className="btn bg-navy text-white">{t('cta.register')}</Link>
        </div>
      </section>
    </>
  )
}
