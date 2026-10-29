import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { STATES, stateByCode } from '../../data/states.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const STATUS = { sending: ['gold', '📤 Sending'], done: ['green', '✅ Sent'], stopped: ['red', '⏹️ Stopped'] }

// Email an announcement to members: everyone, one state, or one district
export default function Mailouts() {
    const { me } = useOutletContext()
    const myState = me.role === 'stateadmin' ? me.state : null
    const [state, setState] = useState(myState || '')
    const [district, setDistrict] = useState('')
    const [districts, setDistricts] = useState([])
    const [count, setCount] = useState(null)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [history, setHistory] = useState(null)
    const [busy, setBusy] = useState('')
    const [error, setError] = useState('')
    const [note, setNote] = useState('')

    const loadHistory = () => api.get('/mailouts').then(setHistory).catch((e) => setError(e.message))
    useEffect(() => { loadHistory() }, [])

    // While one is being sent, refresh its progress every few seconds
    const sending = history?.some((m) => m.status === 'sending')
    useEffect(() => {
        if (!sending) return
        const timer = setInterval(loadHistory, 3000)
        return () => clearInterval(timer)
    }, [sending])

    // The districts of the chosen state, and how many members the message will reach
    useEffect(() => {
        setDistricts([])
        if (state) api.get(`/mailouts/districts?state=${state}`).then(setDistricts).catch(() => { })
    }, [state])
    useEffect(() => {
        setCount(null)
        const q = new URLSearchParams({ state, district })
        api.get(`/mailouts/count?${q}`).then((r) => setCount(r.count)).catch(() => { })
    }, [state, district])

    const who = district ? `members in ${district} district` : state ? `members in ${stateByCode(state)?.en}` : 'all members'
    const ready = subject.trim() && body.trim().length >= 10

    async function test() {
        setBusy('test'); setError(''); setNote('')
        try {
            const r = await api.post('/mailouts/test', { subject, body })
            setNote(`Test email sent to ${r.to}. Check your inbox (and spam folder).`)
        } catch (e) { setError(e.message) } finally { setBusy('') }
    }

    async function send() {
        if (!window.confirm(`Send "${subject}" to ${count} ${who}?\n\nThis cannot be undone once the emails go out.`)) return
        setBusy('send'); setError(''); setNote('')
        try {
            await api.post('/mailouts', { subject, body, state, district })
            setNote(`Sending to ${count} ${who}. You can follow the progress below.`)
            setSubject(''); setBody('')
            await loadHistory()
        } catch (e) { setError(e.message) } finally { setBusy('') }
    }

    async function stop(m) {
        if (!window.confirm('Stop sending this announcement? Members who already got it keep it.')) return
        try { await api.post(`/mailouts/${m._id}/stop`); await loadHistory() } catch (e) { setError(e.message) }
    }

    return (
        <>
            <PageHeader title="Email members" subtitle="Send an announcement by email to all members, one state or one district." />
            <Notice>{error}</Notice>
            <Notice kind="success">{note}</Notice>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                {/* Write */}
                <section className="card">
                    <h2 className="mb-4 text-lg font-extrabold">✉️ New announcement</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 font-semibold">👥 Send to
                            <select value={state} onChange={(e) => { setState(e.target.value); setDistrict('') }} disabled={!!myState} className="input">
                                {!myState && <option value="">All members (every state)</option>}
                                {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">🏘️ District
                            <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!state} className="input">
                                <option value="">{state ? 'Every district' : 'Choose a state first'}</option>
                                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </label>
                    </div>
                    <p className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${count === 0 ? 'bg-red-50 text-red-800' : 'bg-mist text-brand'}`}>
                        {count === null ? 'Counting…' : count === 0 ? '📭 No members with an email address in this group.' : `📬 This will go to ${count} ${who} who gave an email address.`}
                    </p>

                    <label className="mt-4 flex flex-col gap-1 font-semibold">Subject
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength="150" placeholder="e.g. Big rally in Lucknow on 14 April" className="input" />
                    </label>
                    <label className="mt-3 flex flex-col gap-1 font-semibold">Message
                        <textarea rows="9" value={body} onChange={(e) => setBody(e.target.value)} maxLength="5000"
                            placeholder={'Write in Hindi, English or both.\n\nLeave an empty line between paragraphs.'} className="input resize-y py-2" />
                        <span className="text-right text-xs font-normal text-navy/50">{body.length} / 5000</span>
                    </label>
                    <p className="text-xs text-navy/60">Each email starts with "जय भीम &lt;member's name&gt;," and ends with a link to stop these emails.</p>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button onClick={test} disabled={!ready || !!busy} className="abtn min-h-11 px-4">{busy === 'test' ? 'Sending…' : '🧪 Send a test to me'}</button>
                        <button onClick={send} disabled={!ready || !count || !!busy || sending} className="abtn-primary min-h-11 px-5">
                            {busy === 'send' ? 'Starting…' : `📤 Send to ${count ?? '…'} members`}
                        </button>
                    </div>
                    {sending && <p className="mt-2 text-right text-xs text-navy/60">Wait until the current announcement finishes.</p>}
                </section>

                {/* How it looks */}
                <section className="card bg-mist/30">
                    <h2 className="mb-3 text-lg font-extrabold">👀 How it looks</h2>
                    <div className="overflow-hidden rounded-xl border border-brand/15 bg-white text-sm shadow-sm">
                        <div className="bg-brand px-4 py-3 text-white"><b>भीम आर्मी ब्लू पैंथर</b><div className="text-xs opacity-80">Bhim Army Blue Panther</div></div>
                        <div className="px-4 py-3">
                            <p className="mb-1 text-xs text-navy/50">Subject: <b className="text-navy">{subject || '…'}</b></p>
                            <p className="mb-2">जय भीम <b>Ravi Kumar</b>,</p>
                            {(body.trim() ? body.split(/\n\s*\n/) : ['Your message will appear here.']).map((p, i) => (
                                <p key={i} className={`mb-2 whitespace-pre-line ${body.trim() ? '' : 'text-navy/40'}`}>{p.trim()}</p>
                            ))}
                            <p className="mb-1">— Bhim Army Blue Panther</p>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-navy/50">Stop these emails · ये ईमेल बंद करें</p>
                    <p className="mt-4 rounded-lg bg-gold/10 px-3 py-2 text-xs text-navy/70">
                        💡 Emails go out one by one with a short pause, so a big list can take a while. Free email accounts (like Gmail) allow about 500 emails a day.
                    </p>
                </section>
            </div>

            {/* Sent before */}
            <h2 className="mt-8 mb-3 text-lg font-extrabold">🗂️ Sent announcements</h2>
            {!history && <p>Loading...</p>}
            {history?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing sent yet.</p>}
            <ul className="grid gap-3 xl:grid-cols-2">
                {history?.map((m) => {
                    const [tone, label] = STATUS[m.status] || STATUS.done
                    const pct = m.total ? Math.round(((m.sent + m.failed) / m.total) * 100) : 0
                    return (
                        <li key={m._id} className="card p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <b className="min-w-0 flex-1 leading-tight">{m.subject}</b>
                                <Pill tone={tone}>{label}</Pill>
                            </div>
                            <p className="mt-1 text-xs text-navy/60">
                                👥 {m.district ? `${m.district}, ` : ''}{m.stateCode ? stateByCode(m.stateCode)?.en : 'All members'} · ✍️ {m.byName} · 🕒 {when(m.createdAt)}
                            </p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                                <div className={`h-full ${m.status === 'stopped' ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1.5 text-sm">
                                <b className="text-green-700">{m.sent}</b> sent{m.failed ? <> · <b className="text-red-700">{m.failed}</b> failed</> : null} · of {m.total}
                            </p>
                            {m.note && <p className="mt-1 text-xs text-red-700">{m.note}</p>}
                            {m.status === 'sending' && <button onClick={() => stop(m)} className="abtn-danger mt-2 min-h-9 px-3">⏹️ Stop sending</button>}
                        </li>
                    )
                })}
            </ul>
        </>
    )
}
