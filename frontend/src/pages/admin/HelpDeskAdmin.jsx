import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import { CATEGORIES, STATUS, categoryOf } from '../../data/helpdesk.js'
import { stateByCode } from '../../data/states.js'

const TABS = [['new', '🆕 New'], ['in_progress', '🔄 In progress'], ['resolved', '✅ Resolved'], ['closed', '📁 Closed'], ['', 'All']]
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// One case with its update box
function Case({ c, canDelete, onSaved, onDelete }) {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(c.status)
    const [publicNote, setPublicNote] = useState(c.publicNote || '')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const cat = categoryOf(c.category)
    const st = STATUS[c.status]

    async function save() {
        setBusy(true)
        setError('')
        try {
            await api.patch(`/helpdesk/${c._id}`, { status, publicNote, note })
            setNote('')
            setOpen(false)
            onSaved()
        } catch (e) {
            setError(e.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <li className={`card p-4 sm:p-5 ${c.category === 'atrocity' && c.status === 'new' ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-brand">{c.refNo}</span>
                        <Pill tone={st?.tone}>{st?.emoji} {st?.en}</Pill>
                    </div>
                    <h3 className="mt-1 text-lg font-bold">{cat.emoji} {cat.en}</h3>
                </div>
                <span className="text-xs text-navy/55">🕒 {when(c.createdAt)}</span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-navy/70">
                <span>👤 {c.name}</span>
                <a href={`tel:${c.phone}`} className="hover:text-brand hover:underline">📞 {c.phone}</a>
                {c.email && <a href={`mailto:${c.email}`} className="break-all hover:text-brand hover:underline">✉️ {c.email}</a>}
                <span>📍 {[c.district, stateByCode(c.stateCode)?.en || c.state].filter(Boolean).join(', ')}</span>
                {c.incidentDate && <span>📅 Happened {new Date(c.incidentDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</span>}
            </div>

            <p className="mt-3 rounded-xl bg-mist/40 px-3 py-2 whitespace-pre-line text-navy/90">{c.description}</p>
            {c.photo?.url && (
                <a href={c.photo.url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <img src={c.photo.url} alt="Photo sent with the complaint" className="h-24 rounded-lg object-cover ring-1 ring-brand/10" />
                </a>
            )}

            {c.publicNote && (
                <p className="mt-2 rounded-xl border-l-4 border-brand bg-white px-3 py-2 text-sm"><b className="text-brand">💬 Shown to the person:</b> {c.publicNote}</p>
            )}
            {c.notes?.length > 0 && (
                <ul className="mt-2 space-y-1">
                    {c.notes.map((n, i) => (
                        <li key={i} className="rounded-lg bg-gold/10 px-3 py-1.5 text-sm">
                            <span className="text-xs font-semibold text-navy/60">🗒️ {n.byName} · {when(n.at)}</span><br />{n.text}
                        </li>
                    ))}
                </ul>
            )}

            {open ? (
                <div className="mt-3 grid gap-3 rounded-xl bg-white p-3 ring-2 ring-brand/20 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-semibold">Status
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input min-h-10 py-2">
                            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.emoji} {s.en}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold">🗒️ Team note (only staff see this)
                        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength="2000" placeholder="e.g. Called them, lawyer assigned" className="input min-h-10 py-2" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">💬 Message the person sees when they track it
                        <textarea rows="2" value={publicNote} onChange={(e) => setPublicNote(e.target.value)} maxLength="1000" className="input py-2" />
                    </label>
                    {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
                    <div className="flex justify-end gap-2 sm:col-span-2">
                        <button onClick={() => setOpen(false)} className="abtn min-h-9 px-3">Cancel</button>
                        <button onClick={save} disabled={busy} className="abtn-primary min-h-9 px-4">{busy ? 'Saving...' : '💾 Save update'}</button>
                    </div>
                </div>
            ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setOpen(true)} className="abtn-primary min-h-9 px-3">✏️ Update case</button>
                    <a href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(`Jai Bhim ${c.name}, this is Bhim Army Blue Panther about your complaint ${c.refNo}.`)}`}
                        target="_blank" rel="noreferrer" className="abtn min-h-9 border-green-300 px-3 text-green-800">💬 WhatsApp</a>
                    {canDelete && <button onClick={() => onDelete(c)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>}
                </div>
            )}
        </li>
    )
}

export default function HelpDeskAdmin() {
    const { me, refresh } = useOutletContext()
    const [status, setStatus] = useState('new')
    const [category, setCategory] = useState('')
    const [items, setItems] = useState(null)
    const [error, setError] = useState('')
    const myState = me.role === 'stateadmin' ? stateByCode(me.state) : null

    const load = () => {
        const p = new URLSearchParams()
        if (status) p.set('status', status)
        if (category) p.set('category', category)
        return api.get(`/helpdesk?${p}`).then(setItems).catch((e) => setError(e.message))
    }
    useEffect(() => { setItems(null); load() }, [status, category])

    async function remove(c) {
        if (!window.confirm(`Delete case ${c.refNo} completely? This cannot be undone.`)) return
        try { await api.del(`/helpdesk/${c._id}`); await load(); refresh() } catch (e) { setError(e.message) }
    }

    return (
        <>
            <PageHeader title="Help desk" subtitle="Problems reported by people through the Help desk page." />
            {myState && <p className="mb-4 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-brand">📍 You are seeing only cases from {myState.en}.</p>}

            <div className="mb-5 flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm">
                    {TABS.map(([key, label]) => (
                        <button key={key || 'all'} onClick={() => setStatus(key)} aria-pressed={status === key}
                            className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${status === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
                    ))}
                </div>
                <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="input min-h-10 w-auto py-2 text-sm">
                    <option value="">📂 All types</option>
                    {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.en}</option>)}
                </select>
            </div>

            <Notice>{error}</Notice>
            {!items && !error && <p>Loading...</p>}
            {items?.length === 0 && <p className="card text-center text-navy/70">📭 No cases here.</p>}
            <ul className="grid gap-4 xl:grid-cols-2">
                {items?.map((c) => <Case key={c._id + c.updatedAt} c={c} canDelete={me.permissions.includes('admins')} onSaved={() => { load(); refresh() }} onDelete={remove} />)}
            </ul>
        </>
    )
}
