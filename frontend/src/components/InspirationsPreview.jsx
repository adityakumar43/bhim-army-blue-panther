import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inspirations } from '../data/inspirations.js'
import InspirationCard from './InspirationCard.jsx'

// Home page section: the first three inspirational leaders and a link to all of them
export default function InspirationsPreview() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* <p className="mb-2 text-sm font-semibold text-brand">{t('org')}</p> */}
          <h2 className="text-[clamp(1.6rem,3.5vw,2.25rem)] font-extrabold">{t('inspire.title')}</h2>
          <p className="mt-2 max-w-2xl text-navy/75">{t('inspire.intro')}</p>
        </div>
        <Link to="/inspirations" className="btn gap-1 rounded-lg border-2 border-brand px-5 font-bold text-brand hover:bg-brand hover:text-white">
          {t('inspire.viewAll')} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {inspirations.slice(0, 4).map((p) => <InspirationCard key={p.slug} person={p} />)}
      </div>
    </section>
  )
}
