import { useTranslation } from 'react-i18next'
import Leadership from '../components/Leadership.jsx'
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

      <h2 className="mb-6 text-3xl font-extrabold">{t('about.leadersTitle')}</h2>
      <Leadership />
    </div>
  )
}
