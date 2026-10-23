import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Chakra from './Chakra.jsx'
import Icon from './Icon.jsx'
import { pickText } from '../lib/text.js'
import { stats } from '../data/stats.js'

const dots = { backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }

export default function Hero() {
  const { t, i18n } = useTranslation()
  const [photoOk, setPhotoOk] = useState(true)
  // The photo's own width ÷ height, measured when it loads, so the frame takes exactly its shape
  const [ratio, setRatio] = useState(4 / 5)
  const photo = useRef(null)
  const measure = () => {
    const img = photo.current
    if (img?.naturalWidth) setRatio(img.naturalWidth / img.naturalHeight)
  }
  useEffect(measure, []) // in case the photo was already loaded from the browser's cache
  const lines = t('tagline').split(/,\s*/) // each part of the tagline on its own line

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0" style={dots} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.55),transparent_60%)]" />
      <Chakra className="pointer-events-none absolute -right-40 -bottom-40 h-130 w-130 text-white/5" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-16 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold text-gold">
            <Icon name="spark" size={16} />{t('greeting')}
          </p>
          <h1 className="mt-5 mb-5 text-[clamp(1.4rem,2.4vw,2.1rem)] leading-snug font-extrabold">
            {lines.map((line) => <span key={line} className="block">{line}</span>)}
          </h1>
          <p className="mb-8 max-w-xl text-lg text-white/80">{t('mission')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/join" className="btn gap-2 rounded-xl bg-gold text-navy shadow-lg hover:brightness-105">
              <Icon name="users" />{t('cta.member')}
            </Link>
            <Link to="/donate" className="btn gap-2 rounded-xl border border-white/25 bg-white/5 text-white hover:bg-white/10">
              <Icon name="heart" />{t('cta.donate')}
            </Link>
          </div>

          {stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.value + s.labelEn}>
                  <dt className="sr-only">{pickText(s, 'label', i18n.language)}</dt>
                  <dd className="text-3xl font-extrabold text-gold">{s.value}</dd>
                  <dd className="text-sm text-white/70">{pickText(s, 'label', i18n.language)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Your photo (public/hero.jpg), shown whole in its own shape and lined up with the top of the text.
            Without a photo, the wheel is shown instead. */}
        <div
          className={photoOk
            ? 'relative w-full overflow-hidden rounded-2xl bg-white/5 shadow-2xl ring-1 ring-white/15 lg:h-[30rem] lg:w-auto lg:max-w-full lg:self-start lg:justify-self-end'
            : 'relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-white/5 shadow-2xl ring-1 ring-white/15 lg:self-start'}
          style={photoOk ? { aspectRatio: ratio } : undefined}
        >
          {photoOk
            ? <img ref={photo} src="/hero.jpg" alt="" onLoad={measure} onError={() => setPhotoOk(false)} className="absolute inset-0 h-full w-full object-contain" />
            : <Chakra className="absolute inset-0 m-auto h-2/3 w-2/3 text-white/20" />}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/90 to-transparent p-5 pt-16">
            <span className="rounded-md bg-gold px-2.5 py-1 text-xs font-extrabold text-navy">{t('heroPhoto')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}