import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import Icon from './Icon.jsx'
import LeaderCard from './LeaderCard.jsx'
import Loading from './Loading.jsx'

// The Leadership part of the About page: national leaders, then the way into state leadership
export default function Leadership() {
  const { t } = useTranslation()
  const [national, setNational] = useState(null)

  useEffect(() => {
    api.get('/leaders?level=national').then(setNational).catch(() => setNational([]))
  }, [])

  return (
    <>
      <h3 className="mb-4 text-2xl font-extrabold">{t('leaders.national')}</h3>
      {national === null && <Loading />}
      {national?.length === 0 && <p className="mb-10 text-navy/70">{t('leaders.empty')}</p>}
      {national?.length > 0 && (
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
          {national.map((l) => <LeaderCard key={l._id} leader={l} />)}
        </div>
      )}

      <h3 className="mb-4 text-2xl font-extrabold">{t('leaders.state')}</h3>
      <Link to="/leadership/states" className="panel flex items-center gap-4 transition hover:border-brand hover:shadow-md">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist text-brand"><Icon name="pin" size={24} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold">{t('leaders.viewStates')}</span>
          <span className="block text-navy/70">{t('leaders.stateCardText')}</span>
        </span>
        <Icon name="arrow" className="shrink-0 text-brand" />
      </Link>
    </>
  )
}