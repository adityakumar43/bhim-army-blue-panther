import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const links = [
  ['/', 'home'], ['/about', 'about'], ['/campaigns', 'campaigns'],
  ['/news', 'news'], ['/gallery', 'gallery'], ['/contact', 'contact'],
]

function LangSwitch({ lang, onChange }) {
  return (
    <div role="group" aria-label="Language" className="flex border border-navy">
      {[['hi', 'हिं'], ['en', 'EN']].map(([code, label]) => (
        <button key={code} onClick={() => onChange(code)} aria-pressed={lang === code}
          className={`min-h-11 min-w-12 px-3 text-sm font-semibold ${lang === code ? 'bg-navy text-white' : 'bg-white'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const lang = i18n.language

  // Close the phone menu after choosing a page
  useEffect(() => setOpen(false), [pathname])

  const linkClass = ({ isActive }) =>
    `border-b-2 py-1 font-semibold ${isActive ? 'border-brand text-brand' : 'border-transparent hover:text-brand'}`

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-brand/20 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2 xl:px-16">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-12 sm:h-18 sm:w-20 shrink-0 rounded-full bg-brand object-cover" />
          <strong className="truncate text-base sm:text-lg">{t('org')}</strong>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 xl:flex">
          {links.map(([to, key]) => (
            <NavLink key={key} to={to} end={to === '/'} className={linkClass}>{t(`nav.${key}`)}</NavLink>
          ))}
          <LangSwitch lang={lang} onChange={i18n.changeLanguage} />
          <Link to="/join" className="btn bg-brand text-white">{t('nav.join')}</Link>
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          <LangSwitch lang={lang} onChange={i18n.changeLanguage} />
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center bg-brand text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-brand/20 bg-white px-5 pb-5 xl:hidden">
          <ul className="flex flex-col">
            {links.map(([to, key]) => (
              <li key={key} className="border-b border-brand/10">
                <NavLink to={to} end={to === '/'}
                  className={({ isActive }) => `flex min-h-12 items-center font-semibold ${isActive ? 'text-brand' : ''}`}>
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/join" className="btn bg-brand text-white">{t('nav.join')}</Link>
            <Link to="/donate" className="btn bg-gold text-navy">{t('cta.donate')}</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
