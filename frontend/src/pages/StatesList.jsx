import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { STATES, stateName } from '../data/states.js'
import Icon from '../components/Icon.jsx'

// All states and union territories. The title band comes from PageBand.
export default function StatesList() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [counts, setCounts] = useState({})
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/leaders/counts').then(setCounts).catch(() => setCounts({}))
  }, [])

  const q = query.trim().toLowerCase()
  const listOf = (type) => STATES
    .filter((s) => s.type === type && (!q || s.en.toLowerCase().includes(q) || s.hi.includes(q)))
    // States that already have a team come first, then the rest; A to Z within each
    .sort((a, b) => (counts[b.code] ? 1 : 0) - (counts[a.code] ? 1 : 0) || stateName(a, lang).localeCompare(stateName(b, lang), lang))
  const groups = [['state', t('leaders.states')], ['ut', t('leaders.uts')]].map(([type, label]) => [type, label, listOf(type)])

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16">
      <Link to="/about" className="mb-6 inline-flex items-center gap-1 font-semibold text-brand">← {t('nav.about')}</Link>
      <label className="mb-8 block max-w-md">
        <span className="sr-only">{t('leaders.search')}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('leaders.search')} className="input" />
      </label>

      {groups.every(([, , list]) => list.length === 0) && <p className="text-navy/70">{t('leaders.noMatch')}</p>}

      {groups.map(([type, label, list]) => list.length > 0 && (
        <section key={type} className="mb-10">
          <h2 className="mb-4 text-2xl font-extrabold">{label}</h2>
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {list.map((s) => {
              const n = counts[s.code] || 0
              return (
                <li key={s.code}>
                  {/* With a team: a white card with the number of leaders. Without one yet: a lighter card. */}
                  <Link to={`/leadership/states/${s.code}`} className={`flex h-full items-center gap-2 rounded-xl border p-3 transition hover:border-brand hover:shadow-md sm:gap-3 sm:p-4 ${n ? 'border-brand/25 bg-white shadow-sm' : 'border-navy/10 bg-white/60'}`}>
                    <span className="min-w-0 flex-1">
                      <span className={`block leading-tight font-extrabold max-sm:text-[15px] ${n ? '' : 'text-navy/70'}`}>{stateName(s, lang)}</span>
                      <span className={`mt-0.5 block text-xs sm:text-sm ${n ? 'font-semibold text-brand' : 'text-navy/50'}`}>
                        {n ? `👥 ${t('leaders.count', { count: n })}` : t('leaders.none')}
                      </span>
                    </span>
                    <Icon name="arrow" size={18} className={`shrink-0 max-sm:hidden ${n ? 'text-brand' : 'text-navy/30'}`} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}