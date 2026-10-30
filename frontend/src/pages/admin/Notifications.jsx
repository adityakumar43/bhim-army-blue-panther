import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { pushState, turnOn, currentSubscription } from '../../lib/push.js'
import { PageHeader, Notice, Pill, ListLoading } from './ui.jsx'

const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const STATUS = { sending: ['gold', '📤 Sending'], done: ['green', '✅ Sent'], stopped: ['red', '⏹️ Stopped'] }
const title = (item) => item.titleEn || item.titleHi || 'Untitled'

// Send a notification to every phone and computer that turned notifications on
export default function Notifications() {
    const [info, setInfo] = useState(null) // { ready, count }
    const [form, setForm] = useState({ title: '', body: '', url: '/' })
    const [pages, setPages] = useState([]) // [label, url] choices for "Opens"
    const [history, setHistory] = useState(null)
    const [mine, setMine] = useState(null) // notifications on this device: 'on' | 'off' | 'blocked' | 'unsupported'
    const [busy, setBusy] = useState('')
    const [error, setError] = useState('')
    const [note, setNote] = useState('')

    const loadHistory = () => api.get('/push').then(setHistory).catch((e) => setError(e.message))
    const loadCount = () => api.get('/push/count').then(setInfo).catch((e) => setError(e.message))
    useEffect(() => {
        loadCount(); loadHistory()
        pushState().then(setMine).catch(() => setMine('unsupported'))
        // Pages a notification can open: the main ones, plus the latest news and events
        Promise.all([api.get('/news?limit=6').catch(() => []), api.get('/events?limit=6').catch(() => [])]).then(([news, events]) => setPages([
            ['Home page', '/'], ['News page', '/news'], ['Join page', '/join'], ['Donate page', '/donate'], ['Help desk page', '/help'],
            ...news.map((n) => [`📰 ${title(n)}`, `/news/${n._id}`]),
            ...events.map((e) => [`📅 ${title(e)}`, `/events/${e._id}`]),
        ]))
    }, [])

    // While one is being sent, refresh its progress
    const sending = history?.some((h) => h.status === 'sending')
    useEffect(() => {
        if (!sending) return
        const timer = setInterval(() => { loadHistory(); loadCount() }, 3000)
        return () => clearInterval(timer)
    }, [sending])

    const set = (f) => (e) => setForm((old) => ({ ...old, [f]: e.target.value }))
    const ready = form.title.trim().length > 0

    async function run(kind, job) {
        setBusy(kind); setError(''); setNote('')
        try { await job() } catch (e) { setError(e.message) } finally { setBusy('') }
    }

    const thisDeviceOn = () => run('device', async () => {
        try { await turnOn('en') } catch (e) {
            if (e.message === 'blocked') { setMine('blocked'); throw new Error('Notifications are blocked for this site in your browser settings.') }
            if (e.message === 'dismissed') return
            throw e
        }
        setMine('on'); await loadCount()
        setNote('Notifications are on for this device. You can send yourself a test now.')
    })

    const test = () => run('test', async () => {
        const sub = await currentSubscription()
        if (!sub) throw new Error('Turn on notifications on this device first')
        await api.post('/push/test', { ...form, endpoint: sub.endpoint })
        setNote('Test sent to this device. It should appear in a few seconds.')
    })

    const send = () => {
        if (!window.confirm(`Send "${form.title}" to ${info?.count} phones and computers?\n\nThis cannot be taken back.`)) return
        run('send', async () => {
            await api.post('/push', form)
            setNote(`Sending to ${info?.count} devices. You can follow it below.`)
            setForm({ title: '', body: '', url: '/' })
            await loadHistory()
        })
    }

    const stop = (h) => run('stop', async () => { await api.post(`/push/${h._id}/stop`); await loadHistory() })

    return (
        <>
            <PageHeader title="Phone Notifications" subtitle="Send a short message that pops up on the phones and computers of people who turned notifications on." />
            <Notice>{error}</Notice>
            <Notice kind="success">{note}</Notice>
            {info && !info.ready && (
                <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    ⚙️ Notifications are not set up on the server yet. Add <code>VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code> to <code>backend/.env</code> and restart.
                </p>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <section className="card">
                    <h2 className="mb-1 text-lg font-extrabold">📲 New notification</h2>
                    <p className={`mb-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${info?.count ? 'bg-mist text-brand' : 'bg-red-50 text-red-800'}`}>
                        {info === null ? 'Counting…' : info.count ? `🔔 ${info.count} phones and computers have notifications on.` : '🔕 Nobody has turned on notifications yet. People turn them on at the bottom of the website, or when the app asks them.'}
                    </p>
                    <label className="flex flex-col gap-1 font-semibold">Title
                        <input value={form.title} onChange={set('title')} maxLength="80" placeholder="e.g. बड़ी रैली 14 अप्रैल को लखनऊ में" className="input" />
                        <span className="text-right text-xs font-normal text-navy/50">{form.title.length} / 80</span>
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">Message <span className="text-xs font-normal text-navy/55">(optional, keep it short)</span>
                        <textarea rows="3" value={form.body} onChange={set('body')} maxLength="200" placeholder="e.g. सुबह 10 बजे अंबेडकर पार्क पहुँचें। Jai Bhim!" className="input resize-y py-2" />
                        <span className="text-right text-xs font-normal text-navy/50">{form.body.length} / 200</span>
                    </label>
                    <label className="mt-1 flex flex-col gap-1 font-semibold">Opens when tapped
                        <select value={form.url} onChange={set('url')} className="input">
                            {pages.map(([label, url]) => <option key={url} value={url}>{label}</option>)}
                        </select>
                    </label>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        {mine === 'on'
                            ? <button onClick={test} disabled={!ready || !!busy} className="abtn min-h-11 px-4">{busy === 'test' ? 'Sending…' : '🧪 Send a test to this device'}</button>
                            : mine === 'off' && <button onClick={thisDeviceOn} disabled={!!busy} className="abtn min-h-11 px-4">🔔 Turn on for this device (to test)</button>}
                        <button onClick={send} disabled={!ready || !info?.count || !info?.ready || !!busy || sending} className="abtn-primary min-h-11 px-5">
                            {busy === 'send' ? 'Starting…' : `📤 Send to ${info?.count ?? '…'} devices`}
                        </button>
                    </div>
                    {sending && <p className="mt-2 text-right text-xs text-navy/60">Wait until the current one finishes.</p>}
                </section>

                {/* How it looks on a phone */}
                <section className="card bg-mist/30">
                    <h2 className="mb-3 text-lg font-extrabold">👀 How it looks</h2>
                    <div className="mx-auto max-w-sm rounded-2xl bg-[#202124] p-3 text-white shadow-lg">
                        <div className="flex items-start gap-3 rounded-xl bg-[#303134] p-3">
                            <img src="/icons/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded-full bg-white object-contain" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-white/60">Blue Panther · now</p>
                                <p className="font-semibold leading-snug break-words">{form.title || 'Your title'}</p>
                                {(form.body || !form.title) && <p className="mt-0.5 text-sm leading-snug break-words text-white/80">{form.body || 'Your message'}</p>}
                            </div>
                        </div>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-xs text-navy/70">
                        <li>💡 Short is best: phones cut long text. Write in Hindi, English or both.</li>
                        <li>📵 Send only important things (big events, urgent news). Too many and people turn them off.</li>
                        <li>🍎 iPhones only get notifications if the person installed the app (iOS 16.4 or newer).</li>
                    </ul>
                </section>
            </div>

            <h2 className="mt-8 mb-3 text-lg font-extrabold">🗂️ Sent notifications</h2>
            {!history && <ListLoading />}
            {history?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing sent yet.</p>}
            <ul className="grid gap-3 xl:grid-cols-2">
                {history?.map((h) => {
                    const [tone, label] = STATUS[h.status] || STATUS.done
                    const pct = h.total ? Math.round(((h.sent + h.failed + h.removed) / h.total) * 100) : 0
                    return (
                        <li key={h._id} className="card p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <b className="min-w-0 flex-1 leading-tight">{h.title}</b>
                                <Pill tone={tone}>{label}</Pill>
                            </div>
                            {h.body && <p className="mt-1 text-sm text-navy/75">{h.body}</p>}
                            <p className="mt-1 text-xs text-navy/60">🔗 {h.url} · ✍️ {h.byName} · 🕒 {when(h.createdAt)}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                                <div className={`h-full ${h.status === 'stopped' ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1.5 text-sm">
                                <b className="text-green-700">{h.sent}</b> delivered{h.failed ? <> · <b className="text-red-700">{h.failed}</b> failed</> : null}
                                {h.removed ? <> · {h.removed} had turned them off</> : null} · of {h.total}
                            </p>
                            {h.note && <p className="mt-1 text-xs text-red-700">{h.note}</p>}
                            {h.status === 'sending' && <button onClick={() => stop(h)} className="abtn-danger mt-2 min-h-9 px-3">⏹️ Stop sending</button>}
                        </li>
                    )
                })}
            </ul>
        </>
    )
}
