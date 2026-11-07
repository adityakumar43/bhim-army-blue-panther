import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { STATES, stateByCode } from '../../data/states.js'
import DistrictSelect from '../../components/DistrictSelect.jsx'
import Icon from '../../components/Icon.jsx'
import { PageHeader, Notice, ListLoading, Pill } from './ui.jsx'
import { toCsv } from '../../lib/csv.js'

const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))
const EMPTY = { questionHi: '', questionEn: '', options: [{ textHi: '', textEn: '' }, { textHi: '', textEn: '' }], stateCode: '', district: '', closesAt: '', showResults: true }
const q = (p) => p.questionEn || p.questionHi
const answer = (o) => [o.textHi, o.textEn].filter(Boolean).join(' / ')
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const areaOf = (p) => (p.district ? `${p.district}, ${stateByCode(p.stateCode)?.en}` : p.stateCode ? stateByCode(p.stateCode)?.en || p.stateCode : 'All India')

// Bars for one poll's answers
function Bars({ poll, counts, total }) {
    const max = Math.max(1, ...counts)
    return (
        <ul className="flex flex-col gap-2">
            {poll.options.map((o, i) => {
                const pct = total ? Math.round((counts[i] / total) * 100) : 0
                return (
                    <li key={i}>
                        <div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-semibold">{answer(o)}</span><span><b>{counts[i]}</b> <span className="text-navy/50">({pct}%)</span></span></div>
                        <div className="h-3 overflow-hidden rounded-full bg-navy/10"><div className={`h-full rounded-full ${counts[i] === max && counts[i] ? 'bg-brand' : 'bg-brand/45'}`} style={{ width: `${pct}%` }} /></div>
                    </li>
                )
            })}
        </ul>
    )
}

