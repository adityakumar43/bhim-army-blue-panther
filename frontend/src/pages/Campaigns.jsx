import { useTranslation } from 'react-i18next'
import { campaigns } from '../data/compaigns.js'
import { pickText } from '../lib/text.js'

export default function Campaigns() {
  const { t, i18n } = useTranslation()
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-16">
      <h1 className="mb-8 text-4xl font-extrabold">{t('sections.campaigns')}</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <article key={c.id} className="border border-brand/20 p-6">
            <h2 className="mb-2 text-2xl font-extrabold">{pickText(c, 'title', i18n.language)}</h2>
            <p className="text-lg">{pickText(c, 'body', i18n.language)}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
