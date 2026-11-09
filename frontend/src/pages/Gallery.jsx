import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import { thumb } from '../lib/img.js'
import Lightbox from '../components/Lightbox.jsx'
import ZoomBadge from '../components/ZoomBadge.jsx'
import Loading from '../components/Loading.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadFailed from '../components/LoadFailed.jsx'
import StickyTabs from '../components/StickyTabs.jsx'
import useLoad from '../lib/useLoad.js'

const PAGE = 100
const STEP = 24 // photos put on the page at a time ("Show more photos" adds the next ones)

// Loads every photo of one section, 100 at a time
async function loadSection(section) {
  const all = []
  for (let skip = 0; skip < 2000; skip += PAGE) {
    const page = await api.get(`/gallery?section=${section}&limit=${PAGE}&skip=${skip}`)
    all.push(...page)
    if (page.length < PAGE) break
  }
  return all
}

const communityKey = (it) => it.communityEn || it.communityHi || ''

export default function Gallery() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const section = params.get('section') === 'adivasi' ? 'adivasi' : 'general' // /gallery?section=adivasi opens the culture tab

  return (
    <div>
      {/* Photos | Culture tabs, on screen while scrolling */}
      <StickyTabs idPrefix="gallery" label={t('nav.gallery')} value={section}
        onChange={(key) => setParams(key === 'adivasi' ? { section: 'adivasi' } : {}, { replace: true })}
        tabs={[
          { key: 'general', label: `📷 ${t('gallery.photos')}` },
          { key: 'adivasi', label: `🪶 ${t('gallery.culture')}`, short: `🪶 ${t('gallery.cultureShort', { defaultValue: t('gallery.culture') })}` },
        ]} />

      {/* key: each tab is started fresh, so its filters, the open photo and "Show more" begin anew */}
      <GallerySection key={section} section={section} />
    </div>
  )
}

// The photos of one tab, with its filters and the large viewer
function GallerySection({ section }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { data: items, error, reload } = useLoad(() => loadSection(section), section)
  const failed = !!error
  const [kind, setKind] = useState('') // '', 'dance' or 'festival'
  const [community, setCommunity] = useState('')
  const [visible, setVisible] = useState(STEP)

  const [open, setOpen] = useState(null) // number of the photo shown large, or null
  const photoButtons = useRef([])
  const lastViewed = useRef(null)

  // When the viewer closes, keyboard focus goes back to the photo that was being viewed
  useEffect(() => {
    if (open !== null) lastViewed.current = open
    else if (lastViewed.current !== null) {
      photoButtons.current[lastViewed.current]?.focus()
      lastViewed.current = null
    }
  }, [open])

  // One entry per community, named in the visitor's language
  const communities = useMemo(() => {
    const seen = new Map()
    ;(items || []).forEach((it) => {
      const key = communityKey(it)
      if (key && !seen.has(key)) seen.set(key, pickText(it, 'community', lang))
    })
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], lang))
  }, [items, lang])

  const shown = (items || []).filter((it) => (!kind || it.kind === kind) && (!community || communityKey(it) === community))
  const filter = (set) => (value) => { set(value); setVisible(STEP) }
  const chip = (value) => `inline-flex min-h-10 items-center rounded-full border px-4 font-semibold motion-safe:transition ${kind === value ? 'border-brand bg-brand text-white' : 'border-navy/15 bg-white text-navy hover:border-brand/40 hover:bg-mist'}`

  // Paging through the large viewer past the photos on the page puts them on the page too,
  // so focus can return to the last one viewed
  function viewerIndex(i) {
    setOpen(i)
    if (i >= visible) setVisible(Math.ceil((i + 1) / STEP) * STEP)
  }

  return (
      <section id={`gallery-panel-${section}`} role="tabpanel" aria-labelledby={`gallery-${section}`} className="mx-auto max-w-6xl px-5 py-8 sm:py-10 lg:px-8">
        {section === 'adivasi' && (
          <div className="mb-6">
            <p className="mb-4 max-w-3xl text-lg text-navy/80">{t('gallery.cultureIntro')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => filter(setKind)('')} aria-pressed={kind === ''} className={chip('')}>{t('gallery.all')}</button>
              <button type="button" onClick={() => filter(setKind)('dance')} aria-pressed={kind === 'dance'} className={chip('dance')}>💃 {t('gallery.dance')}</button>
              <button type="button" onClick={() => filter(setKind)('festival')} aria-pressed={kind === 'festival'} className={chip('festival')}>🎉 {t('gallery.festival')}</button>
              {communities.length > 0 && (
                <select aria-label={t('gallery.allCommunities')} value={community} onChange={(e) => filter(setCommunity)(e.target.value)} className="input w-full rounded-full sm:w-auto">
                  <option value="">{t('gallery.allCommunities')}</option>
                  {communities.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              )}
            </div>
          </div>
        )}

        {failed && <LoadFailed onRetry={reload} />}
        {!items && !failed && <Loading />}
        {items && items.length === 0 && <EmptyState icon="image" />}
        {items && items.length > 0 && shown.length === 0 && <p className="text-navy/70">{t('gallery.noMatch')}</p>}

        {shown.length > 0 && (
          <p className="mb-4 text-sm font-semibold text-navy/65">{t('gallery.count', { count: shown.length, defaultValue: '{{count}} photos' })}</p>
        )}

        {/* 2 across on phones, 3 on tablets, 4 on computers. Every photo is cut to the same shape so the rows line up;
            the whole photo is seen when it is opened. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.slice(0, visible).map((it, i) => {
            const caption = pickText(it, 'title', lang)
            const about = [pickText(it, 'community', lang), it.kind ? t(`gallery.${it.kind}`) : ''].filter(Boolean).join(' · ')
            return (
              <div key={it._id}>
                <button type="button" ref={(b) => { photoButtons.current[i] = b }} onClick={() => setOpen(i)} aria-label={`${t('gallery.viewLarger')}: ${caption || about}`}
                  className="group relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-navy/10 motion-safe:transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand">
                  <img src={thumb(it.image.url, 640, 480)} alt={caption || about} loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover motion-safe:transition motion-safe:duration-300 group-hover:scale-[1.04]" />
                  {(caption || about) && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/95 via-navy/60 to-transparent px-3 pt-8 pb-2.5 text-left text-white">
                      {caption && <span className="line-clamp-1 text-sm font-semibold sm:text-base">{caption}</span>}
                      {about && <span className="line-clamp-1 text-xs text-white/80 sm:text-sm">{about}</span>}
                    </span>
                  )}
                  <ZoomBadge />
                </button>
              </div>
            )
          })}
        </div>

        {shown.length > visible && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setVisible((v) => v + STEP)} className="btn border-2 border-brand bg-white text-brand hover:bg-mist">
              ⬇️ {t('gallery.more', { defaultValue: 'Show more photos' })} <span className="text-navy/65">({shown.length - visible})</span>
            </button>
          </div>
        )}

        {open !== null && shown[open] && (
          <Lightbox items={shown} index={open} onIndex={viewerIndex} onClose={() => setOpen(null)} />
        )}
      </section>
  )
}
