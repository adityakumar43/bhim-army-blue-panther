import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon.jsx'

// Phones and tablets: a yellow "Join" button fixed in the bottom corner, because the header's Join button only shows
// on wide screens. It stays out of the way: not on pages where joining is beside the point (the Join form itself, the
// help desk, a membership card ...), on the home page only after the main heading (it has its own Join button), and
// it moves away while the footer is on screen, so it never covers the footer's links.
const HIDDEN = ['/join', '/help', '/membership', '/volunteer', '/donate', '/card', '/receipt', '/certificate', '/unsubscribe']

export default function JoinButton() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const home = pathname === '/'
  const [pastHero, setPastHero] = useState(false)
  const [footerOnScreen, setFooterOnScreen] = useState(false)

  useEffect(() => {
    if (!home) return
    const check = () => setPastHero(window.scrollY > 600)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [home])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer || !('IntersectionObserver' in window)) return
    const watch = new IntersectionObserver(([entry]) => setFooterOnScreen(entry.isIntersecting))
    watch.observe(footer)
    return () => watch.disconnect()
  }, [pathname])

  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null
  const show = (!home || pastHero) && !footerOnScreen
  return (
    <Link to="/join" tabIndex={show ? 0 : -1} aria-hidden={!show}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-5 font-bold text-navy shadow-lg shadow-navy/30 transition duration-300 print:hidden xl:hidden ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
      <Icon name="users" size={20} />{t('nav.join')}
    </Link>
  )
}
