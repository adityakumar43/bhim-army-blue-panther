import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Chakra from './Chakra.jsx'

export default function Hero() {
  const { t } = useTranslation()
  
  const lines = t('tagline').split(/,\s*/)

  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <Chakra className="pointer-events-none absolute -top-40 -right-40 h-130 w-130 text-white/10 lg:-right-24 lg:h-176 lg:w-176" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-16 lg:py-24">
        <div>
          <p className="font-semibold text-gold">{t('greeting')}</p>
          <h1 className="mt-3 mb-6 border-t border-white/25 text-[clamp(1.5rem,2.8vw,2.25rem)] font-extrabold">
            {lines.map((line) => (
              <span key={line} className="block border-b border-white/25 py-1">{line}</span>
            ))}
          </h1>
          <p className="mb-8 max-w-xl text-lg lg:text-xl">{t('mission')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/join" className="btn bg-gold text-navy">{t('cta.member')}</Link>
            <Link to="/donate" className="btn border-2 border-white">{t('cta.donate')}</Link>
          </div>
        </div>

        {/* Shows the photo when /hero.jpg exists, otherwise the wheel */}
        <div className="lg:self-start lg:translate-y-4 relative aspect-4/3 w-full overflow-hidden bg-navy/40 ring-1 ring-white/20">
          <Chakra className="absolute inset-0 m-auto h-3/4 w-3/4 text-white/25" />
          <img src="/hero.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }}
            className="absolute inset-0 h-full w-full object-contain" />
        </div>
      </div>
    </section>
  )
}
