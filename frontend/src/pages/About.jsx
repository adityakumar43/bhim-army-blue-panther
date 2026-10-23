import { useTranslation } from 'react-i18next'
import { leaders } from '../data/leaders.js'
import { pickText } from '../lib/text.js'

export default function About() {
  const { t, i18n } = useTranslation()
  const principles = ['educate', 'organize', 'struggle']
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-16">

      <p className="mb-10 text-lg">{t('about.intro')}</p>

      <h2 className="mb-5 text-3xl font-extrabold">{t('about.principlesTitle')}</h2>
      <div className="mb-12 grid gap-5 md:grid-cols-3">
        {principles.map((k) => (
          <div key={k} className="panel">
            <h3 className="mb-2 text-xl font-extrabold text-brand">{t(`about.${k}.title`)}</h3>
            <p>{t(`about.${k}.text`)}</p>
          </div>
        ))}
      </div>

      {/* <h2 className="mb-3 text-3xl font-extrabold">{t('about.historyTitle')}</h2>
      <p className="mb-10 text-lg">{t('about.history')}</p> */}

      <h2 className="mb-8 text-3xl font-extrabold">{t('about.leadersTitle')}</h2>
      <div className="grid grid-cols-2 gap-9 sm:grid-cols-3 lg:grid-cols-4">
        {leaders.map((l) => (
          <figure key={l.id} className="text-center">
            <img src={l.photo} alt={pickText(l, 'name', i18n.language)} loading="lazy"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
              className="aspect-3/4 w-full bg-mist object-cover object-top" />
            <figcaption className="mt-3">
              <div className="font-extrabold">{pickText(l, 'name', i18n.language)}</div>
              <div className="text-navy/70">{pickText(l, 'role', i18n.language)}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
