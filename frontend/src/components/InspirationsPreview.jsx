import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inspirations } from '../data/inspirations.js'
import InspirationCard from './InspirationCard.jsx'

// Home page section: the first three inspirational leaders and a link to all of them
// grey: the light grey background, so this section stands apart from a white section above it
export default function InspirationsPreview({ grey = false }) {
  const { t } = useTranslation()
  return (
    <section className={grey ? 'bg-[#f3f6fb]' : 'bg-white'}>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 lg:px-16">
        {/* Same heading and "View all" link as the other Home sections (SectionHead in Home.jsx) */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div>
            {/* <p className="mb-2 text-sm font-semibold text-brand">{t('org')}</p> */}
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t('inspire.title')}</h2>
            <p className="mt-2 max-w-2xl text-navy/70">{t('inspire.intro')}</p>
          </div>
          <Link to="/inspirations" className="inline-flex min-h-10 items-center gap-1 rounded-lg border-2 border-brand px-4 text-sm font-bold text-brand hover:bg-brand hover:text-white">
            {t('inspire.viewAll')} <span aria-hidden="true">→</span>
          </Link>
        </div>
        {/* Phones: one row to swipe sideways (the next card peeks in at the edge). Larger screens: a grid. */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {inspirations.slice(0, 4).map((p) => (
            <div key={p.slug} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <InspirationCard person={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
