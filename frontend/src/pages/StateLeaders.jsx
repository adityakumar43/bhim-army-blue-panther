import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { stateByCode, stateName } from '../data/states.js'
import { Band } from '../components/PageBand.jsx'
import { useSeo } from '../components/Seo.jsx'
import LeaderCard from '../components/LeaderCard.jsx'

// One state's leadership, at /leadership/states/<code>
export default function StateLeaders() {
  const { code } = useParams()
  const { t, i18n } = useTranslation()
  const state = stateByCode(code)
  const [leaders, setLeaders] = useState(null)

  useEffect(() => {
    if (!state) return
    setLeaders(null)
    api.get(`/leaders?state=${code}`).then(setLeaders).catch(() => setLeaders([]))
  }, [code])

  useSeo({ title: state && `${t('leaders.state')} – ${stateName(state, i18n.language)}` })

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
        {leaders === null && <p>{t('loading')}</p>}
        {leaders?.length === 0 && <p className="panel text-navy/70">{t('leaders.stateEmpty')}</p>}
        {leaders?.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {leaders.map((l) => <LeaderCard key={l._id} leader={l} />)}
          </div>
        )}
      </div>
    </>
  )
}