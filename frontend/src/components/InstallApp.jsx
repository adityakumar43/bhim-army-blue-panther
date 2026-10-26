import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon.jsx'

// A small bar at the bottom of the public pages: "Install our app".
// Android / Chrome / Edge: one tap opens the phone's own install box.
// iPhone (Safari has no install button): shows the two steps instead.
// Hidden once the app is installed, or for 14 days after "Not now".

const KEY = 'installDismissedAt'
const WAIT_DAYS = 14

const isInstalled = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent)

function dismissedRecently() {
    try {
        const at = Number(localStorage.getItem(KEY))
        return at && Date.now() - at < WAIT_DAYS * 864e5
    } catch {
        return false
    }
}

export default function InstallApp() {
    const { t } = useTranslation()
    const [prompt, setPrompt] = useState(null) // Chrome's saved install box
    const [ios, setIos] = useState(false)
    const [showSteps, setShowSteps] = useState(false)
    const [hidden, setHidden] = useState(() => isInstalled() || dismissedRecently())

    useEffect(() => {
        if (hidden) return
        const onPrompt = (e) => {
            e.preventDefault() // keep it for our own button instead of Chrome's mini bar
            setPrompt(e)
        }
        const onInstalled = () => setHidden(true)
        window.addEventListener('beforeinstallprompt', onPrompt)
        window.addEventListener('appinstalled', onInstalled)
        // Give the page a moment to load before showing anything
        const timer = setTimeout(() => setIos(isIphone()), 4000)
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt)
            window.removeEventListener('appinstalled', onInstalled)
            clearTimeout(timer)
        }
    }, [hidden])

    function notNow() {
        try { localStorage.setItem(KEY, String(Date.now())) } catch { /* private mode */ }
        setHidden(true)
    }

    async function install() {
        if (!prompt) return setShowSteps(true)
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        setPrompt(null)
        if (outcome === 'accepted') setHidden(true)
        else notNow()
    }

    if (hidden || (!prompt && !ios)) return null

    return (
        <div role="dialog" aria-label={t('pwa.title')} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-navy p-4 text-white shadow-2xl sm:bottom-5">
            <div className="flex items-center gap-3">
                <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl bg-white/10 object-contain p-0.5" />
                <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-tight">{t('pwa.title')}</p>
                    <p className="text-sm text-white/75">{t('pwa.text')}</p>
                </div>
                <button onClick={notNow} aria-label={t('pwa.later')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10">
                    <Icon name="close" size={18} />
                </button>
            </div>

            {showSteps || (ios && !prompt) ? (
                <ol className="mt-3 space-y-1.5 rounded-xl bg-white/10 p-3 text-sm">
                    <li className="flex items-center gap-1.5">
                        1. {t('pwa.iosStep1')}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
                        </svg>
                    </li>
                    <li>2. {t('pwa.iosStep2')}</li>
                </ol>
            ) : (
                <div className="mt-3 flex gap-2">
                    <button onClick={install} className="btn min-h-11 flex-1 gap-2 bg-gold py-2 text-navy">
                        <Icon name="download" size={18} /> {t('pwa.install')}
                    </button>
                    <button onClick={notNow} className="btn min-h-11 px-4 py-2 text-white/80 hover:bg-white/10">{t('pwa.later')}</button>
                </div>
            )}
        </div>
    )
}
