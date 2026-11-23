import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import { DL_CATEGORIES, dlCategory, fileSize } from '../data/downloads.js'
import Loading from '../components/Loading.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { WaIcon } from '../components/ShareListen.jsx'
import { trackEvent } from '../lib/analytics.js'
import { shareLink } from '../lib/share.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const IMAGE = ['jpg', 'jpeg', 'png', 'webp']

// The file's type as a coloured label: red PDF, blue photo, grey for anything else
function TypeBadge({ format }) {
    const { t } = useTranslation()
    const f = (format || '').toLowerCase()
    if (!f) return null
    const [label, cls] = f === 'pdf' ? ['PDF', 'bg-red-50 text-red-700 ring-red-200']
        : IMAGE.includes(f) ? [t('dl.photo', { defaultValue: 'Photo' }), 'bg-sky-50 text-sky-800 ring-sky-200']
            : [f.toUpperCase(), 'bg-mist text-navy/75 ring-navy/10']
    return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ring-1 ${cls}`}>{label}</span>
}

// Public page: books, pamphlets, posters and forms to download
export default function Downloads() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'hi' ? 'hi' : 'en'
    const [items, setItems] = useState(null)
    const [cat, setCat] = useState('')
    const [error, setError] = useState('')

    useEffect(() => { api.get('/downloads').then(setItems).catch((e) => setError(e.message)) }, [])

    const used = DL_CATEGORIES.filter((c) => items?.some((d) => d.category === c.key))
    const shown = (items || []).filter((d) => !cat || d.category === cat)

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-16">
            {used.length > 1 && (
                <div role="tablist" className="mb-6 flex flex-wrap gap-2">
                    {[{ key: '', emoji: '🗂️', en: 'All', hi: 'सभी' }, ...used].map((c) => (
                        <button key={c.key || 'all'} role="tab" aria-selected={cat === c.key} onClick={() => setCat(c.key)}
                            className={`min-h-11 rounded-full border-2 px-4 font-semibold transition ${cat === c.key ? 'border-brand bg-brand text-white' : 'border-navy/15 bg-white hover:border-brand'}`}>
                            {c.emoji} {c[lang]}
                        </button>
                    ))}
                </div>
            )}
            {error && <p role="alert" className="text-red-700">{error}</p>}
            {!items && !error && <Loading />}
            {items?.length === 0 && <EmptyState icon="download" text={t('dl.empty')} hint={false} action={{ to: '/news', label: t('sections.news') }} />}

            {/* One row per file: small picture, what it is, size, and the Download button */}
            <ul className="grid gap-3 lg:grid-cols-2">
                {shown.map((d) => {
                    const c = dlCategory(d.category)
                    return (
                        <li key={d._id} id={`dl-${d._id}`} className="flex scroll-mt-28 flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-navy/10 bg-white p-3 shadow-sm sm:flex-nowrap sm:p-4">
                            {d.preview
                                ? <img src={d.preview} alt="" loading="lazy" className="h-20 w-16 shrink-0 rounded-lg bg-mist object-cover shadow-sm" />
                                : <div aria-hidden="true" className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-navy to-brand text-3xl">{d.format === 'pdf' ? '📕' : c.emoji}</div>}
                            <div className="min-w-0 flex-1">
                                <span className="text-xs font-semibold text-brand">{c.emoji} {c[lang]}</span>
                                <h2 className="leading-snug font-extrabold">{pickText(d, 'title', lang)}</h2>
                                {pickText(d, 'description', lang) && <p className="line-clamp-2 text-sm text-navy/70">{pickText(d, 'description', lang)}</p>}
                                <span className="mt-1 flex items-center gap-2 text-xs text-navy/65"><TypeBadge format={d.format} />{d.bytes ? fileSize(d.bytes) : ''}</span>
                            </div>
                            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                                <a href={`${BASE}/downloads/${d._id}/file`} target="_blank" rel="noopener noreferrer" className="btn min-h-11 flex-1 rounded-xl bg-brand px-4 py-2 text-sm text-white sm:flex-none">
                                    📥 {t('dl.download')}
                                </a>
                                {/* Send this file to someone. The link goes through the backend's /share/downloads page,
                                    so WhatsApp shows the file's name and a picture; tapping it opens this page at the file. */}
                                <a href={`https://wa.me/?text=${encodeURIComponent(`${pickText(d, 'title', lang)}\n${shareLink('downloads', d._id)}`)}`}
                                    target="_blank" rel="noopener noreferrer" aria-label={t('detail.share')} title={t('detail.share')}
                                    onClick={() => trackEvent('share', { method: 'whatsapp', content_type: 'downloads', item_id: d._id })}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#15803d] text-white hover:bg-[#166534]">
                                    <WaIcon />
                                </a>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
