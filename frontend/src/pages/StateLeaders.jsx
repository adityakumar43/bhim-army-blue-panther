import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { stateByCode, stateName } from '../data/states.js'
import { pickText } from '../lib/text.js'
import { Band } from '../components/PageBand.jsx'
import { useSeo } from '../components/Seo.jsx'
import LeaderCard from '../components/LeaderCard.jsx'
import Loading from '../components/Loading.jsx'
import Icon from '../components/BoxIcon.jsx' // two-tone icons for the coloured boxes

// A district's id for the page (used for the "jump to" links)
const slug = (s) => 'district-' + s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, '-').replace(/^-|-$/g, '')

// One state's leadership, at /leadership/states/<code>: the state team, then each district's team
export default function StateLeaders() {
  const { code } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const state = stateByCode(code)
  const [leaders, setLeaders] = useState(null)

  useEffect(() => {
    if (!state) return
    setLeaders(null)
    api.get(`/leaders?state=${code}`).then(setLeaders).catch(() => setLeaders([]))
  }, [code])

  useSeo({ title: state && `${t('leaders.state')} – ${stateName(state, i18n.language)}` })

  // District leaders grouped by district. Two people are in the same district when their Hindi name
  // or their English name matches (capitals and extra spaces ignored), so "देवरिया" alone joins "देवरिया / Deoria".
  const { stateTeam, districts } = useMemo(() => {
    const list = leaders || []
    const norm = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
    const groups = []
    const byName = new Map()
    for (const l of list.filter((x) => x.level === 'district')) {
      const names = [norm(l.areaHi), norm(l.areaEn)].filter(Boolean)
      let g = names.map((n) => byName.get(n)).find(Boolean)
      if (!g) { g = { key: names[0] || '-', name: '', people: [] }; groups.push(g) }
      names.forEach((n) => byName.set(n, g))
      g.people.push(l)
      // Show the district's name in the page's language when anyone in the group has it
      const own = (lang === 'hi' ? l.areaHi : l.areaEn)?.trim()
      if (own && !g.inLang) { g.name = own; g.inLang = true } else if (!g.name) g.name = pickText(l, 'area', lang)
    }
    const districts = groups.sort((a, b) => a.name.localeCompare(b.name, lang))
    return { stateTeam: list.filter((x) => x.level !== 'district'), districts }
  }, [leaders, lang])

  const back = <Link to="/leadership/states" className="mb-6 inline-flex items-center gap-1 font-semibold text-brand">← {t('leaders.back')}</Link>

  if (!state) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-16">
        {back}
        <p role="alert" className="text-lg">{t('leaders.notFound')}</p>
      </div>
    )
  }

  return (
    <>
      <Band kicker={t('leaders.state')} title={stateName(state, i18n.language)} />
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16">
        {back}
        {leaders === null && <Loading />}
        {leaders?.length === 0 && <p className="panel text-navy/70">{t('leaders.stateEmpty')}</p>}

        {stateTeam.length > 0 && (
          <section>
            {districts.length > 0 && <h2 className="mb-4 text-2xl font-extrabold">🏛️ {t('leaders.stateTeam', { defaultValue: 'State team' })}</h2>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {stateTeam.map((l) => <LeaderCard key={l._id} leader={l} />)}
            </div>
          </section>
        )}

        {districts.length > 0 && (
          <section className={stateTeam.length ? 'mt-12 border-t border-navy/10 pt-10' : ''}>
            <h2 className="text-2xl font-extrabold">🏘️ {t('leaders.districtTeams', { defaultValue: 'District teams' })}</h2>
            <p className="mt-1 text-navy/65">{t('leaders.districtIntro', { count: districts.length, defaultValue: 'Our teams in {{count}} districts. Tap a district to go to its team.' })}</p>

            {/* Jump to a district */}
            <nav aria-label={t('leaders.districtTeams', { defaultValue: 'District teams' })} className="mt-4 mb-8 flex flex-wrap gap-2">
              {districts.map((d) => (
                <a key={d.key} href={`#${slug(d.key)}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-brand/20 bg-white px-4 text-sm font-semibold text-brand shadow-sm hover:bg-mist">
                  📍 {d.name} <span className="text-navy/45">({d.people.length})</span>
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-8">
              {districts.map((d) => (
                <section key={d.key} id={slug(d.key)} className="scroll-mt-28 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="pin" size={18} /></span>
                    {d.name}
                    <span className="text-base font-semibold text-navy/50">· {t('leaders.district', { defaultValue: 'District' })}</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {d.people.map((l) => <LeaderCard key={l._id} leader={l} hideArea />)}
                  </div>
                </section>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
