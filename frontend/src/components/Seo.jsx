import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BANDS } from './bands.js'
import { applySeo } from '../lib/seo.js'
import { ORG } from '../lib/orgInfo.js'

// Search engines (Google, Bing) read the page title, description and links set here.
// Every page gets these automatically; pages with their own content (one news item, one event,
// one leader, one state) set their own with useSeo().

// Pages that should never show up in search results
const PRIVATE = /^\/(admin|receipt|card|certificate|unsubscribe|membership\/update)(\/|$)/

// Pages that set their own title once their content has loaded
const OWN_SEO = /^\/(news|events|inspirations|leadership\/states)\/[^/]+$/

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
