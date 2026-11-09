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
import EmptyState from '../components/EmptyState.jsx'
import SamvidhanBanner from '../components/SamvidhanBanner.jsx'

const hideBroken = (e) => { e.currentTarget.style.display = 'none' }
// The slides from the last visit, shown at once while the new list loads (null = never loaded on this device)
const cachedSlides = () => { try { return JSON.parse(localStorage.getItem('slidesCache')) } catch { return null } }
const cacheSlides = (list) => { try { localStorage.setItem('slidesCache', JSON.stringify(list)) } catch { /* ignore */ } }
const wrap = 'mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-16' // a little less space between sections on phones
const cardBox = 'flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition hover:shadow-md'

function SectionHead({ title, intro, to, label }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
      <div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {intro && <p className="mt-2 text-navy/70">{intro}</p>}
      </div>
      <Link to={to} className="inline-flex min-h-10 items-center gap-1 rounded-lg border-2 border-brand px-4 text-sm font-bold text-brand hover:bg-brand hover:text-white">
        {label} <span aria-hidden="true">→</span>
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
  const [slides, setSlides] = useState(cachedSlides) // null while the first load is still on its way
  const [events, setEvents] = useState([])

  useEffect(() => {
    api.get('/news?limit=3').then(setNews).catch(() => setNews([]))
    // Use the list index.html already started loading, if there is one
    const early = window.__slides
    window.__slides = undefined
      ; (early ? early.then((list) => list || api.get('/slides')) : api.get('/slides'))
        .then((list) => { setSlides(list); cacheSlides(list) })
        .catch(() => setSlides((old) => old || []))
    // Upcoming events first (soonest on top), then the most recent past ones. Three are shown.
    api.get('/events?limit=20').then((all) => {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()) // today in India, like the Events page
      const upcoming = all.filter((e) => e.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date))
      const past = all.filter((e) => e.date.slice(0, 10) < today).sort((a, b) => b.date.localeCompare(a.date))
      setEvents([...upcoming, ...past].slice(0, 3))
    }).catch(() => setEvents([]))
  }, [])

  return (
    <>

      {/* 25 and 26 November only: the Samvidhan Divas banner (it hides itself on other days) */}
      <SamvidhanBanner />

      {/* While the slides load for the first time, an empty box of the same size keeps the page from jumping */}
      {slides === null
        ? <div aria-hidden="true" className="aspect-4/3 w-full bg-navy sm:aspect-video lg:aspect-21/9 lg:max-h-136" />
        : slides.length > 0 && <Slider slides={slides} />}
      {/* On phones the big photo in the Hero is left out when the slider above already shows pictures */}
      <Hero photoOnPhones={!slides?.length} />

      {/* Our path: the three principles */}
      <section className="bg-white">
        <div className={wrap}>
          <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t('about.principlesTitle')}</h2>
            <p className="mt-3 text-navy/70 sm:text-lg">{t('about.intro')}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PATH.map(([key, icon, tone], i) => (
              <article key={key} className="flex gap-4 rounded-2xl border border-navy/10 bg-[#f6f8fc] p-4 sm:p-6 md:block">
                <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl md:mb-4 md:h-12 md:w-12 ${tone}`}><Icon name={icon} size={24} /></span>
                <div>
                  <h3 className="mb-1 text-lg font-extrabold md:mb-2 md:text-xl">{i + 1}. {t(`about.${key}.title`)}</h3>
                  <p className="text-navy/75">{t(`about.${key}.text`)}</p>
                </div>
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
            {campaigns.slice(0, 3).map((c) => ( // only the first 3 here; "View all" opens the full list
              <article key={c.id} className={`${cardBox} ${c.image ? '' : 'border-t-4 border-t-brand'}`}>
                {c.image && <img src={c.image} alt="" loading="lazy" onError={hideBroken} className="aspect-video w-full object-cover object-top" />}
                <div className="flex-1 p-5 sm:p-6">
                  <h3 className="mb-2 text-lg font-extrabold sm:text-xl">{pickText(c, 'title', lang)}</h3>
                  <p className="line-clamp-4 text-navy/75">{pickText(c, 'body', lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="bg-white">
          <div className={wrap}>
            <SectionHead title={t('sections.events')} intro={t('home.eventsIntro')} to="/events" label={t('cal.open')} />
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {events.map((ev) => (
                <Link key={ev._id} to={`/events/${ev._id}`} className={`${cardBox} max-sm:flex-row max-sm:items-center`}>
                  {ev.image?.url && <img src={cdn(ev.image.url, 600)} alt="" loading="lazy" onError={hideBroken} className="aspect-[5/2] w-full object-cover max-sm:ml-3 max-sm:aspect-square max-sm:w-20 max-sm:shrink-0 max-sm:rounded-xl" />}
                  <div className="min-w-0 flex-1 p-5 max-sm:p-3">
                    <DateLine date={ev.date} place={ev.location} lang={lang} />
                    <h3 className="mb-1.5 line-clamp-2 text-lg leading-snug font-extrabold max-sm:mb-0 max-sm:text-base">{pickText(ev, 'title', lang)}</h3>
                    <p className="line-clamp-2 text-navy/75 max-sm:hidden">{pickText(ev, 'body', lang)}</p>
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
          {news.length === 0 && <EmptyState icon="news" />}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {news.map((n) => (
              <Link key={n._id} to={`/news/${n._id}`} className={`${cardBox} max-sm:flex-row max-sm:items-center`}>
                {n.image?.url && <img src={cdn(n.image.url, 600)} alt="" loading="lazy" onError={hideBroken} className="aspect-[5/2] w-full object-cover max-sm:ml-3 max-sm:aspect-square max-sm:w-20 max-sm:shrink-0 max-sm:rounded-xl" />}
                <div className="min-w-0 flex-1 p-5 max-sm:p-3">
                  <DateLine date={n.createdAt} lang={lang} />
                  <h3 className="mb-1.5 line-clamp-2 text-lg leading-snug font-extrabold max-sm:mb-0 max-sm:text-base">{pickText(n, 'title', lang)}</h3>
                  <p className="line-clamp-2 text-navy/75 max-sm:hidden">{pickText(n, 'body', lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Opposite colour to Latest News above, so the two sections never run together */}
      <InspirationsPreview grey={events.length === 0} />

      {/* Call to action */}
      <section className="bg-linear-to-br from-navy via-[#0d2a6b] to-brand text-white">
        <div className="mx-auto max-w-4xl px-5 py-12 text-center sm:py-16 lg:px-16">
          <h2 className="text-2xl font-extrabold text-gold sm:text-3xl">{t('sections.band')}</h2>
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