import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import Icon from '../../components/Icon.jsx'
import BoxIcon from '../../components/BoxIcon.jsx'

// What each kind of result is called, its icon and colours
const KINDS = {
    page: ['Pages', 'grid', 'bg-mist text-brand'],
    member: ['Members', 'userPlus', 'bg-blue-100 text-blue-700'],
    case: ['Help desk cases', 'help', 'bg-red-100 text-red-700'],
    volunteer: ['Volunteers', 'hand', 'bg-green-100 text-green-700'],
    message: ['Messages', 'chat', 'bg-amber-100 text-amber-700'],
    donation: ['Donations', 'rupee', 'bg-rose-100 text-rose-700'],
    news: ['News', 'news', 'bg-sky-100 text-sky-700'],
    event: ['Events', 'calendar', 'bg-purple-100 text-purple-700'],
}
const STATUS = {
    pending: 'Waiting', approved: 'Approved', rejected: 'Not approved', cancelled: 'Ended',
    new: 'New', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed',
    contacted: 'Contacted', active: 'Active', inactive: 'Inactive', unread: 'Unread', read: 'Read',
}

// The search button in the header: a box on computers, an icon on phones. Ctrl+K (or /) opens it too.
export function SearchButton({ onOpen }) {
    useEffect(() => {
        const key = (e) => {
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
            if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); onOpen() }
        }
        document.addEventListener('keydown', key)
        return () => document.removeEventListener('keydown', key)
    }, [onOpen])
    return (
        <button type="button" onClick={onOpen} aria-label="Search" title="Search (Ctrl+K)"
            className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-white/85 hover:bg-white/10 hover:text-white lg:w-64 lg:border lg:border-white/20 lg:bg-white/10 lg:px-3 lg:text-sm lg:text-white/70 xl:w-96 2xl:w-[28rem]">
            <Icon name="search" size={18} />
            <span className="hidden flex-1 truncate text-left lg:inline">Search members, cases…</span>
            <kbd className="hidden rounded border border-white/25 px-1.5 text-[11px] whitespace-nowrap text-white/60 xl:inline">Ctrl K</kbd>
        </button>
    )
}

// The search window: type a name, phone, member number, case number or receipt number
export default function AdminSearch({ pages, onClose }) {
    const navigate = useNavigate()
    const input = useRef(null)
    const [q, setQ] = useState('')
    const [found, setFound] = useState(null) // results from the server, or null while typing
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [active, setActive] = useState(0)

    useEffect(() => {
        input.current?.focus()
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // Ask the server a moment after the person stops typing
    useEffect(() => {
        const text = q.trim()
        setActive(0); setError('')
        if (text.length < 2) { setFound(null); setBusy(false); return }
        setBusy(true)
        let stale = false
        const timer = setTimeout(() => {
            api.get(`/search?q=${encodeURIComponent(text)}`)
                .then((r) => { if (!stale) setFound(r) })
                .catch((e) => { if (!stale) { setError(e.message); setFound([]) } })
                .finally(() => { if (!stale) setBusy(false) })
        }, 250)
        return () => { stale = true; clearTimeout(timer) }
    }, [q])

    // Pages of the admin panel whose name matches, so "help" also offers the Help Desk page
    const text = q.trim().toLowerCase()
    const pageHits = text ? pages.filter((p) => p.label.toLowerCase().includes(text)).slice(0, 4)
        .map((p) => ({ kind: 'page', id: p.to, title: p.label, sub: 'Open this page', link: p.to, icon: p.icon })) : []
    const results = [...pageHits, ...(found || [])]

    const go = (r) => { onClose(); navigate(r.link) }
    function keys(e) {
        if (e.key === 'Escape') onClose()
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
        else if (e.key === 'Enter' && results[active]) go(results[active])
    }
    // Keep the chosen result in view while moving with the arrow keys
    useEffect(() => { document.getElementById(`search-hit-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [active])

    // Group the results by kind, keeping their order for the arrow keys
    const groups = []
    results.forEach((r, i) => {
        const last = groups.at(-1)
        if (last?.kind === r.kind) last.rows.push([r, i])
        else groups.push({ kind: r.kind, rows: [[r, i]] })
    })

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-0 sm:p-6 sm:pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search the admin panel">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
            <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[75vh] sm:max-w-2xl sm:rounded-2xl">
                <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-3">
                    <Icon name="search" size={20} className="shrink-0 text-brand" />
                    <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={keys}
                        role="combobox" aria-expanded={results.length > 0} aria-controls="search-results" aria-activedescendant={results.length ? `search-hit-${active}` : undefined}
                        placeholder="Name, phone, member no., case no. or receipt no." className="min-h-11 flex-1 bg-transparent text-lg outline-none placeholder:text-navy/40" />
                    {busy && <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />}
                    <button type="button" onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-navy/60 hover:bg-mist">Esc</button>
                </div>

                <div id="search-results" role="listbox" className="flex-1 overflow-y-auto overscroll-contain p-2">
                    {text.length < 2 && (
                        <div className="px-4 py-8 text-center text-navy/60">
                            <p className="font-semibold text-navy/80">Find anything in the admin panel</p>
                            <p className="mt-1 text-sm">Try a name like <b>Ravi</b>, a phone number, <b>BBP-00012</b>, a case number like <b>HD-2026-0042</b> or a receipt number.</p>
                        </div>
                    )}
                    {error && <p role="alert" className="m-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    {text.length >= 2 && !busy && found && results.length === 0 && !error && (
                        <p className="px-4 py-8 text-center text-navy/60">Nothing found for “{q.trim()}”.</p>
                    )}
                    {groups.map((g) => (
                        <section key={g.kind + g.rows[0][1]} className="mb-1">
                            <h3 className="px-3 pt-2 pb-1 text-xs font-bold tracking-wide text-navy/50 uppercase">{KINDS[g.kind]?.[0] || g.kind}</h3>
                            <ul>
                                {g.rows.map(([r, i]) => (
                                    <li key={`${r.kind}-${r.id}`} id={`search-hit-${i}`} role="option" aria-selected={i === active}>
                                        <button type="button" onClick={() => go(r)} onMouseMove={() => setActive(i)}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === active ? 'bg-mist' : ''}`}>
                                            {r.photo
                                                ? <img src={r.photo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                                                : <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${KINDS[r.kind]?.[2] || 'bg-mist text-brand'}`}>
                                                    {r.kind === 'page' ? <Icon name={r.icon} size={18} /> : <BoxIcon name={KINDS[r.kind]?.[1] || 'search'} size={19} />}
                                                </span>}
                                            <span className="min-w-0 flex-1">
                                                <b className="block truncate">{r.title}</b>
                                                <span className="block truncate text-sm text-navy/60">{r.sub}</span>
                                            </span>
                                            {r.urgent && <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">Urgent</span>}
                                            {r.status && <span className="shrink-0 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-semibold text-navy/70">{STATUS[r.status] || r.status}</span>}
                                            {i === active && <Icon name="arrow" size={16} className="hidden shrink-0 text-brand sm:block" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
                <p className="hidden border-t border-navy/10 px-4 py-2 text-xs text-navy/50 sm:block">↑ ↓ to move · Enter to open · Esc to close</p>
            </div>
        </div>,
        document.body,
    )
}
