import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Pages that open with the dark title band: [heading, optional intro line]
const BANDS = {
  '/about': ['about.title'],
  '/campaigns': ['sections.campaigns', 'home.campaignsIntro'],
  '/news': ['sections.news', 'home.newsIntro'],
  '/gallery': ['nav.gallery'],
  '/contact': ['contact.title'],
  '/join': ['join.title', 'join.intro'],
  '/donate': ['donate.title', 'donate.intro'],
  '/leadership/states': ['leaders.statesTitle', 'leaders.statesIntro'],
}

// Pages with a band get the light grey background. Each state's page draws its own band (with the state's name).
export const hasBand = (pathname) => Object.hasOwn(BANDS, pathname) || pathname.startsWith('/leadership/states/')

const dots = { backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }

export function Band({ kicker, title, intro }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0" style={dots} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.55),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-16 lg:py-16">
        <p className="mb-3 text-sm font-semibold text-gold">{kicker}</p>
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-snug font-extrabold">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg text-white/80">{intro}</p>}
      </div>
    </section>
  )
}

export default function PageBand() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (!Object.hasOwn(BANDS, pathname)) return null
  const [title, intro] = BANDS[pathname]
  return <Band kicker={t('org')} title={t(title)} intro={intro ? t(intro) : null} />
}