// Runs after "vite build" (see "build" in package.json). It draws the Home page once, in Hindi, with the same
// React components the site uses, and puts that HTML into dist/index.html. A visitor opening the Home page then
// sees the page straight away; the app takes over a moment later, when its code has arrived.
// If anything here goes wrong, index.html is left as it was: the site works exactly as before, only without the head start.
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { loadEnv } from 'vite'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const indexFile = path.join(root, 'dist', 'index.html')
const START = '<!--prerender-start-->'
const END = '<!--prerender-end-->'

// The components expect a browser. While building there is none, so they get a quiet stand-in:
// nothing saved, a small screen, and the Home page's address.
function fakeBrowser() {
    const noop = () => {}
    const storage = { getItem: () => null, setItem: noop, removeItem: noop }
    const site = process.env.VITE_SITE_URL || 'https://bhimarmybluepanther.org'
    Object.assign(globalThis, {
        location: new URL('/', site),
        localStorage: storage,
        sessionStorage: storage,
        matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
        addEventListener: noop,
        removeEventListener: noop,
        document: {
            title: '',
            documentElement: { lang: 'hi', classList: { add: noop, remove: noop, contains: () => false }, style: {} },
            head: { appendChild: noop },
            addEventListener: noop,
            removeEventListener: noop,
            querySelector: () => null,
            createElement: () => ({ style: {}, setAttribute: noop }),
        },
    })
    globalThis.window = globalThis
}

// Does the live site have Home Slider photos and Home Updates right now? A first-time visitor has nothing saved
// yet, so without this the Home page keeps empty space for both while it asks the server, and everything below
// jumps up when there turn out to be none. With the answer from build time, the page is drawn right from the start
// (and drawn the same way here). If it cannot be found out (server asleep, no address), nothing changes: the page
// keeps the space, as before. Visitors who have been here before use what their browser saved on the last visit.
async function homeHint() {
    const api = (loadEnv('production', root, 'VITE_').VITE_API_URL || '').replace(/\/+$/, '')
    if (!/^https?:\/\//.test(api)) return null
    const get = async (p) => {
        const res = await fetch(api + p, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) throw new Error(`${p}: ${res.status}`)
        return res.json()
    }
    const some = async (p) => {
        const list = await get(p)
        if (!Array.isArray(list)) throw new Error(`${p}: not a list`)
        return list.length > 0
    }
    try {
        const [slides, updates, numbers] = await Promise.all([some('/slides'), some('/announcements/current'), get('/growth/numbers').catch(() => null)])
        // The numbers row (members, states...) too, so it is there from the start instead of pushing the photo down.
        // The live numbers replace these a moment later, in the same place.
        return { slides, updates, ...(numbers && typeof numbers === 'object' && !Array.isArray(numbers) ? { numbers } : {}) }
    } catch (err) {
        console.warn(`Prerender: could not check slides and updates (${err.message}); the Home page keeps space for them`)
        return null
    }
}

try {
    let page = fs.readFileSync(indexFile, 'utf8')
    if (!page.includes(START) || !page.includes(END)) throw new Error(`${START} … ${END} not found in index.html`)
    const hint = await homeHint()
    fakeBrowser()
    if (hint) globalThis.__homeHint = hint
    const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)
    const html = render('/')
    if (!html.includes('<h1')) throw new Error('the drawn page has no heading')
    // The hint goes in front of the drawn page, so the app reads the same answer when it starts
    const hintTag = hint ? `<script>window.__homeHint=${JSON.stringify(hint)}</script>` : ''
    page = page.slice(0, page.indexOf(START) + START.length) + `${hintTag}<div id="prerendered">${html}</div>` + page.slice(page.indexOf(END))
    fs.writeFileSync(indexFile, page)
    console.log(`Prerender: Home page added to index.html (${Math.round(html.length / 1024)} KB)${hint ? `; slides: ${hint.slides ? 'yes' : 'no'}, updates: ${hint.updates ? 'yes' : 'no'}, numbers: ${hint.numbers ? 'yes' : 'no'}` : ''}`)
} catch (err) {
    console.warn(`Prerender skipped, the site works as before: ${err.message}`)
}
process.exit(0) // some components start timers; they must not keep the build waiting
