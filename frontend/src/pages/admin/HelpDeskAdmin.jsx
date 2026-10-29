import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import { CATEGORIES, STATUS, categoryOf } from '../../data/helpdesk.js'
import { stateByCode } from '../../data/states.js'

const TABS = [['new', '🆕 New'], ['in_progress', '🔄 In progress'], ['resolved', '✅ Resolved'], ['closed', '📁 Closed'], ['', 'All']]
const STALE_DAYS = 3 // an open case with no update for this long gets a warning
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const day = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' })
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const ROLE = { superadmin: 'Super admin', membership: 'Membership', stateadmin: 'State admin' }

// When the person last heard from us: the newest line in their timeline (older cases: when the case last changed)
const lastUpdate = (c) => new Date(c.history?.at(-1)?.at || c.updatedAt || c.createdAt)
const daysSince = (d) => Math.floor((Date.now() - d.getTime()) / 86400000)

// A ready-made WhatsApp message telling the person where their complaint is
function whatsappUpdate(c) {
    const st = STATUS[c.status]
    const note = c.publicNote ? `\n\n💬 ${c.publicNote}` : ''
    const text = `जय भीम ${c.name} 🙏\nआपकी शिकायत ${c.refNo} की स्थिति: ${st?.emoji} ${st?.hi}\nYour complaint ${c.refNo}: ${st?.en}${note}\n\nप्रगति देखें / Track: ${window.location.origin}/help\n— भीम आर्मी ब्लू पैंथर`
    return `https://wa.me/91${String(c.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
}

// One case with its update box
function Case({ c, team, canDelete, onSaved, onDelete }) {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(c.status)
    const [message, setMessage] = useState('')
    const [note, setNote] = useState('')
    const [assignee, setAssignee] = useState(c.assignedTo?.adminId || '')
    const [urgent, setUrgent] = useState(!!c.urgent)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const cat = categoryOf(c.category)
    const st = STATUS[c.status]
    const photos = [c.photo, ...(c.photos || [])].filter((p) => p?.url)
    const open_ = ['new', 'in_progress'].includes(c.status)
    const quiet = open_ ? daysSince(lastUpdate(c)) : 0
    const stale = quiet >= STALE_DAYS

    async function save() {
        setBusy(true)
        setError('')
        try {
            const body = { status, note, urgent, assignedTo: assignee }
            if (message.trim()) body.publicNote = message.trim()
            const updated = await api.patch(`/helpdesk/${c._id}`, body)
            setMessage('')
            setNote('')
            setOpen(false)
            onSaved(updated, status !== c.status || !!message.trim())
        } catch (e) {
            setError(e.message)
        } finally {
            setBusy(false)
        }
    }

    const border = c.urgent ? 'border-l-4 border-l-red-600' : stale ? 'border-l-4 border-l-amber-500' : c.category === 'atrocity' && c.status === 'new' ? 'border-l-4 border-l-red-400' : ''

    return (
        <li className={`card p-4 sm:p-5 ${border}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-brand">{c.refNo}</span>
                        <Pill tone={st?.tone}>{st?.emoji} {st?.en}</Pill>
                        {c.urgent && <Pill tone="red">🔴 Urgent</Pill>}
                        {stale && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">⏰ No update for {quiet} days</span>}
                    </div>
                    <h3 className="mt-1 text-lg font-bold">{cat.emoji} {cat.en}</h3>
                </div>
                <span className="text-xs text-navy/55">🕒 {when(c.createdAt)}</span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-navy/70">
                <span>👤 {c.name}</span>
                <a href={`tel:${c.phone}`} className="hover:text-brand hover:underline">📞 {c.phone}</a>
                {c.email && <a href={`mailto:${c.email}`} className="break-all hover:text-brand hover:underline">✉️ {c.email}</a>}
                <span>📍 {[c.village, c.district, stateByCode(c.stateCode)?.en || c.state].filter(Boolean).join(', ')}</span>
                {c.policeStation && <span>👮 PS {c.policeStation}</span>}
                {c.incidentDate && <span>📅 Happened {new Date(c.incidentDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</span>}
            </div>
            <p className="mt-2 text-sm">
                {c.assignedTo?.name
                    ? <span className="rounded-full bg-mist px-2.5 py-0.5 font-semibold text-brand">🙋 Handled by {c.assignedTo.name}</span>
                    : <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-semibold text-navy/70">🙋 Not given to anyone yet</span>}
            </p>

            {c.description && <p className="mt-3 rounded-xl bg-mist/40 px-3 py-2 whitespace-pre-line text-navy/90">{c.description}</p>}
            {c.voice?.url && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50/50 p-2.5">
                    <p className="mb-1 text-xs font-bold text-red-800">🎤 Voice message{c.voice.seconds ? ` (${clock(c.voice.seconds)})` : ''}</p>
                    <audio controls preload="none" src={c.voice.url} className="w-full" />
                </div>
            )}
            {photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                        <a key={p.url} href={p.url} target="_blank" rel="noreferrer">
                            <img src={p.url} alt={`Photo ${i + 1} sent with the complaint`} className="h-24 w-24 rounded-lg object-cover ring-1 ring-brand/10" />
                        </a>
                    ))}
                </div>
            )}

            {/* What the person sees when they track it */}
            {c.history?.length > 1 && (
                <details className="mt-3 rounded-xl border border-brand/10 bg-white px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-semibold text-brand">🕒 Updates the person can see ({c.history.length})</summary>
                    <ol className="mt-2 space-y-1.5">
                        {[...c.history].reverse().map((h, i) => (
                            <li key={i} className="border-l-2 border-brand/20 pl-3">
                                <span className="text-xs text-navy/55">{day(h.at)}</span> · <b>{STATUS[h.status]?.emoji} {STATUS[h.status]?.en}</b>
                                {h.note && <div className="text-navy/80">💬 {h.note}</div>}
                            </li>
                        ))}
                    </ol>
                </details>
            )}
            {(!c.history || c.history.length <= 1) && c.publicNote && (
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
                    <label className="flex flex-col gap-1 text-sm font-semibold">🙋 Handled by
                        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input min-h-10 py-2">
                            <option value="">— Nobody yet —</option>
                            {team.map((a) => (
                                <option key={a._id} value={a._id} disabled={a.role === 'stateadmin' && a.state !== c.stateCode}>
                                    {a.name} ({ROLE[a.role] || a.role}{a.state ? ` – ${stateByCode(a.state)?.en || a.state}` : ''})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex min-h-10 items-center gap-2 text-sm font-semibold sm:col-span-2">
                        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-5 w-5 accent-red-600" />
                        🔴 Urgent (shows at the top of the list)
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">💬 New message for the person (added to the updates they see)
                        <textarea rows="2" value={message} onChange={(e) => setMessage(e.target.value)} maxLength="1000"
                            placeholder="e.g. Our district team spoke to the police station today." className="input py-2" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">🗒️ Team note (only staff see this)
                        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength="2000" placeholder="e.g. Called them, lawyer assigned" className="input min-h-10 py-2" />
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
                    <a href={whatsappUpdate(c)} target="_blank" rel="noreferrer" className="abtn min-h-9 border-green-300 px-3 text-green-800 hover:border-green-500 hover:text-green-900">📲 WhatsApp update</a>
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
    const [mine, setMine] = useState(false)
    const [urgentOnly, setUrgentOnly] = useState(false)
    const [district, setDistrict] = useState('')
    const [items, setItems] = useState(null)
    const [team, setTeam] = useState([])
    const [saved, setSaved] = useState(null) // the case just updated, to offer a WhatsApp message
    const [error, setError] = useState('')
    const myState = me.role === 'stateadmin' ? stateByCode(me.state) : null

    const load = () => {
        const p = new URLSearchParams()
        if (status) p.set('status', status)
        if (category) p.set('category', category)
        if (mine) p.set('mine', '1')
        if (urgentOnly) p.set('urgent', '1')
        return api.get(`/helpdesk?${p}`).then(setItems).catch((e) => setError(e.message))
    }
    useEffect(() => { setItems(null); load() }, [status, category, mine, urgentOnly])
    useEffect(() => { api.get('/helpdesk/team').then(setTeam).catch(() => setTeam([])) }, [])

    async function remove(c) {
        if (!window.confirm(`Delete case ${c.refNo} completely? This cannot be undone.`)) return
        try { await api.del(`/helpdesk/${c._id}`); await load(); refresh() } catch (e) { setError(e.message) }
    }

    // Districts of the cases loaded, to show one district's cases
    const districts = [...new Set((items || []).map((c) => c.district).filter(Boolean))].sort()
    const shown = district ? items?.filter((c) => c.district === district) : items
    const staleCount = shown?.filter((c) => ['new', 'in_progress'].includes(c.status) && daysSince(lastUpdate(c)) >= STALE_DAYS).length || 0
    const toggle = (on) => `min-h-10 rounded-xl border px-3 text-sm font-semibold transition ${on ? 'border-brand bg-brand text-white' : 'border-brand/15 bg-white text-navy/75 hover:bg-mist'}`

    return (
        <>
            <PageHeader title="Help desk" subtitle="Problems reported by people through the Help desk page." />
            {myState && <p className="mb-4 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-brand">📍 You are seeing only cases from {myState.en}.</p>}

            <div className="mb-3 flex flex-wrap items-center gap-2">
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
                {districts.length > 0 && (
                    <select aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)} className="input min-h-10 w-auto py-2 text-sm">
                        <option value="">🏘️ All districts</option>
                        {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                )}
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
                <button onClick={() => setMine((v) => !v)} aria-pressed={mine} className={toggle(mine)}>🙋 My cases</button>
                <button onClick={() => setUrgentOnly((v) => !v)} aria-pressed={urgentOnly} className={toggle(urgentOnly)}>🔴 Urgent only</button>
            </div>

            {staleCount > 0 && (
                <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900">
                    ⏰ {staleCount} open {staleCount === 1 ? 'case has' : 'cases have'} had no update for {STALE_DAYS} days or more. They are marked in orange.
                </p>
            )}

            {/* Just saved a change the person should know about: offer to tell them (stays even if the case moved to another tab) */}
            {saved && (
                <div role="status" className="sticky top-2 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm shadow-md">
                    <span className="font-semibold text-green-800">✅ {saved.refNo} saved ({STATUS[saved.status]?.emoji} {STATUS[saved.status]?.en}). Let {saved.name} know?</span>
                    <a href={whatsappUpdate(saved)} target="_blank" rel="noreferrer" onClick={() => setSaved(null)}
                        className="abtn min-h-9 border-0 bg-[#25d366] px-3 text-white hover:bg-[#1da851] hover:text-white">📲 Send update on WhatsApp</a>
                    <button onClick={() => setSaved(null)} className="ml-auto min-h-9 px-2 text-navy/60 underline">Not now</button>
                </div>
            )}

            <Notice>{error}</Notice>
            {!items && !error && <p>Loading...</p>}
            {shown?.length === 0 && <p className="card text-center text-navy/70">📭 No cases here.</p>}
            <ul className="grid gap-4 xl:grid-cols-2">
                {shown?.map((c) => (
                    <Case key={c._id + c.updatedAt} c={c} team={team} canDelete={me.permissions.includes('admins')}
                        onSaved={(updated, tell) => { setSaved(tell ? updated : null); load(); refresh() }} onDelete={remove} />
                ))}
            </ul>
        </>
    )
}
