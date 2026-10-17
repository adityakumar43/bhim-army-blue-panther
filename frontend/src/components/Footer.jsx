import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ORG } from '../lib/orgInfo.js'

export default function Footer() {
  const { t } = useTranslation()
  const links = [['/about', t('nav.about')], ['/campaigns', t('nav.campaigns')], ['/news', t('nav.news')],
    ['/gallery', t('nav.gallery')], ['/contact', t('nav.contact')], ['/donate', t('cta.donate')]]

  return (
    <footer className="print:hidden mt-16 bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:px-16">
        <div>
          <strong className="text-lg">{t('org')}</strong>
          <p className="mt-2 max-w-sm text-white/80">{t('footerText')}</p>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">{t('footer.links')}</h2>
          <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {links.map(([to, label]) => (
              <li key={to}><Link to={to} className="inline-flex min-h-10 items-center text-white/85 hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-base font-semibold">{t('nav.contact')}</h2>
          <address className="flex flex-col gap-1 text-white/85 not-italic">
            <span>{t('address')}</span>
            <span>{ORG.phone}</span>
            <span>{ORG.email}</span>
          </address>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} {t('org')} 💙
      </div>
    </footer>
  )
}
