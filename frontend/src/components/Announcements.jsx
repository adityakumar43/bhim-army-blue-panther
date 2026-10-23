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
const small = 'flex h-9 w-9 items-center justify-center hover:bg-white/15'

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
  const linkClass = 'underline underline-offset-2 hover:text-gold'

  return (
    <section
      aria-label={t('announce.label')}
      aria-live={playing && !hold ? 'off' : 'polite'}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={(e) => e.target.matches(':focus-visible') && setHold(true)}
      onBlur={() => setHold(false)}
      className="bg-navy text-white"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2 lg:px-16">
        <span className="shrink-0 bg-gold px-2 py-0.5 text-sm font-extrabold text-navy">{t('announce.label')}</span>
        <p className="min-w-0 flex-1">
          {current.important && <strong className="mr-2 text-gold">{t('announce.important')}:</strong>}
          {href
            ? href.startsWith('/')
              ? <Link to={href} className={linkClass}>{text}</Link>
              : <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>{text}</a>
            : text}
        </p>
        {n > 1 && (
          <div className="flex shrink-0 items-center">
            <button type="button" onClick={() => go(index - 1)} aria-label={t('announce.prev')} className={small}><Icon d="M15 5l-7 7 7 7" /></button>
            <span className="px-1 text-sm">{t('announce.counter', { current: index + 1, total: n })}</span>
            <button type="button" onClick={() => go(index + 1)} aria-label={t('announce.next')} className={small}><Icon d="M9 5l7 7-7 7" /></button>
            {/* <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? t('announce.pause') : t('announce.play')} aria-pressed={!playing} className={small}>
              <Icon d={playing ? 'M9 5v14M15 5v14' : 'M7 4l12 8-12 8z'} />
            </button> */}
          </div>
        )}
        <button type="button" onClick={() => { remember(signature); setHidden(true) }} aria-label={t('announce.hide')} className={small}>
          <Icon d="M5 5l14 14M19 5L5 19" />
        </button>
      </div>
    </section>
  )
}