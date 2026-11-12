import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { pickList } from '../lib/inspirationText.js'

// First letters of the name, shown until a photo is added
const initials = (name) => name.replace(/^(Dr\.|Mahatma|Mata|Manyavar|Sree|Chhatrapati|Periyar|डॉ\.|महात्मा|माता|मान्यवर|श्री|छत्रपति|पेरियार|वीरांगना)\s+/, '')
  .split(/\s+/).filter(Boolean).slice(0, 1).map((w) => w[0]).join('').toUpperCase()

// Smaller copies of each photo are in public/inspirations/360 and /540, so a phone or a small card does not
// download the full-size picture. The browser picks the smallest one that is still sharp for the space.
const srcSetOf = (photo) => (photo.startsWith('/inspirations/')
  ? `${photo.replace('/inspirations/', '/inspirations/360/')} 360w, ${photo.replace('/inspirations/', '/inspirations/540/')} 540w, ${photo} 700w`
  : undefined)

// sizes: how wide the photo is shown, so the browser can pick the right copy (the default fits the cards)
export function InspirationPhoto({ person, name, className = '', sizes = '(min-width: 1024px) 300px, (min-width: 640px) 46vw, 88vw' }) {
  const [broken, setBroken] = useState(false)
  if (!person.photo || broken) {
    return (
      <div aria-hidden="true" className={`flex items-center justify-center bg-linear-to-br from-navy to-brand text-4xl font-extrabold text-gold/90 ${className}`}>
        {initials(name)}
      </div>
    )
  }
  return <img src={person.photo} srcSet={srcSetOf(person.photo)} sizes={sizes} alt={name} loading="lazy" onError={() => setBroken(true)} className={`bg-mist object-cover object-top ${className}`} />
}

// level: the heading level of the name (3 under a section heading; 2 when the cards come right after the page title)
export default function InspirationCard({ person, level = 3 }) {
  const Name = `h${level}`
  const Sub = `h${level + 1}`
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const name = pickText(person, 'name', lang)
  const contributions = pickList(person, 'contributions', lang).slice(0, 2)

  return (
    // The whole card opens the person's page: the "Read more" link is stretched over the card (after:absolute after:inset-0)
    <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand">
      <div className="relative">
        <InspirationPhoto person={person} name={name} className="aspect-[5/4] w-full" />
        <span className="absolute bottom-2 left-2 rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-semibold text-gold">
          {pickText(person, 'years', lang)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Name className="text-lg leading-snug font-extrabold">{name}</Name>
        <p className="mt-0.5 text-xs font-semibold text-brand">{pickText(person, 'title', lang)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-navy/80">{pickText(person, 'short', lang)}</p>
        {contributions.length > 0 && (
          <div className="mt-3 rounded-lg bg-mist/60 p-3">
            <Sub className="mb-1 text-xs font-bold text-navy">{t('inspire.keyContributions')}</Sub>
            <ul className="text-sm text-navy/80">
              {contributions.map((c) => (
                <li key={c} className="flex gap-2"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" /><span className="line-clamp-2">{c}</span></li>
              ))}
            </ul>
          </div>
        )}
        <Link to={`/inspirations/${person.slug}`} aria-label={`${t('inspire.readMore')}: ${name}`}
          className="mt-auto inline-flex min-h-10 items-center gap-1 pt-2 text-sm font-bold text-brand outline-none after:absolute after:inset-0 after:content-['']">
          {t('inspire.readMore')} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </article>
  )
}
