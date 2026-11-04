// Google Analytics 4 (page views) and Microsoft Clarity (heatmaps and session recordings) for the public site.
// Runs only on the live site, never in the admin area, never for team members logged in on this device,
// and not when the browser asks not to be tracked. The scripts load after the page, so they never slow it down.
// Neither id is secret: they are visible in every site's page code.
const GA_ID = 'G-TFWCTJQMZ6'
const CLARITY_ID = 'z8gj537mqz'
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
    // Clarity's queue: commands wait here until its script arrives (same idea as dataLayer)
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments) }
    const add = (src) => {
        const s = document.createElement('script')
        s.async = true
        s.src = src
        document.head.appendChild(s)
    }
    const load = () => {
        add(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`)
        add(`https://www.clarity.ms/tag/${CLARITY_ID}`)
    }
    if (document.readyState === 'complete') load()
    else window.addEventListener('load', load, { once: true })
}

// Called by App.jsx whenever the address changes
export function trackPage(path) {
    // Opening the admin area (or logging in) in the same tab: stop Clarity recording at once
    if (ready && path.startsWith('/admin')) { window.clarity('stop'); lastPath = path; return }
    if (path === lastPath || !allowed(path)) return
    if (ready && lastPath.startsWith('/admin')) window.clarity('start') // back on the public site
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
