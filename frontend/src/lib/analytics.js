// Google Analytics 4: page views for the public site.
// Runs only on the live site, never in the admin area, never for team members logged in on this device,
// and not when the browser asks not to be tracked. The script loads after the page, so it never slows it down.
const GA_ID = 'G-TFWCTJQMZ6' // not secret: every site's GA id is visible in its page code
const LIVE = /(^|\.)bhimarmybluepanther\.org$/.test(location.hostname)

let ready = false
let lastPath = ''

function allowed(path) {
    if (!import.meta.env.PROD || !LIVE) return false
    if (path.startsWith('/admin')) return false
    if (navigator.doNotTrack === '1') return false
    try { if (localStorage.getItem('token')) return false } catch { /* storage blocked: still allowed */ }
    return true
}

function setUp() {
    if (ready) return
    ready = true
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) } // commands wait in dataLayer until the script arrives
    window.gtag('js', new Date())
    window.gtag('config', GA_ID, { send_page_view: false }) // we send page views ourselves on every route change
    const load = () => {
        const s = document.createElement('script')
        s.async = true
        s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
        document.head.appendChild(s)
    }
    if (document.readyState === 'complete') load()
    else window.addEventListener('load', load, { once: true })
}

// Called by App.jsx whenever the address changes
export function trackPage(path) {
    if (path === lastPath || !allowed(path)) return
    lastPath = path
    setUp()
    // Wait a moment so pages that load their own title (a news item, a leader) report the right one
    setTimeout(() => {
        window.gtag('event', 'page_view', {
            page_path: path,
            page_location: location.href,
            page_title: document.title,
        })
    }, 600)
}
