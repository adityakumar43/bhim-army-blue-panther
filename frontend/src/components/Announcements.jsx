import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'

// Only on-site paths and web addresses are used as links
const safeLink = (l) => (l && /^(\/(?!\/)|https?:\/\/)/.test(l) ? l : null)

// Private browsing can block this storage, so a problem here must never break the page
const remembered = () => { try { return sessionStorage.getItem('hiddenUpdates') } catch { return null } }
const remember = (value) => { try { sessionStorage.setItem('hiddenUpdates', value) } catch { /* ignore */ } }

const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const small = 'flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 text-white/80 transition hover:bg-white/15 hover:text-white'

// Each new update slides in gently (skipped for people who asked their device for less motion)
const FADE = '@keyframes updateIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'

// The "Latest updates" bar at the top of the Home page. interval = milliseconds each update stays.
export default function Announcements({ interval = 6000 }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)
  // People who asked their device for less motion get a bar that does not change by itself
  const [playing, setPlaying] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [hold, setHold] = useState(false) // hovering or using the keyboard inside
  const [hidden, setHidden] = useState(false)
  const n = items.length
  const signature = items.map((a) => a._id).join(',')

  useEffect(() => {
    api.get('/announcements/current').then(setItems).catch(() => setItems([]))
  }, [])

  // A visitor who hides the bar stays free of it for this visit, until a NEW update appears
  useEffect(() => { setHidden(!!signature && remembered() === signature) }, [signature])
  useEffect(() => { if (index >= n) setIndex(0) }, [n, index])

  useEffect(() => {
    if (n < 2 || !playing || hold) return
    const id = setInterval(() => setIndex((i) => (i + 1) % n), interval)
    return () => clearInterval(id)
  }, [n, playing, hold, index, interval])

  if (n === 0 || hidden) return null

  const go = (i) => setIndex(((i % n) + n) % n)
  const current = items[index]
  const text = pickText(current, 'text', lang)
  const href = safeLink(current.link)
  const linkClass = 'group hover:text-gold'
  const more = <span aria-hidden="true" className="ml-1.5 inline-block text-gold transition group-hover:translate-x-0.5">→</span>

  return (
    <section
      aria-label={t('announce.label')}
      aria-live={playing && !hold ? 'off' : 'polite'}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={(e) => e.target.matches(':focus-visible') && setHold(true)}
      onBlur={() => setHold(false)}
      className="relative border-b border-white/10 bg-[linear-gradient(90deg,#0a1a3f_0%,#0b3c9d_50%,#0a1a3f_100%)] text-white"
    >
      <style>{FADE}</style>
      {/* One slim row. On phones the label shrinks to a red dot and long updates show two lines. */}
      <div className="mx-auto flex max-w-7xl items-center gap-x-2.5 px-4 py-1.5 sm:gap-x-4 sm:px-5 sm:py-2.5 lg:px-16">
        <span className="relative flex h-2 w-2 shrink-0 sm:hidden" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
        </span>
        <span className="hidden shrink-0 items-center gap-2 rounded-full bg-gold py-1 pr-3 pl-2 text-sm font-extrabold text-navy shadow-sm sm:inline-flex">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          {t('announce.label')}
        </span>
        <p key={current._id} className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug font-semibold motion-safe:[animation:updateIn_.45s_ease-out] sm:line-clamp-none sm:border-l sm:border-white/20 sm:pl-4 sm:text-[15px]">
          {current.important && <span className="mr-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-extrabold tracking-wide uppercase">{t('announce.important')}</span>}
          {href
            ? href.startsWith('/')
              ? <Link to={href} className={linkClass}><span>{text}</span>{more}</Link>
              : <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}><span>{text}</span>{more}</a>
            : text}
        </p>
        <div className="flex shrink-0 items-center sm:gap-0.5">
          {n > 1 && (
            <>
              <button type="button" onClick={() => go(index - 1)} aria-label={t('announce.prev')} className={small}><Icon d="M15 5l-7 7 7 7" /></button>
              <span className="hidden min-w-10 text-center text-xs font-semibold text-white/70 tabular-nums sm:inline">{t('announce.counter', { current: index + 1, total: n })}</span>
              <button type="button" onClick={() => go(index + 1)} aria-label={t('announce.next')} className={small}><Icon d="M9 5l7 7-7 7" /></button>
              <span className="mx-1 hidden h-5 w-px bg-white/20 sm:inline" aria-hidden="true" />
            </>
          )}
          <button type="button" onClick={() => { remember(signature); setHidden(true) }} aria-label={t('announce.hide')} className={small}>
            <Icon d="M6 6l12 12M18 6L6 18" />
          </button>
        </div>
      </div>
    </section>
  )
}