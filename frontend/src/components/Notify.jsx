import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from './Icon.jsx'
import BoxIcon from './BoxIcon.jsx'
import { pushState, turnOn, turnOff, isInstalledApp, isIphone } from '../lib/push.js'

// Turns phone notifications on or off for this device, and says what happened
function useNotify() {
    const { i18n } = useTranslation()
    const [state, setState] = useState(null) // null while checking: 'on' | 'off' | 'blocked' | 'unsupported'
    const [busy, setBusy] = useState(false)
    const [note, setNote] = useState('') // 'done' | 'failed' | ''
    useEffect(() => { pushState().then(setState).catch(() => setState('unsupported')) }, [])

    async function on() {
        setBusy(true); setNote('')
        try { await turnOn(i18n.language); setState('on'); setNote('done'); return true }
        catch (err) {
            if (err.message === 'blocked') setState('blocked')
            else if (err.message !== 'dismissed') setNote('failed')
            return false
        } finally { setBusy(false) }
    }
    async function off() {
        setBusy(true); setNote('')
        try { await turnOff(); setState('off') } finally { setBusy(false) }
    }
    return { state, busy, note, on, off }
}

// In the footer of every public page: "Get news on your phone"
export function NotifyButton() {
    const { t } = useTranslation()
    const { state, busy, note, on, off } = useNotify()
    if (state === null) return null
    if (state === 'unsupported') {
        // iPhone: notifications only work inside the installed app
        return isIphone() && !isInstalledApp() ? <p className="mt-4 max-w-sm text-xs text-white/60">🔔 {t('push.iosHint')}</p> : null
    }
    return (
        <div className="mt-4 max-w-sm">
            {state === 'off' && (
                <button onClick={on} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gold/50 px-3 text-sm font-semibold text-gold hover:bg-gold hover:text-navy disabled:opacity-60">
                    <Icon name="bell" size={16} /> {busy ? '…' : t('push.title')}
                </button>
            )}
            {state === 'on' && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/75">
                    <span>🔔 {t('push.on')}</span>
                    <button onClick={off} disabled={busy} className="text-xs text-white/50 underline hover:text-white">{t('push.turnOff')}</button>
                </p>
            )}
            {state === 'blocked' && <p className="text-xs text-white/60">🔕 {t('push.blocked')}</p>}
            {note && <p role="status" className="mt-1 text-xs text-white/70">{note === 'done' ? `✅ ${t('push.done')}` : `⚠️ ${t('push.failed')}`}</p>}
        </div>
    )
}

const KEY = 'notifyAskedAt'
const WAIT_DAYS = 30

// Inside the installed app only: asks once (again after 30 days if they said "Not now")
export function NotifyPrompt() {
    const { t } = useTranslation()
    const { state, busy, note, on } = useNotify()
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (state !== 'off' || !isInstalledApp() || Notification.permission !== 'default') return
        let asked = 0
        try { asked = Number(localStorage.getItem(KEY)) || 0 } catch { /* storage blocked */ }
        if (Date.now() - asked < WAIT_DAYS * 864e5) return
        const timer = setTimeout(() => setShow(true), 15000) // let them look around first
        return () => clearTimeout(timer)
    }, [state])

    const later = () => {
        try { localStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked */ }
        setShow(false)
    }
    async function yes() {
        const ok = await on()
        try { localStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked */ }
        setTimeout(() => setShow(false), ok ? 2500 : 0)
    }

    if (!show) return null
    return (
        <div role="dialog" aria-label={t('push.title')} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-navy p-4 text-white shadow-2xl sm:bottom-5">
            <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-navy" aria-hidden="true"><BoxIcon name="bell" size={24} /></span>
                <div className="min-w-0 flex-1">
                    <p className="leading-tight font-extrabold">{t('push.title')}</p>
                    <p className="text-sm text-white/75">{note === 'done' ? `✅ ${t('push.done')}` : t('push.text')}</p>
                </div>
                <button onClick={later} aria-label={t('push.later')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10">
                    <Icon name="close" size={18} />
                </button>
            </div>
            {note !== 'done' && (
                <div className="mt-3 flex gap-2">
                    <button onClick={yes} disabled={busy} className="btn min-h-11 flex-1 gap-2 bg-gold py-2 text-navy disabled:opacity-60">
                        <Icon name="bell" size={18} /> {busy ? '…' : t('push.turnOn')}
                    </button>
                    <button onClick={later} className="btn min-h-11 px-4 py-2 text-white/80 hover:bg-white/10">{t('push.later')}</button>
                </div>
            )}
            {note === 'failed' && <p className="mt-2 text-xs text-white/70">⚠️ {t('push.failed')}</p>}
        </div>
    )
}
