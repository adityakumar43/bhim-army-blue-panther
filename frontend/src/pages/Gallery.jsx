import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import { cdn } from '../lib/img.js'
import Lightbox from '../components/Lightbox.jsx'
import ZoomBadge from '../components/ZoomBadge.jsx'
import Loading from '../components/Loading.jsx'

const PAGE = 100

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
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [params, setParams] = useSearchParams()
  const section = params.get('section') === 'adivasi' ? 'adivasi' : 'general' // /gallery?section=adivasi opens the culture tab
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [kind, setKind] = useState('') // '', 'dance' or 'festival'
  const [community, setCommunity] = useState('')

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

  useEffect(() => {
    setItems(null)
    setError('')
    setKind('')
    setCommunity('')
    setOpen(null)
    loadSection(section).then(setItems).catch((e) => setError(e.message))
  }, [section])

  // One entry per community, named in the visitor's language
  const communities = useMemo(() => {
    const seen = new Map()
      ; (items || []).forEach((it) => {
        const key = communityKey(it)
        if (key && !seen.has(key)) seen.set(key, pickText(it, 'community', lang))
      })
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], lang))
  }, [items, lang])

  const shown = (items || []).filter((it) => (!kind || it.kind === kind) && (!community || communityKey(it) === community))
  const tab = (key) => `min-h-11 flex-1 px-4 font-semibold sm:flex-none sm:px-6 ${section === key ? 'bg-navy text-white' : ''}`
  const chip = (value) => `min-h-10 border px-4 font-semibold ${kind === value ? 'border-brand bg-brand text-white' : 'border-navy/30'}`

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-16">
      

      <div role="group" aria-label={t('nav.gallery')} className="mb-6 flex w-full border border-navy/30 bg-white sm:inline-flex sm:w-auto">
        <button onClick={() => setParams({})} aria-pressed={section === 'general'} className={tab('general')}>{t('gallery.photos')}</button>
        <button onClick={() => setParams({ section: 'adivasi' })} aria-pressed={section === 'adivasi'} className={tab('adivasi')}>{t('gallery.culture')}</button>
      </div>

      {section === 'adivasi' && (
        <>
          <p className="mb-5 max-w-3xl text-lg">{t('gallery.cultureIntro')}</p>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setKind('')} aria-pressed={kind === ''} className={chip('')}>{t('gallery.all')}</button>
            <button onClick={() => setKind('dance')} aria-pressed={kind === 'dance'} className={chip('dance')}>{t('gallery.dance')}</button>
            <button onClick={() => setKind('festival')} aria-pressed={kind === 'festival'} className={chip('festival')}>{t('gallery.festival')}</button>
            {communities.length > 0 && (
              <select aria-label={t('gallery.allCommunities')} value={community} onChange={(e) => setCommunity(e.target.value)} className="input w-auto">
                <option value="">{t('gallery.allCommunities')}</option>
                {communities.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            )}
          </div>
        </>
      )}

      {error && <p role="alert" className="py-8 text-red-700">{error}</p>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
      {items && items.length > 0 && shown.length === 0 && <p className="text-navy/70">{t('gallery.noMatch')}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((it, i) => {
          const caption = pickText(it, 'title', lang)
          const about = [pickText(it, 'community', lang), it.kind ? t(`gallery.${it.kind}`) : ''].filter(Boolean).join(' · ')
          return (
            <figure key={it._id}>
              <button type="button" ref={(b) => { photoButtons.current[i] = b }} onClick={() => setOpen(i)} aria-label={`${t('gallery.viewLarger')}: ${caption || about}`} className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl">
                <img src={cdn(it.image.url, 800)} alt={caption || about} loading="lazy" className="aspect-4/3 w-full object-cover motion-safe:transition group-hover:brightness-90" />
                <ZoomBadge />
              </button>
              {(caption || about) && (
                <figcaption className="mt-2">
                  {caption && <div className="font-semibold">{caption}</div>}
                  {about && <div className="text-sm text-navy/70">{about}</div>}
                </figcaption>
              )}
            </figure>
          )
        })}

        {open !== null && shown[open] && (
          <Lightbox items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
        )}
      </div>
    </div>
  )
}