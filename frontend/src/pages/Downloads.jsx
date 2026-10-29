import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import { DL_CATEGORIES, dlCategory, fileSize } from '../data/downloads.js'
import Loading from '../components/Loading.jsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
            {items?.length === 0 && <p className="panel text-center text-navy/70">{t('dl.empty')}</p>}

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((d) => {
                    const c = dlCategory(d.category)
                    return (
                        <li key={d._id} className="flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
                            {d.preview
                                ? <img src={d.preview} alt="" loading="lazy" className="aspect-[4/3] w-full bg-mist object-cover" />
                                : <div aria-hidden="true" className="flex aspect-[4/3] w-full items-center justify-center bg-linear-to-br from-navy to-brand text-6xl">{d.format === 'pdf' ? '📕' : c.emoji}</div>}
                            <div className="flex flex-1 flex-col p-5">
                                <span className="text-xs font-semibold text-brand">{c.emoji} {c[lang]}</span>
                                <h2 className="mt-1 text-lg leading-snug font-extrabold">{pickText(d, 'title', lang)}</h2>
                                {pickText(d, 'description', lang) && <p className="mt-1 line-clamp-3 text-sm text-navy/75">{pickText(d, 'description', lang)}</p>}
                                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                                    <span className="text-xs text-navy/55">{(d.format || '').toUpperCase()}{d.bytes ? ` · ${fileSize(d.bytes)}` : ''}</span>
                                    <a href={`${BASE}/downloads/${d._id}/file`} target="_blank" rel="noopener noreferrer" className="btn min-h-10 rounded-xl bg-brand px-4 py-2 text-sm text-white">
                                        📥 {t('dl.download')}
                                    </a>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
