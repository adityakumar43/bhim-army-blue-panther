import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n.js'
import { BANDS } from './PageBand.jsx'
import { ORG } from '../lib/orgInfo.js'

// Search engines (Google, Bing) read the page title, description and links set here.
// Every page gets these automatically; pages with their own content (one news item, one event,
// one leader, one state) set their own with useSeo().

const DEFAULT_IMAGE = '/og-default.jpg'

// Pages that should never show up in search results
const PRIVATE = /^\/(admin|receipt|card|certificate|unsubscribe|membership\/update)(\/|$)/

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

// Puts structured data (JSON-LD) on the page while it is open, and removes it when the page closes.
// Google, Bing and AI assistants read it to know exactly who is who. Pass null to add nothing.
export function useJsonLd(id, data) {
    const json = data ? JSON.stringify(data) : ''
    useEffect(() => {
        if (!json) return
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = id
        script.textContent = json
        document.head.appendChild(script)
        return () => script.remove()
    }, [id, json])
}

// Leaders as schema.org people, each linked to the organisation. `where` is added to the post (for example a state).
export function leadersJsonLd(list, where = '') {
    if (!list?.length) return null
    const org = `${window.location.origin}/#organization`
    return {
        '@context': 'https://schema.org',
        '@graph': list.map((l) => {
            const name = l.nameEn || l.nameHi
            const role = l.roleEn || l.roleHi
            const area = l.level === 'district' ? l.areaEn || l.areaHi : ''
            return {
                '@type': 'Person',
                name,
                ...(l.nameEn && l.nameHi ? { alternateName: l.nameHi } : {}),
                ...(role ? { jobTitle: [role, area, where].filter(Boolean).join(', ') } : {}),
                ...(l.photo ? { image: absolute(l.photo) } : {}),
                memberOf: { '@id': org, '@type': 'Organization', name: 'Bhim Army Blue Panther' },
                url: window.location.href.split('#')[0],
            }
        }),
    }
}

// Tells Google who the organisation is (name, logo, website). Added once (index.html already has it).
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

// Adds the organisation's social media pages (from lib/orgInfo.js) to the organisation block in index.html,
// so Google and AI assistants know those pages are the same organisation. Empty links are skipped.
function addSocialLinks() {
    const el = document.getElementById('org-jsonld')
    const links = Object.values(ORG.social || {}).filter((u) => /^https?:\/\//.test(u || ''))
    if (!el || !links.length || el.dataset.social) return
    try {
        const data = JSON.parse(el.textContent)
        data.sameAs = links
        el.textContent = JSON.stringify(data)
        el.dataset.social = '1'
    } catch { /* leave it as it is */ }
}

// Put once in App.jsx. Sets the title and description for every ordinary page.
export default function RouteSeo() {
    const { pathname } = useLocation()
    const { t, i18n: { language } } = useTranslation()

    useEffect(() => {
        document.documentElement.lang = language
        addOrganisation()
        addSocialLinks()
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
