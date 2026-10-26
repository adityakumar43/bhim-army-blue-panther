import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'
import YouTubeLite from '../components/YouTubeLite.jsx'
import { VIDEO_CATEGORIES, videoCategory } from '../data/videos.js'

// Public page: speeches, rallies and events on YouTube
export default function Videos() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'hi' ? 'hi' : 'en'
    const [items, setItems] = useState(null)
    const [cat, setCat] = useState('')
    const [error, setError] = useState('')

    useEffect(() => { api.get('/videos').then(setItems).catch((e) => setError(e.message)) }, [])

    const used = VIDEO_CATEGORIES.filter((c) => items?.some((v) => v.category === c.key))
    const shown = (items || []).filter((v) => !cat || v.category === cat)

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-16">
            {used.length > 1 && (
                <div role="tablist" className="mb-6 flex flex-wrap gap-2">
                    {[{ key: '', emoji: '🎞️', en: 'All', hi: 'सभी' }, ...used].map((c) => (
                        <button key={c.key || 'all'} role="tab" aria-selected={cat === c.key} onClick={() => setCat(c.key)}
                            className={`min-h-11 rounded-full border-2 px-4 font-semibold transition ${cat === c.key ? 'border-brand bg-brand text-white' : 'border-navy/15 bg-white hover:border-brand'}`}>
                            {c.emoji} {c[lang]}
                        </button>
                    ))}
                </div>
            )}
            {error && <p role="alert" className="text-red-700">{error}</p>}
            {!items && !error && <p>{t('loading')}</p>}
            {items?.length === 0 && <p className="panel text-center text-navy/70">{t('videos.empty')}</p>}

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((v) => (
                    <li key={v._id} className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
                        <YouTubeLite id={v.youtubeId} title={pickText(v, 'title', lang)} />
                        <div className="p-4">
                            <span className="text-xs font-semibold text-brand">{videoCategory(v.category).emoji} {videoCategory(v.category)[lang]}</span>
                            <h2 className="mt-1 leading-snug font-extrabold">{pickText(v, 'title', lang)}</h2>
                        </div>
                    </li>
                ))}
            </ul>

            {items?.length > 0 && <p className="mt-8 text-center text-sm text-navy/60">▶️ {t('videos.onYoutube')}</p>}
        </div>
    )
}
