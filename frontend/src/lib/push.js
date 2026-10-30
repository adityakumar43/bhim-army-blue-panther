import { api } from './api.js'

// Phone notifications: turning them on and off on this device.
// Works in Chrome, Edge and Firefox (phone and computer), and on iPhone only inside the installed app (iOS 16.4 and newer).

export const pushSupported = () =>
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const isInstalledApp = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
export const isIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

// The key from the server is text; the browser wants it as bytes
function keyBytes(text) {
    const b64 = (text + '='.repeat((4 - (text.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function worker() {
    const existing = await navigator.serviceWorker.getRegistration()
    if (!existing) await navigator.serviceWorker.register('/sw.js')
    return navigator.serviceWorker.ready
}

// This device's notification address, if notifications are on here
export async function currentSubscription() {
    if (!pushSupported()) return null
    const reg = await navigator.serviceWorker.getRegistration()
    return reg ? reg.pushManager.getSubscription() : null
}

// 'on' | 'off' | 'blocked' | 'unsupported'
export async function pushState() {
    if (!pushSupported()) return 'unsupported'
    if (Notification.permission === 'denied') return 'blocked'
    return (await currentSubscription()) && Notification.permission === 'granted' ? 'on' : 'off'
}

// Asks the person, then tells our server where to send notifications. Throws 'blocked' or 'dismissed' if they said no.
export async function turnOn(lang) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error(permission === 'denied' ? 'blocked' : 'dismissed')
    const reg = await worker()
    const { key } = await api.get('/push/key')
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }))
    await api.post('/push/subscribe', { subscription: sub.toJSON(), lang: lang === 'en' ? 'en' : 'hi' })
    return sub
}

export async function turnOff() {
    const sub = await currentSubscription()
    if (!sub) return
    await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => { })
    await sub.unsubscribe()
}