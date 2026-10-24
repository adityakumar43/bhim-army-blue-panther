import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon.jsx'
import Announcements from './Announcements.jsx'

const links = [
  ['/', 'home'], ['/about', 'about'], ['/leadership/states', 'states'], ['/campaigns', 'campaigns'],
  ['/news', 'news'], ['/gallery', 'gallery'], ['/contact', 'contact'],
]

function LangSwitch({ lang, onChange }) {
  return (
    <div role="group" aria-label="Language" className="flex overflow-hidden rounded-lg border border-white/30">
      {[['hi', 'हिं'], ['en', 'EN']].map(([code, label]) => (
        <button key={code} onClick={() => onChange(code)} aria-pressed={lang === code}
          className={`min-h-10 min-w-11 px-3 text-sm font-semibold ${lang === code ? 'bg-white text-navy' : 'text-white hover:bg-white/10'}`}>
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

  const pill = ({ isActive }) =>
    `rounded-lg px-3 py-2 font-semibold ${isActive ? 'bg-white/10 text-white ring-1 ring-white/25' : 'text-white/80 hover:bg-white/5 hover:text-white'}`

  return (
    <header className="print:hidden sticky top-0 z-50 border-b border-white/10 bg-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2.5 xl:px-16">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-11 w-11 shrink-0  object-contain sm:h-12 sm:w-12" />
          <strong className="truncate text-base leading-tight sm:text-lg">{t('org')}</strong>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {links.map(([to, key]) => (
            <NavLink key={key} to={to} end={to === '/'} className={pill}>{t(`nav.${key}`)}</NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <LangSwitch lang={lang} onChange={i18n.changeLanguage} />
          <Link to="/join" className="btn rounded-xl bg-gold text-navy shadow-md hover:brightness-105">{t('nav.join')}</Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <LangSwitch lang={lang} onChange={i18n.changeLanguage} />
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white">
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>


      {/* The "Latest updates" bar lives inside the sticky header on the Home page, so it stays in view while scrolling.
          It is only hidden (not removed) while the phone menu is open, so it keeps its place. */}
      {pathname === '/' && (
        <div className={open ? 'hidden' : undefined}>
          <Announcements />
        </div>
      )}

      {open && (
        <nav aria-label="Mobile" className="border-t border-white/10 bg-navy px-5 pb-5 xl:hidden">
          <ul className="flex flex-col py-2">
            {links.map(([to, key]) => (
              <li key={key}>
                <NavLink to={to} end={to === '/'}
                  className={({ isActive }) => `flex min-h-12 items-center rounded-lg px-3 font-semibold ${isActive ? 'bg-white/10 text-white' : 'text-white/85'}`}>
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Link to="/join" className="btn rounded-xl bg-gold text-navy">{t('nav.join')}</Link>
            <Link to="/donate" className="btn rounded-xl border border-white/30 text-white">{t('cta.donate')}</Link>
          </div>
        </nav>
      )}
    </header>
  )
}