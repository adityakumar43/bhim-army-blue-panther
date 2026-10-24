import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'

// Hindi or English list (contributions, bio). Falls back to the other language.
export const pickList = (item, field, lang) => {
  const hi = item[`${field}Hi`], en = item[`${field}En`]
  return (lang === 'hi' ? (hi?.length ? hi : en) : (en?.length ? en : hi)) || []
}

// First letters of the name, shown until a photo is added
const initials = (name) => name.replace(/^(Dr\.|Mahatma|Mata|Manyavar|Sree|Chhatrapati|Periyar|डॉ\.|महात्मा|माता|मान्यवर|श्री|छत्रपति|पेरियार|वीरांगना)\s+/, '')
  .split(/\s+/).filter(Boolean).slice(0, 1).map((w) => w[0]).join('').toUpperCase()

export function InspirationPhoto({ person, name, className = '' }) {
  const [broken, setBroken] = useState(false)
  if (!person.photo || broken) {
    return (
      <div aria-hidden="true" className={`flex items-center justify-center bg-linear-to-br from-navy to-brand text-4xl font-extrabold text-gold/90 ${className}`}>
        {initials(name)}
      </div>
    )
  }
  return <img src={person.photo} alt={name} loading="lazy" onError={() => setBroken(true)} className={`bg-mist object-cover object-top ${className}`} />
}

export default function InspirationCard({ person }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const name = pickText(person, 'name', lang)
  const contributions = pickList(person, 'contributions', lang).slice(0, 2)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <InspirationPhoto person={person} name={name} className="aspect-[5/4] w-full" />
        <span className="absolute bottom-2 left-2 rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-semibold text-gold">
          {pickText(person, 'years', lang)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug font-extrabold">{name}</h3>
        <p className="mt-0.5 text-xs font-semibold text-brand">{pickText(person, 'title', lang)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-navy/80">{pickText(person, 'short', lang)}</p>
        {contributions.length > 0 && (
          <div className="mt-3 rounded-lg bg-mist/60 p-3">
            <h4 className="mb-1 text-xs font-bold text-navy">{t('inspire.keyContributions')}</h4>
            <ul className="text-sm text-navy/80">
              {contributions.map((c) => (
                <li key={c} className="flex gap-2"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" /><span className="line-clamp-2">{c}</span></li>
              ))}
            </ul>
          </div>
        )}
        <Link to={`/inspirations/${person.slug}`} aria-label={`${t('inspire.readMore')}: ${name}`}
          className="mt-auto inline-flex min-h-10 items-center gap-1 pt-2 text-sm font-bold text-brand group-hover:underline">
          {t('inspire.readMore')} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
