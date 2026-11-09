import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { trackEvent } from '../lib/analytics.js'

// The link that shows a preview picture on WhatsApp (made by the backend's /share route)
const SHARE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
export const shareLink = (kind, id) => `${SHARE_BASE}/share/${kind}/${id}`

const WA_PATH = 'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2zm5.8 14.1c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.55-.34.73-.34h.52c.17 0 .4-.06.62.47.24.55.79 1.9.86 2.04.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.34z'

// Green "Share on WhatsApp" button. small = a compact pill for cards in a list; icon = a round button with only the icon.
export function WhatsAppShare({ item, kind, small = false, icon = false, className = '' }) {
    const { t, i18n } = useTranslation()
    const text = `${pickText(item, 'title', i18n.language)}\n${shareLink(kind, item._id)}`
    const size = icon ? 'h-10 w-10 shrink-0 rounded-full' : small ? 'min-h-10 gap-1.5 rounded-full px-3.5 text-sm font-semibold' : 'btn gap-2' // big: the same size as the site's other buttons
    return (
        <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackEvent('share', { method: 'whatsapp', content_type: kind, item_id: item._id })}
            {...(icon ? { 'aria-label': t('detail.share'), title: t('detail.share') } : {})}
            className={`inline-flex items-center justify-center bg-[#15803d] text-white hover:bg-[#166534] ${size} ${className}`}
        >
            <svg viewBox="0 0 24 24" width={small && !icon ? 16 : 20} height={small && !icon ? 16 : 20} fill="currentColor" aria-hidden="true"><path d={WA_PATH} /></svg>
            {icon ? null : small ? t('detail.shareShort', { defaultValue: 'Share' }) : t('detail.share')}
        </a>
    )
}

// Long text is read in short pieces: some phones stop reading after about 15 seconds of one piece
function pieces(text) {
    const out = []
    for (const part of text.split(/(?<=[.!?।])\s+|\n+/)) {
        const p = part.trim()
        if (!p) continue
        if (out.length && (out.at(-1).length + p.length) < 180) out[out.length - 1] += ' ' + p
        else out.push(p)
    }
    return out
}

// The best voice on this phone for the language: an Indian voice first, then any voice of that language
function pickVoice(lang) {
    const voices = window.speechSynthesis.getVoices()
    const want = lang === 'hi' ? ['hi-IN', 'hi'] : ['en-IN', 'en-GB', 'en']
    for (const w of want) {
        const v = voices.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(w.toLowerCase()))
        if (v) return v
    }
    return null
}

// "Listen": the phone reads the title and the text aloud in the page language, using the browser's
// own free voice. Nothing is sent anywhere. Hidden on browsers that cannot speak.
export function ListenButton({ item, kind = 'news', small = false, icon = false, className = '' }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'en' ? 'en' : 'hi'
    const [speaking, setSpeaking] = useState(false)
    const run = useRef(0) // which reading is current, so a stopped one does not carry on
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

    // Stop reading when leaving the page or switching language
    useEffect(() => () => {
        if (supported && run.current) { run.current = 0; window.speechSynthesis.cancel(); setSpeaking(false) }
    }, [supported, lang])
    useEffect(() => {
        if (!supported) return
        window.speechSynthesis.getVoices() // starts loading the voice list early (Chrome loads it lazily)
    }, [supported])

    if (!supported) return null

    function stop() {
        run.current = 0
        window.speechSynthesis.cancel()
        setSpeaking(false)
    }

    function start() {
        window.speechSynthesis.cancel() // only one thing reads at a time, even across cards
        const id = Date.now()
        run.current = id
        const text = `${pickText(item, 'title', lang)}${lang === 'hi' ? '।' : '.'}\n${pickText(item, 'body', lang)}`
        const voice = pickVoice(lang)
        const list = pieces(text)
        list.forEach((p, i) => {
            const u = new SpeechSynthesisUtterance(p)
            u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
            if (voice) u.voice = voice
            u.rate = 0.95
            if (i === list.length - 1) u.onend = () => { if (run.current === id) { run.current = 0; setSpeaking(false) } }
            u.onerror = () => { if (run.current === id) { run.current = 0; setSpeaking(false) } }
            window.speechSynthesis.speak(u)
        })
        setSpeaking(true)
        trackEvent('listen', { content_type: kind, item_id: item._id })
    }

    const size = icon ? 'h-10 w-10 shrink-0 rounded-full' : small ? 'min-h-10 gap-1.5 rounded-full px-3.5 text-sm' : 'min-h-11 gap-2 rounded-xl px-5'
    const label = speaking ? t('detail.stop', { defaultValue: 'Stop' }) : t('detail.listen', { defaultValue: 'Listen' })
    return (
        <button
            type="button"
            onClick={speaking ? stop : start}
            aria-pressed={speaking}
            {...(icon ? { 'aria-label': label, title: label } : {})}
            className={`inline-flex items-center justify-center border-2 font-semibold ${speaking ? 'border-brand bg-brand text-white' : 'border-brand/25 bg-white text-brand hover:border-brand'} ${size} ${className}`}
        >
            <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
            {!icon && label}
        </button>
    )
}
