import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { cdn } from '../lib/img.js'
import Lightbox from './Lightbox.jsx'


const safeLink = (l) => (l && /^(\/(?!\/)|https?:\/\/)/.test(l) ? l : null)

function SlideLink({ link, tabIndex, onZoom, children }) {
  const href = safeLink(link)
  const cls = 'block h-full w-full'
  if (!href) return <div className={`${cls} cursor-zoom-in`} onClick={onZoom}>{children}</div>
  if (href.startsWith('/')) return <Link to={href} tabIndex={tabIndex} className={cls}>{children}</Link>
  return <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className={cls}>{children}</a>
}

const Icon = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)


export default function Slider({ slides, interval = 5000 }) {
  const { t, i18n } = useTranslation()
  const n = slides.length
  const [index, setIndex] = useState(0)

  const [playing, setPlaying] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [hold, setHold] = useState(false)
  const touchX = useRef(null)

  const [viewing, setViewing] = useState(null) // number of the slide shown large, or null
  const zoomButton = useRef(null)
  const wasViewing = useRef(false)

  // When the viewer closes, keyboard focus goes back to the zoom button
  useEffect(() => {
    if (viewing !== null) wasViewing.current = true
    else if (wasViewing.current) {
      wasViewing.current = false
      zoomButton.current?.focus()
    }
  }, [viewing])


  const go = (i) => setIndex(((i % n) + n) % n)

  useEffect(() => { if (index >= n) setIndex(0) }, [n, index])


  useEffect(() => {
    if (n < 2 || !playing || hold || viewing !== null) return
    const id = setInterval(() => { if (!document.hidden) setIndex((i) => (i + 1) % n) }, interval)
    return () => clearInterval(id)
  }, [n, playing, hold, viewing, index, interval])

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX
    setHold(true)
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX)
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
    touchX.current = null
    setHold(false)
  }
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') go(index - 1)
    if (e.key === 'ArrowRight') go(index + 1)
  }

  const arrow = 'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-navy/60 text-white hover:bg-navy'

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label={t('slider.label')}
        aria-live={playing && !hold ? 'off' : 'polite'}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={(e) => e.target.matches(':focus-visible') && setHold(true)}
        onBlur={() => setHold(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        className="relative aspect-4/3 w-full overflow-hidden bg-navy sm:aspect-video lg:aspect-21/9 lg:max-h-136"
      >
        <div className="absolute inset-0 flex motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => {
            const caption = pickText(s, 'title', i18n.language)
            const url = s.image.url
            return (
              <div key={s._id} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${n}`}
                aria-hidden={i !== index} className="relative h-full w-full shrink-0">
                <SlideLink link={s.link} tabIndex={i === index ? 0 : -1} onZoom={() => setViewing(i)}>
                  <img
                    src={cdn(url, 1200)}
                    srcSet={`${cdn(url, 640)} 640w, ${cdn(url, 1200)} 1200w, ${cdn(url, 1920)} 1920w`}
                    sizes="100vw" alt={caption} loading={i === 0 ? 'eager' : 'lazy'} draggable="false"
                    className="relative h-full w-full object-contain" />
                  {caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/85 to-transparent px-5 pt-16 pb-14 text-white sm:px-10 lg:px-16">
                      <p className="max-w-3xl text-xl font-extrabold sm:text-2xl lg:text-3xl">{caption}</p>
                    </div>
                  )}
                </SlideLink>
              </div>
            )
          })}
        </div>

        <button type="button" ref={zoomButton} onClick={() => setViewing(index)} aria-label={t('gallery.viewLarger')}
          className="absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center bg-navy/60 text-white hover:bg-navy sm:top-4 sm:right-4">
          <Icon d="M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
        </button>


        {n > 1 && (
          <>
            <button onClick={() => go(index - 1)} aria-label={t('slider.prev')} className={`${arrow} left-2 sm:left-4`}>
              <Icon d="M15 5l-7 7 7 7" />
            </button>
            <button onClick={() => go(index + 1)} aria-label={t('slider.next')} className={`${arrow} right-2 sm:right-4`}>
              <Icon d="M9 5l7 7-7 7" />
            </button>

            <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1 px-14">
              {slides.map((s, i) => (
                <button key={s._id} onClick={() => go(i)} aria-label={t('slider.goTo', { n: i + 1 })}
                  aria-current={i === index ? 'true' : undefined} className="flex h-8 w-8 items-center justify-center">
                  <span className={`block h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-gold' : 'w-2.5 bg-white/70'}`} />
                </button>
              ))}
            </div>

            <button onClick={() => setPlaying(!playing)} aria-label={playing ? t('slider.pause') : t('slider.play')}
              className="absolute right-2 bottom-1 z-10 flex h-10 w-10 items-center justify-center text-white sm:right-4">
              <Icon d={playing ? 'M9 5v14M15 5v14' : 'M7 4l12 8-12 8z'} />
            </button>
          </>
        )}
      </section>

      {viewing !== null && slides[viewing] && (
        <Lightbox items={slides} index={viewing} onIndex={setViewing}
          onClose={() => { setIndex(viewing); setViewing(null) }} />
      )}
    </>
  )
}
