import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import useLoad from '../lib/useLoad.js'
import { STATES, stateName } from '../data/states.js'
import Icon from '../components/Icon.jsx'
import Loading from '../components/Loading.jsx'

// All states and union territories. The title band comes from PageBand.
// On top: the ones that already have a team, as cards with the number of leaders.
// Below: every other state and union territory, as a short list of names.
export default function StatesList() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  // How many leaders each state has. If that cannot be loaded, every state is simply listed by name.
  const { data: counts } = useLoad(() => api.get('/leaders/counts').catch(() => ({})), 'leader-counts')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const byName = (a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)
  const found = STATES.filter((s) => !q || s.en.toLowerCase().includes(q) || s.hi.includes(q))
  const n = (s) => counts?.[s.code] || 0
  // The biggest teams first, then A to Z
  const active = found.filter((s) => n(s) > 0).sort((a, b) => n(b) - n(a) || byName(a, b))
  const others = [['state', t('leaders.states')], ['ut', t('leaders.uts')]]
    .map(([type, label]) => [type, label, found.filter((s) => s.type === type && n(s) === 0).sort(byName)])
    .filter(([, , list]) => list.length > 0)

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16">
      <Link to="/about" className="mb-6 inline-flex items-center gap-1 font-semibold text-brand">← {t('nav.about')}</Link>
      <label className="mb-8 block max-w-md">
        <span className="sr-only">{t('leaders.search')}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('leaders.search')} className="input" />
      </label>

      {!counts && <Loading />}
      {counts && found.length === 0 && <p className="text-navy/70">{t('leaders.noMatch')}</p>}

      {counts && active.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-extrabold">{t('leaders.active', { defaultValue: 'Where we are active' })}</h2>
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {active.map((s) => (
              <li key={s.code}>
                <Link to={`/leadership/states/${s.code}`} className="flex h-full items-center gap-2 rounded-xl border border-brand/25 bg-white p-3 shadow-sm transition hover:border-brand hover:shadow-md sm:gap-3 sm:p-4">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand sm:flex" aria-hidden="true"><Icon name="users" size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-tight font-extrabold max-sm:text-[15px]">{stateName(s, lang)}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-brand sm:text-sm">{t('leaders.count', { count: n(s) })}</span>
                  </span>
                  <Icon name="arrow" size={18} className="shrink-0 text-brand max-sm:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {counts && others.length > 0 && (
        <section className="rounded-2xl border border-navy/10 bg-white/70 p-4 sm:p-6">
          {/* With no active state at all, this is simply the list of states, so it needs no "other" heading */}
          {active.length > 0 && <h2 className="text-xl font-extrabold">{t('leaders.others', { defaultValue: 'Other states and union territories' })}</h2>}
          <p className={`text-navy/70 ${active.length > 0 ? 'mt-1' : ''}`}>{t('leaders.othersHint', { defaultValue: 'Details of the teams here will be added soon.' })}</p>
          {others.map(([type, label, list]) => (
            <div key={type} className="mt-5">
              <h3 className="mb-2 text-sm font-extrabold tracking-wide text-navy/65 uppercase">{label}</h3>
              <ul className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <li key={s.code}>
                    <Link to={`/leadership/states/${s.code}`} className="inline-flex min-h-10 items-center rounded-full border border-navy/15 bg-white px-3.5 text-sm font-semibold text-navy/80 hover:border-brand hover:text-brand">
                      {stateName(s, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
