import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inspirations, inspirationBySlug } from '../data/inspirations.js'
import { pickText } from '../lib/text.js'
import { Band } from '../components/PageBand.jsx'
import { useSeo } from '../components/Seo.jsx'
import InspirationCard, { InspirationPhoto, pickList } from '../components/InspirationCard.jsx'

// One inspirational leader's full page, at /inspirations/<slug>
export default function Inspiration() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const person = inspirationBySlug(slug)

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  useSeo({
    title: person && pickText(person, 'name', lang),
    description: person && pickText(person, 'short', lang),
    image: person?.photo,
  })

  const back = <Link to="/inspirations" className="mb-6 inline-flex min-h-11 items-center gap-1 font-semibold text-brand">← {t('inspire.back')}</Link>

  if (!person) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-16">
        {back}
        <p role="alert" className="text-lg">{t('inspire.notFound')}</p>
      </div>
    )
  }

  const name = pickText(person, 'name', lang)
  const note = pickText(person, 'note', lang)
  const i = inspirations.indexOf(person)
  const more = [1, 2, 3, 4].map((n) => inspirations[(i + n) % inspirations.length])

  return (
    <>
      <Band kicker={t('inspire.title')} title={name} intro={`${pickText(person, 'years', lang)} · ${pickText(person, 'title', lang)}`} />
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16">
        {back}
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:items-start">
          <InspirationPhoto person={person} name={name} className="aspect-3/4 w-full max-w-xs rounded-2xl shadow-md lg:sticky lg:top-28 lg:max-w-none" />
          <div className="space-y-6">
            <section className="panel">
              <h2 className="mb-3 text-2xl font-extrabold">{t('inspire.biography')}</h2>
              <div className="space-y-4 text-lg leading-relaxed text-navy/85">
                {pickList(person, 'bio', lang).map((para) => <p key={para}>{para}</p>)}
              </div>
            </section>
            <section className="panel">
              <h2 className="mb-4 text-2xl font-extrabold">{t('inspire.contributions')}</h2>
              <ul className="space-y-3">
                {pickList(person, 'contributions', lang).map((c) => (
                  <li key={c} className="flex gap-3 text-navy/85">
                    <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
            {note && (
              <aside className="rounded-2xl border-l-4 border-gold bg-gold/10 p-5">
                <h2 className="mb-1 font-bold">{t('inspire.noteTitle')}</h2>
                <p className="text-navy/80">{note}</p>
              </aside>
            )}
          </div>
        </div>

        <h2 className="mt-14 mb-6 text-2xl font-extrabold">{t('inspire.more')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {more.map((p) => <InspirationCard key={p.slug} person={p} />)}
        </div>
      </div>
    </>
  )
}
