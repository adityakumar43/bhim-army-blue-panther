import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BANDS } from './bands.js'

const dots = { backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }

// children: optional extra content under the intro (for example buttons)
// wrap: width and side padding of the inside, so the title lines up with the page's content below it
export function Band({ kicker, title, intro, children, wrap = 'max-w-7xl px-5 lg:px-16' }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0" style={dots} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.55),transparent_60%)]" />
      <div className={`relative mx-auto py-7 sm:py-10 lg:py-12 ${wrap}`}>
        <p className="mb-2 text-sm font-semibold text-gold">{kicker}</p>
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-snug font-extrabold">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-white/80 sm:mt-3 sm:text-lg">{intro}</p>}
        {children}
      </div>
    </section>
  )
}

export default function PageBand() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (!Object.hasOwn(BANDS, pathname)) return null
  const [title, intro, wrap] = BANDS[pathname]
  return <Band kicker={t('org')} title={t(title)} intro={intro ? t(intro) : null} wrap={wrap} />
}
