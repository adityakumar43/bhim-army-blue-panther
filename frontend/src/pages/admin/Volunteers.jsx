import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading, Pill, useFind, FindNote } from './ui.jsx'
import { usePaged, LoadMore } from './paged.jsx'
import { SKILLS, AVAILABILITY, skillOf } from '../../data/volunteers.js'
import { stateByCode } from '../../data/states.js'
import { toCsv } from '../../lib/csv.js'

const TABS = [['new', '🆕 New'], ['contacted', '📞 Contacted'], ['active', '✅ Active'], ['inactive', '💤 Inactive'], ['', 'All']]
const STATUS_TONE = { new: 'gold', contacted: 'blue', active: 'green', inactive: 'gray' }
const availLabel = (k) => AVAILABILITY.find((a) => a.key === k)?.en || k

function downloadCsv(rows) {
    const head = ['Name', 'Phone', 'Email', 'State', 'District', 'Can help with', 'Free', 'Status', 'Message', 'Team note', 'Signed up']
    const lines = rows.map((v) => [v.name, v.phone, v.email, v.state, v.district, v.skills.map((s) => skillOf(s)?.en || s).join('; '),
    availLabel(v.availability), v.status, v.message, v.note, new Date(v.createdAt).toLocaleDateString('en-IN')])
    const csv = toCsv([head, ...lines])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'volunteers.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// Details sent again with this volunteer's number. Anyone can type any number, so the team checks with the person first.
const PENDING_FIELDS = [['name', 'Name'], ['email', 'Email'], ['state', 'State'], ['district', 'District'], ['skills', 'Can help with'], ['availability', 'Free'], ['message', 'Message']]
const valueOf = (k, x) => (k === 'skills' ? (x || []).map((s) => skillOf(s)?.en || s).join(', ') : k === 'availability' ? availLabel(x) : x || '—')
function PendingDetails({ v, viewOnly, onPick }) {
    const changes = PENDING_FIELDS.filter(([k]) => valueOf(k, v[k]) !== valueOf(k, v.pendingUpdate[k]))
    return (
        <div className="mt-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
            <p className="font-semibold text-navy">📝 New details were sent with this number on {new Date(v.pendingUpdate.at).toLocaleDateString('en-IN')}.</p>
            <p className="text-xs text-navy/65">Anyone can type someone else's number, so check with {v.name} before using them.</p>
            {changes.length ? (
                <ul className="mt-1.5 space-y-0.5 text-xs">
                    {changes.map(([k, label]) => <li key={k}><b>{label}:</b> {valueOf(k, v[k])} → <b>{valueOf(k, v.pendingUpdate[k])}</b></li>)}
                </ul>
            ) : <p className="mt-1 text-xs text-navy/65">Nothing is different from the saved details.</p>}
            {!viewOnly && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {changes.length > 0 && <button onClick={() => onPick('accept')} className="abtn min-h-8 px-3 text-xs">✅ Use the new details</button>}
                    <button onClick={() => onPick('ignore')} className="abtn min-h-8 px-3 text-xs">✖️ Ignore</button>
                </div>
            )}
        </div>
    )
}

