import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ORG } from '../lib/orgInfo.js'

export default function Footer() {
  const { t } = useTranslation()
  let loggedIn = false
  try { loggedIn = !!localStorage.getItem('token') } catch { /* storage blocked */ }

  // Two short lists instead of one long one
  const explore = [['/', t('nav.home')], ['/about', t('nav.about')], ['/leadership/states', t('nav.states')], ['/inspirations', t('nav.inspire')],
  ['/campaigns', t('nav.campaigns')], ['/news', t('nav.news')], ['/gallery', t('nav.gallery')], ['/videos', t('videos.link')]]
  const involved = [['/join', t('nav.join')], ['/volunteer', t('vol.link')], ['/donate', t('cta.donate')], ['/help', t('help.link')], ['/downloads', t('dl.link')]]
  const path = ['educate', 'organize', 'struggle'].map((k) => t(`about.${k}.title`))
  const head = 'mb-3 text-sm font-extrabold tracking-wide text-gold uppercase'
  const link = 'inline-flex min-h-8 items-center text-sm text-white/75 hover:text-white'

  return (
    <footer className="print:hidden bg-[#06112c] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.5fr_0.9fr_1.4fr] lg:gap-10 lg:px-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-12 w-12 rounded-md object-contain" />
            <strong className="text-lg leading-tight">{t('org')}</strong>
          </div>
          <p className="mb-4 max-w-sm text-sm leading-relaxed text-white/75">{t('footerText', { defaultValue: t('mission') })}</p>
          <p className="text-sm font-semibold text-white/90">{path.join(' · ')}</p>
          <p className="mt-1 text-sm font-semibold text-gold">{t('greeting')}</p>
        </div>

        <nav aria-label={t('footer.explore')}>
          <h2 className={head}>{t('footer.explore')}</h2>
          <ul className="grid grid-cols-2 gap-x-6">
            {explore.map(([to, label]) => <li key={to}><Link to={to} className={link}>{label}</Link></li>)}
          </ul>
        </nav>

        <nav aria-label={t('footer.involved')}>
          <h2 className={head}>{t('footer.involved')}</h2>
          <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {involved.map(([to, label]) => <li key={to}><Link to={to} className={link}>{label}</Link></li>)}
          </ul>
        </nav>

        <div>
          <h2 className={head}>{t('nav.contact')}</h2>
          <address className="flex flex-col gap-3 text-sm text-white/75 not-italic">
            <div><div className="font-semibold text-white">{t('offices.head')}</div><div>{t('offices.headAddress')}</div></div>
            <div><div className="font-semibold text-white">{t('offices.delhi')}</div><div>{t('offices.delhiAddress')}</div></div>
            {ORG.phone && <a href={`tel:${ORG.phone.replace(/\s/g, '')}`} className="text-gold hover:underline">{ORG.phone}</a>}
            {ORG.email && <a href={`mailto:${ORG.email}`} className="break-all hover:text-white hover:underline">{ORG.email}</a>}
          </address>
        </div>
      </div>

      {/* One short line: © and the Privacy Policy. "Admin Panel" shows only on a device where someone from the team is logged in. */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/10 px-4 py-4 text-center text-xs text-white/60 sm:text-sm">
        <span className="whitespace-nowrap">© {new Date().getFullYear()} {t('org')}</span>
        <span className="opacity-40">·</span>
        <Link to="/privacy" className="whitespace-nowrap hover:text-white hover:underline">{t('privacy.title', { defaultValue: 'Privacy Policy' })}</Link>
        {loggedIn && (
          <>
            <span className="opacity-40">·</span>
            <Link to="/admin" className="whitespace-nowrap opacity-60 hover:opacity-100 hover:underline">Admin Panel</Link>
          </>
        )}
      </div>
    </footer>
  )
}
