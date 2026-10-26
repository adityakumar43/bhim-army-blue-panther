// Service worker: lets the website be installed as an app and open quickly, even on a weak connection.
// Only the website's own files (pages, code, pictures in /public) are saved on the phone.
// News, members, donations and anything from the backend always come fresh from the internet.

const VERSION = 'v1' // change this (v2, v3...) only if something looks stuck after an update
const CACHE = `bap-${VERSION}`
const SHELL = ['/', '/manifest.webmanifest', '/logo.png', '/icons/icon-192.png']

const OFFLINE_HTML = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a1a3f;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
button{margin-top:16px;padding:12px 24px;border:0;border-radius:12px;background:#f2b705;color:#0a1a3f;font-weight:800;font-size:16px}</style></head>
<body><div><h1>इंटरनेट नहीं है</h1><p>You are offline. Please check your connection.</p>
<button onclick="location.reload()">फिर से कोशिश करें / Try again</button></div></body></html>`

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bap-') && k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const req = event.request
    if (req.method !== 'GET') return
    const url = new URL(req.url)
    // Backend, Cloudinary, YouTube, fonts...: leave to the browser as normal
    if (url.origin !== self.location.origin) return

    // Pages: try the internet first so people always get the latest version; use the saved copy if offline
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) caches.open(CACHE).then((c) => c.put('/', res.clone()))
                    return res
                })
                .catch(async () => (await caches.match('/')) || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
        )
        return
    }

    // Built code in /assets/ has a new name after every update, so a saved copy is always correct
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)) }
                return res
            }))
        )
        return
    }

    // Pictures and other files in /public: show the saved copy straight away, refresh it in the background
    if (/\.(png|jpe?g|webp|svg|ico|webmanifest)$/.test(url.pathname)) {
        event.respondWith(
            caches.open(CACHE).then(async (c) => {
                const hit = await c.match(req)
                const fresh = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res }).catch(() => hit || Response.error())
                return hit || fresh
            })
        )
    }
})