import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Leadership from '../components/Leadership.jsx'
import Icon from '../components/Icon.jsx'
import { campaigns } from '../data/compaigns.js'
import { pickText } from '../lib/text.js'

export default function About() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
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

      {/* What we do: the campaigns (data/compaigns.js) and the help desk. Nothing here is written twice:
          a campaign added to that file shows up here too. */}
      <h2 className="mb-2 text-3xl font-extrabold">{t('about.workTitle', { defaultValue: 'What we do' })}</h2>
      <p className="mb-5 text-lg text-navy/75">{t('home.campaignsIntro')}</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        {campaigns.map((c) => (
          <Link key={c.id} to="/campaigns" className="panel flex items-start gap-4 transition hover:border-brand/40 hover:shadow-md">
            {c.icon && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name={c.icon} size={22} /></span>}
            <span className="min-w-0">
              <span className="block text-lg leading-snug font-extrabold">{pickText(c, 'title', lang)}</span>
              <span className="mt-1 line-clamp-2 text-navy/75">{pickText(c, 'body', lang)}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link to="/help" className="mb-12 flex items-center gap-4 rounded-2xl bg-linear-to-br from-navy to-brand p-5 text-white shadow-md transition hover:brightness-110 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10" aria-hidden="true"><Icon name="shield" size={22} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-snug font-extrabold">{t('help.title')}</span>
          <span className="mt-1 block text-white/85">{t('help.intro')}</span>
        </span>
        <Icon name="arrow" size={20} className="shrink-0 text-gold" />
      </Link>

      {/* <h2 className="mb-3 text-3xl font-extrabold">{t('about.historyTitle')}</h2>
      <p className="mb-10 text-lg">{t('about.history')}</p> */}

      <h2 className="mb-6 text-3xl font-extrabold">{t('about.leadersTitle')}</h2>
      <Leadership />

      {/* The next step for a reader who agrees with all this */}
      <div className="mt-12 rounded-2xl border border-navy/10 bg-white p-6 text-center shadow-sm sm:p-8">
        <h2 className="text-2xl font-extrabold">{t('sections.band')}</h2>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/join" className="btn gap-2 rounded-xl bg-gold text-navy shadow-md hover:brightness-105"><Icon name="users" />{t('cta.member')}</Link>
          <Link to="/volunteer" className="btn gap-2 rounded-xl border-2 border-brand bg-white text-brand hover:bg-mist"><Icon name="hand" />{t('vol.title')}</Link>
        </div>
      </div>
    </div>
  )
}
