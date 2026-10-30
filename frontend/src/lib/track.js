import i18n from '../i18n.js'

// Counts a page being opened, for the "Visitors" page in the admin panel.
// Sends only: which page, which site linked here, the page language and whether it is the installed app.
// No cookies and nothing personal. People from the team (logged in on this device) are not counted.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let lastPath = ''

export function countVisit(path) {
    if (path === lastPath) return
    lastPath = path
    try {
        if (localStorage.getItem('token')) return
    } catch { /* storage blocked: still count */ }
    if (navigator.doNotTrack === '1') return
    const first = !countVisit.done // only the first page of a visit can come from another site
    countVisit.done = true
    const body = {
        path,
        ref: first ? document.referrer : '',
        lang: i18n.language === 'en' ? 'en' : 'hi',
        app: window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
    }
    fetch(`${BASE}/visits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => { })
}