// Pop-up with a poll's results: overall, and by state or district, with Excel download
function ResultsDialog({ id, onClose }) {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [by, setBy] = useState('byState')
    useEffect(() => { api.get(`/polls/admin/${id}`).then(setData).catch((e) => setError(e.message)) }, [id])
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', esc)
        return () => window.removeEventListener('keydown', esc)
    }, [onClose])

    function downloadCsv() {
        const head = ['Place', 'Total', ...data.poll.options.map(answer)]
        const rows = [head, ['All', data.total, ...data.counts], ...data[by].map((r) => [r.key, r.total, ...r.counts])]
        const csv = toCsv(rows)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
        a.download = `poll-results-${by === 'byState' ? 'by-state' : 'by-district'}.csv`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }

    return (
        <div role="dialog" aria-modal="true" aria-label="Poll results" className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose}>
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-brand/10 p-5">
                    <div className="min-w-0">
                        <h2 className="text-lg leading-snug font-extrabold">{data ? q(data.poll) : 'Results'}</h2>
                        {data && <p className="text-sm text-navy/65">📍 {areaOf(data.poll)} · 🗳️ {data.total} answers</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                        {data?.total > 0 && <button onClick={downloadCsv} className="abtn min-h-9 px-3">📥 Excel</button>}
                        <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-mist"><Icon name="close" size={18} /></button>
                    </div>
                </div>
                <div className="overflow-y-auto p-5">
                    <Notice>{error}</Notice>
                    {!data && !error && <ListLoading />}
                    {data && (
                        <>
                            <Bars poll={data.poll} counts={data.counts} total={data.total} />
                            {data.total > 0 && (
                                <>
                                    <div role="tablist" className="mt-6 mb-3 inline-flex gap-1 rounded-xl bg-mist p-1">
                                        {[['byState', 'By state'], ['byDistrict', 'By district']].map(([k, label]) => (
                                            <button key={k} role="tab" aria-selected={by === k} onClick={() => setBy(k)}
                                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${by === k ? 'bg-white text-brand shadow-sm' : 'text-navy/65'}`}>{label}</button>
                                        ))}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[28rem] text-sm">
                                            <thead><tr className="border-b border-navy/10 text-left text-navy/60">
                                                <th className="py-2 pr-3">Place</th><th className="py-2 pr-3 text-right">Answers</th>
                                                {data.poll.options.map((o, i) => <th key={i} className="max-w-32 truncate py-2 pr-3 text-right" title={answer(o)}>{o.textEn || o.textHi}</th>)}
                                            </tr></thead>
                                            <tbody>
                                                {data[by].map((r) => (
                                                    <tr key={r.key} className="border-b border-navy/5">
                                                        <td className="py-2 pr-3 font-semibold">{r.key}</td>
                                                        <td className="py-2 pr-3 text-right">{r.total}</td>
                                                        {r.counts.map((n, i) => <td key={i} className="py-2 pr-3 text-right">{n} <span className="text-xs text-navy/45">{r.total ? Math.round((n / r.total) * 100) : 0}%</span></td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Ask members a question and see what they answer
export default function Polls() {
    const { me } = useOutletContext()
    const myState = me.role === 'stateadmin' ? me.state : ''
    const [items, setItems] = useState(null)
    const [form, setForm] = useState(null) // the new poll being written, or null
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [open, setOpen] = useState(null) // poll whose results are shown

    const load = () => api.get('/polls/admin').then(setItems).catch((e) => setError(e.message))
    useEffect(() => { load() }, [])

    const start = () => { setForm({ ...EMPTY, stateCode: myState }); setNote(''); setError('') }
    const set = (f) => (e) => setForm((old) => ({ ...old, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    const setOption = (i, f, v) => setForm((old) => ({ ...old, options: old.options.map((o, j) => (j === i ? { ...o, [f]: v } : o)) }))

    async function create(e) {
        e.preventDefault()
        setBusy(true); setError('')
        try {
            await api.post('/polls/admin', { ...form, closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : '' })
            setForm(null)
            setNote('Poll published. Members can answer it on the website at /polls. Share the link in WhatsApp groups, or send a phone notification.')
            await load()
        } catch (err) { setError(err.message) } finally { setBusy(false) }
    }

    async function toggle(p) {
        if (p.open && !window.confirm('Close this poll? Members will not be able to answer any more.')) return
        try { await api.patch(`/polls/admin/${p._id}`, { closed: p.open }); await load() } catch (e) { setError(e.message) }
    }
    async function remove(p) {
        if (!window.confirm(`Delete the poll "${q(p)}" and all its answers? This cannot be undone.`)) return
        try { await api.del(`/polls/admin/${p._id}`); await load() } catch (e) { setError(e.message) }
    }
    function copyLink() {
        navigator.clipboard?.writeText(`${window.location.origin}/polls`).then(() => setNote('Link copied: paste it in WhatsApp.')).catch(() => { })
    }

    return (
        <>
            <PageHeader title="Polls" subtitle={myState ? `Ask the members of ${stateByCode(myState)?.en} a question.` : 'Ask members a question. They answer on the website with their member number and mobile number.'}>
                <button onClick={copyLink} className="abtn">🔗 Copy link</button>
                {!form && <button onClick={start} className="abtn-primary">➕ New poll</button>}
            </PageHeader>
            <Notice>{error}</Notice>
            <Notice kind="success">{note}</Notice>

            {form && (
                <form onSubmit={create} className="card mb-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">➕ New poll</h2>
                        <button type="button" onClick={() => setForm(null)} aria-label="Cancel" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-mist"><Icon name="close" size={18} /></button></div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 font-semibold">Question in Hindi
                            <input value={form.questionHi} onChange={set('questionHi')} maxLength="300" placeholder="जैसे: अगली बड़ी रैली कहाँ होनी चाहिए?" className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold">Question in English
                            <input value={form.questionEn} onChange={set('questionEn')} maxLength="300" placeholder="e.g. Where should the next big rally be?" className="input" /></label>
                    </div>

                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-1 font-semibold">Answers to choose from <span className="text-sm font-normal text-navy/55">(2 to 6; Hindi, English or both)</span></legend>
                        {form.options.map((o, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-sm font-bold text-brand">{i + 1}</span>
                                <input value={o.textHi} onChange={(e) => setOption(i, 'textHi', e.target.value)} maxLength="120" placeholder="हिंदी में" aria-label={`Answer ${i + 1} in Hindi`} className="input min-h-10 flex-1 py-2" />
                                <input value={o.textEn} onChange={(e) => setOption(i, 'textEn', e.target.value)} maxLength="120" placeholder="In English" aria-label={`Answer ${i + 1} in English`} className="input min-h-10 flex-1 py-2" />
                                {form.options.length > 2 && (
                                    <button type="button" onClick={() => setForm((old) => ({ ...old, options: old.options.filter((_, j) => j !== i) }))} aria-label={`Remove answer ${i + 1}`}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy/40 hover:bg-red-50 hover:text-red-600"><Icon name="close" size={16} /></button>
                                )}
                            </div>
                        ))}
                        {form.options.length < 6 && (
                            <button type="button" onClick={() => setForm((old) => ({ ...old, options: [...old.options, { textHi: '', textEn: '' }] }))} className="self-start text-sm font-semibold text-brand underline">➕ Add an answer</button>
                        )}
                    </fieldset>

                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-1 font-semibold">📍 Who can answer
                            <select value={form.stateCode} onChange={(e) => setForm({ ...form, stateCode: e.target.value, district: '' })} disabled={!!myState} className="input disabled:opacity-70">
                                {!myState && <option value="">All members (All India)</option>}
                                {sortedStates.map((s) => <option key={s.code} value={s.code}>Members of {s.en}</option>)}
                            </select>
                        </label>
                        {form.stateCode && (
                            <label className="flex flex-col gap-1 font-semibold">🏘️ District <span className="text-xs font-normal text-navy/55">(optional)</span>
                                <DistrictSelect stateCode={form.stateCode} value={form.district} onChange={(d) => setForm({ ...form, district: d })} english />
                            </label>
                        )}
                        <label className="flex flex-col gap-1 font-semibold">⏳ Closes on <span className="text-xs font-normal text-navy/55">(optional)</span>
                            <input type="datetime-local" value={form.closesAt} onChange={set('closesAt')} className="input" /></label>
                    </div>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={form.showResults} onChange={set('showResults')} className="h-4 w-4 accent-brand" />
                        Show members the results after they answer</label>
                    <div className="flex gap-2"><button disabled={busy} className="abtn-primary">{busy ? 'Publishing…' : '✅ Publish poll'}</button>
                        <button type="button" onClick={() => setForm(null)} className="abtn">Cancel</button></div>
                </form>
            )}

            {!items && !error && <ListLoading />}
            {items?.length === 0 && !form && <p className="card text-center text-navy/70">🗳️ No polls yet. Press <b>New poll</b> to ask members a question.</p>}
            <ul className="grid gap-4 xl:grid-cols-2">
                {items?.map((p) => (
                    <li key={p._id} className="card flex flex-col gap-2 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <b className="min-w-0 flex-1 text-lg leading-snug">{q(p)}</b>
                            <Pill tone={p.open ? 'green' : 'red'}>{p.open ? '🟢 Open' : '⏹️ Closed'}</Pill>
                        </div>
                        {p.questionEn && p.questionHi && <p className="text-sm text-navy/60">{p.questionHi}</p>}
                        <p className="text-sm text-navy/70">📍 {areaOf(p)} · 🗳️ <b>{p.total}</b> answers{p.closesAt ? ` · ⏳ ${p.open ? 'closes' : 'closed'} ${when(p.closesAt)}` : ''}{p.showResults === false ? ' · 🙈 results hidden from members' : ''}</p>
                        <p className="text-xs text-navy/50">✍️ {p.createdByName} · {when(p.createdAt)}</p>
                        <div className="mt-auto flex flex-wrap gap-2 pt-2">
                            <button onClick={() => setOpen(p._id)} className="abtn-primary min-h-9 px-3">📊 Results</button>
                            <button onClick={() => toggle(p)} className="abtn min-h-9 px-3">{p.open ? '⏹️ Close now' : '▶️ Open again'}</button>
                            <button onClick={() => remove(p)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {open && <ResultsDialog id={open} onClose={() => setOpen(null)} />}
        </>
    )
}
