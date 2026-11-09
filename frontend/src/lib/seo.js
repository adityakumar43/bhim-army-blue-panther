import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n.js'

// Page title, description and links for search engines and link previews, used by RouteSeo (components/Seo.jsx)
// for ordinary pages and by pages with their own content (one news item, one event, one leader, one state).

const DEFAULT_IMAGE = '/og-default.jpg'

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
