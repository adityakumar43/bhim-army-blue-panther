import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { large } from '../lib/img.js'

const Icon = ({ d }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const round = 'flex h-12 w-12 items-center justify-center bg-white/15 hover:bg-white/30'

// A full-screen photo viewer: next and previous, swipe, zoom, Escape to close
export default function Lightbox({ items, index, onIndex, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const n = items.length
  const it = items[index]
  const [zoomed, setZoomed] = useState(false)
  const dialog = useRef(null)
  const stage = useRef(null)
  const touchX = useRef(null)
  const key = useRef(null)

  const go = (i) => {
    setZoomed(false)
    onIndex(((i % n) + n) % n)
  }

  // Keyboard: arrows, Escape, and Tab kept inside the viewer
  key.current = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowRight' && n > 1) go(index + 1)
    else if (e.key === 'ArrowLeft' && n > 1) go(index - 1)
    else if (e.key === 'Tab') {
      const all = [...dialog.current.querySelectorAll('button')]
      const first = all[0]
      const last = all[all.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }
  useEffect(() => {
    const handler = (e) => key.current(e)
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Stop the page behind from scrolling, and move focus into the viewer
  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current.querySelector('button[data-close]').focus()
    return () => { document.body.style.overflow = overflow }
  }, [])

  // Zooming in starts from the middle of the picture
  useEffect(() => {
    const s = stage.current
    if (zoomed && s) {
      s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2
      s.scrollTop = (s.scrollHeight - s.clientHeight) / 2
    }
  }, [zoomed])

  // Load the neighbours early so the arrows feel instant
  useEffect(() => {
    if (n < 2 || typeof window.Image !== 'function') return
    for (const j of [index + 1, index - 1]) new window.Image().src = large(items[((j % n) + n) % n].image.url, 1600)
  }, [index, items, n])

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current === null || zoomed || n < 2) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
  }

  const caption = pickText(it, 'title', lang)
  const about = [pickText(it, 'community', lang), it.kind ? t(`gallery.${it.kind}`) : ''].filter(Boolean).join(' · ')

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={caption || about || t('gallery.viewLarger')}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm">{n > 1 ? t('gallery.counter', { current: index + 1, total: n }) : ''}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}
            aria-label={zoomed ? t('gallery.zoomOut') : t('gallery.zoomIn')} className={round}>
            <Icon d={zoomed ? 'M5 12h14' : 'M12 5v14M5 12h14'} />
          </button>
          <button type="button" data-close onClick={onClose} aria-label={t('gallery.close')} className={round}>
            <Icon d="M5 5l14 14M19 5L5 19" />
          </button>
        </div>
      </div>

      <div ref={stage} className="relative flex min-h-0 flex-1 overflow-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img src={large(it.image.url, zoomed ? 2400 : 1600)} alt={caption || about} draggable="false"
          onClick={() => setZoomed(!zoomed)}
          className={`m-auto ${zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain'}`}
          style={zoomed ? { width: '250%' } : undefined} />
      </div>

      {n > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label={t('gallery.prev')} className={`${round} absolute top-1/2 left-2 -translate-y-1/2 sm:left-4`}>
            <Icon d="M15 5l-7 7 7 7" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label={t('gallery.next')} className={`${round} absolute top-1/2 right-2 -translate-y-1/2 sm:right-4`}>
            <Icon d="M9 5l7 7-7 7" />
          </button>
        </>
      )}

      {(caption || about) && (
        <div className="p-4 text-center">
          {caption && <p className="text-lg font-semibold">{caption}</p>}
          {about && <p className="text-sm text-white/80">{about}</p>}
        </div>
      )}
    </div>
  )
}