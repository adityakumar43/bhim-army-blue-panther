import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ORG } from '../lib/orgInfo.js'
import { NotifyButton } from './Notify.jsx'
import Icon from './Icon.jsx'
import { isSamvidhanSeason } from '../data/samvidhanDates.js'

const head = 'mb-3 text-sm font-extrabold tracking-wide text-gold uppercase'
// A wrapped name (two lines) keeps its own spacing, so the names beside and below it stay in line
const link = 'inline-flex min-h-8 items-center py-1 text-sm leading-snug text-white/75 hover:text-white'

// One list of links with its heading. On phones the list is folded away until its heading is tapped
// (the footer was two screens long); on tablets and computers it is always open.
function LinkList({ title, links, columns }) {
  const [open, setOpen] = useState(false)
  return (
    <nav aria-label={title} className="max-sm:border-y max-sm:border-white/10 max-sm:[&+nav]:-mt-8 max-sm:[&+nav]:border-t-0">
      <h2 className={`${head} max-sm:hidden`}>{title}</h2>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between text-sm font-extrabold tracking-wide text-gold uppercase sm:hidden">
        {title}<Icon name="chevronDown" size={18} className={`motion-safe:transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul className={`${columns} ${open ? 'max-sm:pb-3' : 'max-sm:hidden'}`}>
        {links.map(([to, label]) => <li key={to}><Link to={to} className={link}>{label}</Link></li>)}
      </ul>
    </nav>
  )
}

export default function Footer() {
  const { t } = useTranslation()
  let loggedIn = false
  try { loggedIn = !!localStorage.getItem('token') } catch { /* storage blocked */ }

  // Opened as the installed app: there is no address bar to type /admin/login, so the team needs a link
  const installed = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

  // Two short lists instead of one long one
  const explore = [['/', t('nav.home')], ['/about', t('nav.about')], ['/leadership/states', t('nav.states')], ['/inspirations', t('nav.inspire')],
  ['/campaigns', t('nav.campaigns')], ['/news', t('nav.news')], ['/events', t('cal.link')], ['/polls', t('poll.link')], ['/gallery', t('nav.gallery')], ['/videos', t('videos.link')],
  // Samvidhan Divas: only from 1 November to 26 January (the page itself stays open all year)
  ...(isSamvidhanSeason() ? [['/samvidhan', t('samvidhan.link')]] : [])]
  const involved = [['/join', t('nav.join')], ['/volunteer', t('vol.link')], ['/leaderboard', t('board.link')], ['/donate', t('cta.donate')], ['/help', t('help.link')], ['/downloads', t('dl.link')]]
  const path = ['educate', 'organize', 'struggle'].map((k) => t(`about.${k}.title`))
  // Social media pages that have a link in lib/orgInfo.js
  const SOCIAL_NAMES = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', x: 'X (Twitter)', whatsapp: 'WhatsApp', linkedin: 'LinkedIn' }
  const social = Object.entries(ORG.social || {}).filter(([, url]) => /^https?:\/\//.test(url || ''))

  return (
    <footer className="print:hidden bg-[#06112c] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.7fr_0.9fr_1.3fr] lg:gap-10 lg:px-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img src="/logo-160.webp" alt="" className="h-12 w-12 rounded-md object-contain" />
            <strong className="text-lg leading-tight">{t('org')}</strong>
          </div>
          <p className="mb-4 max-w-sm text-sm leading-relaxed text-white/75">{t('footerText', { defaultValue: t('mission') })}</p>
          <p className="text-sm font-semibold text-white/90">{path.join(' · ')}</p>
          <p className="mt-1 text-sm font-semibold text-gold">{t('greeting')}</p>
          <NotifyButton />
        </div>

        <LinkList title={t('footer.explore')} links={explore} columns="grid grid-cols-2 gap-x-4" />
        <LinkList title={t('footer.involved')} links={involved} columns="grid grid-cols-2 gap-x-4 sm:grid-cols-1" />

        <div>
          <h2 className={head}>{t('nav.contact')}</h2>
          <address className="flex flex-col gap-3 text-sm text-white/75 not-italic">
            <div><div className="font-semibold text-white">{t('offices.head')}</div><div>{t('offices.headAddress')}</div></div>
            <div><div className="font-semibold text-white">{t('offices.delhi')}</div><div>{t('offices.delhiAddress')}</div></div>
            {ORG.phone && <a href={`tel:${ORG.phone.replace(/\s/g, '')}`} className="text-gold hover:underline">{ORG.phone}</a>}
            {ORG.email && <a href={`mailto:${ORG.email}`} className="break-all hover:text-white hover:underline">{ORG.email}</a>}
          </address>
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Social media">
              {social.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer me"
                    className="inline-flex min-h-9 items-center rounded-full border border-white/20 px-3 text-xs font-semibold text-white/85 hover:border-gold hover:text-gold">
                    {SOCIAL_NAMES[key] || key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* One short line: © and the Privacy Policy. "Admin Panel" shows only where someone from the team is logged in,
          and "Staff Login" only inside the installed app (in a browser, the team opens /admin/login). */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/10 px-4 py-4 text-center text-xs text-white/60 sm:text-sm">
        <span className="whitespace-nowrap">© {new Date().getFullYear()} {t('org')}</span>
        <span className="opacity-40">·</span>
        <Link to="/privacy" className="whitespace-nowrap hover:text-white hover:underline">{t('privacy.title', { defaultValue: 'Privacy Policy' })}</Link>
        {(loggedIn || installed) && (
          <>
            <span className="opacity-40">·</span>
            <Link to={loggedIn ? '/admin' : '/admin/login'} className="whitespace-nowrap opacity-80 hover:opacity-100 hover:underline">
              {loggedIn ? 'Admin Panel' : 'Staff Login'}
            </Link>
          </>
        )}
      </div>
    </footer>
  )
}
