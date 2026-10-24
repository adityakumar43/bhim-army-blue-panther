import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero.jsx'
import Slider from '../components/Slider.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import { cdn } from '../lib/img.js'
import { campaigns } from '../data/compaigns.js'
import InspirationsPreview from '../components/InspirationsPreview.jsx'

const hideBroken = (e) => { e.currentTarget.style.display = 'none' }
const wrap = 'mx-auto max-w-7xl px-5 py-16 lg:px-16'
const cardBox = 'flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition hover:shadow-md'

function SectionHead({ title, intro, to, label }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-extrabold">{title}</h2>
        {intro && <p className="mt-2 text-navy/70">{intro}</p>}
      </div>
      <Link to={to} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
        {label}<Icon name="arrow" size={18} />
      </Link>
    </div>
  )
}

function DateLine({ date, place, lang }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-brand">
      <span className="inline-flex items-center gap-1.5"><Icon name="calendar" size={16} />{formatDate(date, lang)}</span>
      {place && <span className="inline-flex items-center gap-1.5 text-navy/70"><Icon name="pin" size={16} />{place}</span>}
    </div>
  )
}

const PATH = [['educate', 'book', 'bg-mist text-brand'], ['organize', 'users', 'bg-gold/20 text-navy'], ['struggle', 'shield', 'bg-brand/10 text-brand']]

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
      const today = new Date().toLocaleDateString('en-CA')
      const upcoming = all.filter((e) => e.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date))
      const past = all.filter((e) => e.date.slice(0, 10) < today).sort((a, b) => b.date.localeCompare(a.date))
      setEvents([...upcoming, ...past].slice(0, 3))
    }).catch(() => setEvents([]))
  }, [])

  return (
    <>

      {slides.length > 0 && <Slider slides={slides} />}
      <Hero />

      {/* Our path: the three principles */}
      <section className="bg-white">
        <div className={wrap}>
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold">{t('about.principlesTitle')}</h2>
            <p className="mt-3 text-lg text-navy/70">{t('about.intro')}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PATH.map(([key, icon, tone], i) => (
              <article key={key} className="rounded-2xl border border-navy/10 bg-[#f6f8fc] p-6">
                <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} size={24} /></span>
                <h3 className="mb-2 text-xl font-extrabold">{i + 1}. {t(`about.${key}.title`)}</h3>
                <p className="text-navy/75">{t(`about.${key}.text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Campaigns (from data/campaigns.js; add image: '/campaigns/name.jpg' to show a photo) */}
      <section className="bg-[#f3f6fb]">
        <div className={wrap}>
          <SectionHead title={t('sections.campaigns')} intro={t('home.campaignsIntro')} to="/campaigns" label={t('viewAll')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <article key={c.id} className={`${cardBox} ${c.image ? '' : 'border-t-4 border-t-brand'}`}>
                {c.image && <img src={c.image} alt="" loading="lazy" onError={hideBroken} className="aspect-video w-full object-cover object-top" />}
                <div className="flex-1 p-6">
                  <h3 className="mb-2 text-xl font-extrabold">{pickText(c, 'title', lang)}</h3>
                  <p className="text-navy/75">{pickText(c, 'body', lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="bg-white">
          <div className={wrap}>
            <SectionHead title={t('sections.events')} intro={t('home.eventsIntro')} to="/news" label={t('viewAll')} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <Link key={ev._id} to={`/events/${ev._id}`} className={cardBox}>
                  {ev.image?.url && <img src={cdn(ev.image.url, 600)} alt="" loading="lazy" onError={hideBroken} className="aspect-video w-full object-cover" />}
                  <div className="flex-1 p-6">
                    <DateLine date={ev.date} place={ev.location} lang={lang} />
                    <h3 className="mb-2 text-xl font-extrabold">{pickText(ev, 'title', lang)}</h3>
                    <p className="line-clamp-2 text-navy/75">{pickText(ev, 'body', lang)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={events.length > 0 ? 'bg-[#f3f6fb]' : 'bg-white'}>
        <div className={wrap}>
          <SectionHead title={t('sections.news')} intro={t('home.newsIntro')} to="/news" label={t('viewAll')} />
          {news.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <Link key={n._id} to={`/news/${n._id}`} className={cardBox}>
                {n.image?.url && <img src={cdn(n.image.url, 600)} alt="" loading="lazy" onError={hideBroken} className="aspect-video w-full object-cover" />}
                <div className="flex-1 p-6">
                  <DateLine date={n.createdAt} lang={lang} />
                  <h3 className="mb-2 text-xl font-extrabold">{pickText(n, 'title', lang)}</h3>
                  <p className="line-clamp-2 text-navy/75">{pickText(n, 'body', lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      <InspirationsPreview />

      {/* Call to action */}
      <section className="bg-linear-to-br from-navy via-[#0d2a6b] to-brand text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center lg:px-16">
          <h2 className="text-3xl font-extrabold text-gold">{t('sections.band')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/85">{t('home.bandIntro')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/join" className="btn rounded-xl bg-gold text-navy shadow-lg hover:brightness-105">{t('cta.register')}</Link>
            <Link to="/contact" className="btn rounded-xl border border-white/30 text-white hover:bg-white/10">{t('nav.contact')}</Link>
          </div>
        </div>
      </section>
    </>
  )
}