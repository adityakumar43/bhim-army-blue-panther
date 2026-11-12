// Runs after "vite build" (see "build" in package.json). It draws the Home page once, in Hindi, with the same
// React components the site uses, and puts that HTML into dist/index.html. A visitor opening the Home page then
// sees the page straight away; the app takes over a moment later, when its code has arrived.
// If anything here goes wrong, index.html is left as it was: the site works exactly as before, only without the head start.
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

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

try {
    let page = fs.readFileSync(indexFile, 'utf8')
    if (!page.includes(START) || !page.includes(END)) throw new Error(`${START} … ${END} not found in index.html`)
    fakeBrowser()
    const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)
    const html = render('/')
    if (!html.includes('<h1')) throw new Error('the drawn page has no heading')
    page = page.slice(0, page.indexOf(START) + START.length) + `<div id="prerendered">${html}</div>` + page.slice(page.indexOf(END))
    fs.writeFileSync(indexFile, page)
    console.log(`Prerender: Home page added to index.html (${Math.round(html.length / 1024)} KB)`)
} catch (err) {
    console.warn(`Prerender skipped, the site works as before: ${err.message}`)
}
process.exit(0) // some components start timers; they must not keep the build waiting