export default function Volunteers() {
    const { me, refresh } = useOutletContext()
    const [status, setStatus] = useState('new')
    const [skill, setSkill] = useState('')
    const [q, setQ] = useState('')
    // Opened from the search box at the top: show that tab and fill in the search
    const { find, status: wantStatus, clear: clearFind } = useFind()
    useEffect(() => {
        if (wantStatus && TABS.some(([k]) => k === wantStatus)) setStatus(wantStatus)
        if (find) setQ(find)
    }, [find, wantStatus])
    const [error, setError] = useState('')
    const myState = ['stateadmin', 'districtadmin'].includes(me.role) ? stateByCode(me.state) : null
    const viewOnly = me.role === 'districtadmin' // District admins can see their volunteers, not change them

    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (skill) p.set('skill', skill)
    if (find) p.set('find', find) // from the search box: the server finds them, however old
    // A page at a time, newest first; "Load more" for older ones
    const { items, more, busy, load, loadMore } = usePaged(`/volunteers?${p}`, 2000, { onError: (e) => setError(e.message) })

    // Search by name, phone or place
    const shown = useMemo(() => {
        const text = q.trim().toLowerCase()
        return (items || []).filter((v) => !text || [v.name, v.phone, v.district, v.state].join(' ').toLowerCase().includes(text))
    }, [items, q])

    async function update(v, body) {
        try { await api.patch(`/volunteers/${v._id}`, body); await load(); refresh() } catch (e) { setError(e.message) }
    }
    async function remove(v) {
        if (!window.confirm(`Remove ${v.name} from volunteers?`)) return
        try { await api.del(`/volunteers/${v._id}`); await load(); refresh() } catch (e) { setError(e.message) }
    }
    async function editNote(v) {
        const note = window.prompt(`Team note for ${v.name}`, v.note || '')
        if (note !== null) update(v, { note })
    }

    return (
        <>
            <PageHeader title="Volunteers" subtitle="People who offered to help, and what they can do.">
                {shown.length > 0 && <button onClick={() => (!more || window.confirm(`Only the ${items.length} volunteers loaded so far are included. To add older ones, press "Load older volunteers" at the bottom first.\n\nDownload these ${shown.length}?`)) && downloadCsv(shown)} className="abtn">📥 Download Excel ({shown.length})</button>}
            </PageHeader>
            {myState && <p className="mb-4 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-brand">📍 You are seeing only volunteers from {me.district ? `${me.district} district, ` : ''}{myState.en}.</p>}

            <div role="group" aria-label="Filter by status" className="mb-3 flex flex-wrap gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm sm:inline-flex">
                {TABS.map(([key, label]) => (
                    <button key={key || 'all'} onClick={() => setStatus(key)} aria-pressed={status === key}
                        className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${status === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
                ))}
            </div>
            <div className="card mb-5 flex flex-wrap gap-2 p-3 sm:p-3">
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search name, phone or district" className="input min-h-10 min-w-60 flex-[2] py-2" />
                <select aria-label="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="input min-h-10 min-w-48 flex-1 py-2">
                    <option value="">🧰 Any skill</option>
                    {SKILLS.map((s) => <option key={s.key} value={s.key}>{s.emoji} {s.en}</option>)}
                </select>
            </div>

            <FindNote find={find} clear={() => { setQ(''); clearFind() }} />
            <Notice>{error}</Notice>
            {!items && !error && <ListLoading />}
            {items && shown.length === 0 && <p className="card text-center text-navy/70">📭 No volunteers here.</p>}
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shown.map((v) => (
                    <li key={v._id} className="card flex flex-col p-4 sm:p-4">
                        <div className="flex items-start gap-3">
                            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{v.name?.[0]?.toUpperCase()}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span className="font-bold">{v.name}</span>
                                    <Pill tone={STATUS_TONE[v.status]}>{v.status}</Pill>
                                </div>
                                <div className="text-sm text-navy/65">📍 {[v.district, v.state].filter(Boolean).join(', ')}</div>
                                <div className="text-xs text-navy/55">🕒 {availLabel(v.availability)}</div>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                            {v.skills.map((s) => <span key={s} className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-brand">{skillOf(s)?.emoji} {skillOf(s)?.en}</span>)}
                        </div>
                        {v.message && <p className="mt-2 rounded-lg bg-gold/10 px-3 py-1.5 text-sm text-navy/80">💬 {v.message}</p>}
                        {v.note && <p className="mt-2 rounded-lg bg-mist/60 px-3 py-1.5 text-sm text-navy/80">🗒️ {v.note}</p>}
                        {v.pendingUpdate?.at && <PendingDetails v={v} viewOnly={viewOnly} onPick={(pending) => update(v, { pending })} />}
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                            <a href={`tel:${v.phone}`} className="abtn min-h-9 px-3">📞</a>
                            <a href={`https://wa.me/91${v.phone}?text=${encodeURIComponent(`Jai Bhim ${v.name}, thank you for volunteering with Bhim Army Blue Panther!`)}`}
                                target="_blank" rel="noreferrer" className="abtn min-h-9 border-green-300 px-3 text-green-800">💬</a>
                            {!viewOnly && <>
                                <select aria-label={`Status of ${v.name}`} value={v.status} onChange={(e) => update(v, { status: e.target.value })} className="input min-h-9 w-auto flex-1 py-1 text-sm">
                                    {TABS.filter(([k]) => k).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                </select>
                                <button onClick={() => editNote(v)} aria-label="Team note" className="abtn min-h-9 px-3">🗒️</button>
                                <button onClick={() => remove(v)} aria-label={`Remove ${v.name}`} className="abtn-danger min-h-9 px-3">🗑️</button>
                            </>}
                        </div>
                    </li>
                ))}
            </ul>
            <LoadMore more={more} busy={busy} onClick={loadMore} count={items?.length} noun="volunteers" />
        </>
    )
}
