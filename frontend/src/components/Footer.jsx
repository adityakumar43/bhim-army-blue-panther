import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ORG } from '../lib/orgInfo.js'

export default function Footer() {
  const { t } = useTranslation()
  let loggedIn = false
  try { loggedIn = !!localStorage.getItem('token') } catch { /* storage blocked */ }
  const links = [['/', t('nav.home')], ['/about', t('nav.about')], ['/leadership/states', t('nav.states')], ['/inspirations', t('nav.inspire')], ['/campaigns', t('nav.campaigns')], ['/news', t('nav.news')],
  ['/gallery', t('nav.gallery')], ['/join', t('nav.join')], ['/help', t('help.link')], ['/donate', t('cta.donate')]]
  const path = ['educate', 'organize', 'struggle'].map((k) => t(`about.${k}.title`))
  const head = 'mb-3 border-b border-white/10 pb-2 text-sm font-extrabold tracking-wide uppercase sm:mb-4 sm:pb-3'

  return (
    <footer className="print:hidden bg-[#06112c] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:px-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-11 w-11  object-contain rounded-md" />
            <strong className="text-lg">{t('org')}</strong>
          </div>
          <p className="mb-3 text-sm text-white/75">{t('footerText', { defaultValue: t('mission') })}</p>
          <p className="text-sm font-semibold text-gold">{t('greeting')}</p>
        </div>
        <div>
          <h2 className={head}>{t('footer.links')}</h2>
          <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-1 sm:gap-1">
            {links.map(([to, label]) => (
              <li key={to}><Link to={to} className="inline-flex min-h-9 items-center text-sm text-white/75 hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={head}>{t('about.principlesTitle')}</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col">
            {path.map((p) => <li key={p}><Link to="/about" className="text-sm text-white/75 hover:text-white">• {p}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className={head}>{t('nav.contact')}</h2>
          <address className="flex flex-col gap-3 text-sm text-white/75 not-italic">
            <div><div className="font-semibold text-white">{t('offices.head')}</div><div>{t('offices.headAddress')}</div></div>
            <div><div className="font-semibold text-white">{t('offices.delhi')}</div><div>{t('offices.delhiAddress')}</div></div>
            <span className="text-gold">{ORG.phone}</span>
            <span className="break-all">{ORG.email}</span>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-sm text-white/60">© {new Date().getFullYear()} {t('org')}
        <span className="mx-2 opacity-40">·</span>
        <Link to={loggedIn ? '/admin' : '/admin/login'} className="opacity-60 hover:opacity-100 hover:underline">
          {loggedIn ? 'Admin panel' : 'Staff login'}
        </Link></div>
    </footer>
  )
}