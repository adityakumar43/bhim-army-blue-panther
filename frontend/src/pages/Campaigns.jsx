import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon.jsx'
import { campaigns } from '../data/compaigns.js'
import { pickText } from '../lib/text.js'

export default function Campaigns() {
  const { t, i18n } = useTranslation()
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-16">
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <article key={c.id} className="panel flex flex-col border-t-4 border-t-brand">
            {c.icon && <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name={c.icon} size={26} /></span>}
            <h2 className="mb-2 text-2xl font-extrabold">{pickText(c, 'title', i18n.language)}</h2>
            <p className="flex-1 text-lg">{pickText(c, 'body', i18n.language)}</p>
            {/* What a reader can do next: give time to this work */}
            <Link to="/volunteer" className="mt-5 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg border-2 border-brand px-4 font-bold text-brand hover:bg-brand hover:text-white">
              <Icon name="hand" size={18} />{t('vol.title')} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
