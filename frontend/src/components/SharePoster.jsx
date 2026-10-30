import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { makePoster } from '../lib/poster.js'
import { pickText } from '../lib/text.js'
import BoxIcon from './BoxIcon.jsx'

// "Share as a poster": makes a picture of the news item or event and opens the phone's share menu (WhatsApp, Status, Instagram…).
// On a computer, where sharing pictures is not possible, it downloads the picture instead.
export default function SharePoster({ item, kind, link, className = '' }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [poster, setPoster] = useState(null) // { blob, url }
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')

    // Free the picture when the window closes
    useEffect(() => () => { if (poster) URL.revokeObjectURL(poster.url) }, [poster])

    // Close with the Esc key
    useEffect(() => {
        if (!poster) return
        const key = (e) => e.key === 'Escape' && setPoster(null)
        document.addEventListener('keydown', key)
        return () => document.removeEventListener('keydown', key)
    }, [poster])

    async function open() {
        setBusy(true); setError(''); setNote('')
        try {
            const blob = await makePoster({ item, kind, lang, t })
            setPoster({ blob, url: URL.createObjectURL(blob) })
        } catch {
            setError(t('poster.failed', { defaultValue: 'Could not make the poster. Please try again.' }))
        } finally { setBusy(false) }
    }

    const fileName = `bhim-army-${kind === 'events' ? 'event' : 'news'}-${item._id}.png`
    const title = pickText(item, 'title', lang)

    async function share() {
        const file = new File([poster.blob], fileName, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], text: `${title}\n${link}` })
            } catch { /* the person closed the share menu */ }
            return
        }
        download()
        setNote(t('poster.saved', { defaultValue: 'Poster saved. Open WhatsApp, tap the 📎 (attach) button and choose this picture.' }))
    }

    function download() {
        const a = document.createElement('a')
        a.href = poster.url
        a.download = fileName
        a.click()
    }

    const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })

    return (
        <>
            <button type="button" onClick={open} disabled={busy}
                className={`btn gap-2 bg-gold text-navy hover:brightness-95 disabled:opacity-60 ${className}`}>
                <BoxIcon name="image" size={20} />
                {busy ? t('poster.making', { defaultValue: 'Making poster…' }) : t('poster.button', { defaultValue: 'Share as a poster' })}
            </button>
            {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

            {poster && createPortal(
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t('poster.button', { defaultValue: 'Share as a poster' })}>
                    <button type="button" aria-label={t('poster.close', { defaultValue: 'Close' })} onClick={() => setPoster(null)} className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
                    {/* Phones: the poster on top and the buttons below. Computers: the poster on the left and the buttons beside it. */}
                    <div className="relative flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:w-auto sm:max-w-3xl sm:flex-row sm:items-center sm:gap-6 sm:rounded-3xl sm:p-6">
                        <img src={poster.url} alt={title} className="mx-auto max-h-[55vh] w-auto rounded-xl shadow-md sm:mx-0 sm:max-h-[70vh]" />
                        <div className="flex flex-col gap-2.5 sm:w-64">
                            <p className="hidden text-lg leading-snug font-extrabold sm:block">{t('poster.ready', { defaultValue: 'Your poster is ready' })}</p>
                            <p className="hidden text-sm text-navy/65 sm:block">{t('poster.hint', { defaultValue: 'Share it in WhatsApp groups and Status, or download it to print.' })}</p>
                            {note && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{note}</p>}
                            <button type="button" onClick={share} className="btn gap-2 bg-[#25D366] text-white hover:brightness-95">
                                {canShareFiles ? t('poster.share', { defaultValue: 'Share' }) : t('poster.forWhatsapp', { defaultValue: 'Save for WhatsApp' })}
                            </button>
                            <button type="button" onClick={download} className="btn border-2 border-brand text-brand">
                                {t('poster.download', { defaultValue: 'Download' })}
                            </button>
                            <button type="button" onClick={() => setPoster(null)} className="py-1 text-sm font-semibold text-navy/60 underline">{t('poster.close', { defaultValue: 'Close' })}</button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
