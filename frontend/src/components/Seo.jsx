import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n.js'
import { BANDS } from './PageBand.jsx'

// Search engines (Google, Bing) read the page title, description and links set here.
// Every page gets these automatically; pages with their own content (one news item, one event,
// one leader, one state) set their own with useSeo().

const DEFAULT_IMAGE = '/og-default.jpg'

// Pages that should never show up in search results
const PRIVATE = /^\/(admin|receipt|card)(\/|$)/

// Pages that set their own title once their content has loaded
const OWN_SEO = /^\/(news|events|inspirations|leadership\/states)\/[^/]+$/

const absolute = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${window.location.origin}${url}`)

// Short, single-line text for search results (about 160 characters)
function shorten(text = '') {
    const clean = String(text).replace(/\s+/g, ' ').trim()
    return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean
}

// Finds a <meta>/<link> tag in <head>, creating it the first time
function headTag(tag, attr, key) {
    let el = document.head.querySelector(`${tag}[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement(tag)
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    return el
}
const setMeta = (attr, key, content) => headTag('meta', attr, key).setAttribute('content', content)

export function applySeo({ title, description, image, type = 'website', noindex = false }) {
    const site = i18n.t('org')
    const fullTitle = title && title !== site ? `${title} | ${site}` : site
    const desc = shorten(description || i18n.t('mission'))
    const url = `${window.location.origin}${window.location.pathname}`
    const img = absolute(image || DEFAULT_IMAGE)

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    headTag('link', 'rel', 'canonical').setAttribute('href', url)

    setMeta('property', 'og:site_name', site)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', img)
}

// For pages that load their own content. Does nothing until a title is ready.
export function useSeo({ title, description, image, type }) {
    const { i18n: { language } } = useTranslation()
    useEffect(() => {
        if (title) applySeo({ title, description, image, type })
    }, [title, description, image, type, language])
}

// Tells Google who the organisation is (name, logo, website). Added once.
function addOrganisation() {
    if (document.getElementById('org-jsonld')) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'org-jsonld'
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Bhim Army Blue Panther',
        alternateName: 'भीम आर्मी ब्लू पैंथर',
        url: window.location.origin,
        logo: `${window.location.origin}/logo.png`,
    })
    document.head.appendChild(script)
}

// Put once in App.jsx. Sets the title and description for every ordinary page.
export default function RouteSeo() {
    const { pathname } = useLocation()
    const { t, i18n: { language } } = useTranslation()

    useEffect(() => {
        document.documentElement.lang = language
        addOrganisation()
        if (OWN_SEO.test(pathname)) return
        if (PRIVATE.test(pathname)) return applySeo({ title: pathname.startsWith('/admin') ? 'Admin' : null, noindex: true })
        const band = BANDS[pathname]
        applySeo({
            title: band ? t(band[0]) : null,
            description: band?.[1] ? t(band[1]) : null,
        })
    }, [pathname, language, t])

    return null
}
