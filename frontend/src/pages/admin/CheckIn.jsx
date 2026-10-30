import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading } from './ui.jsx'
import BoxIcon from '../../components/BoxIcon.jsx'
import Icon from '../../components/Icon.jsx'

const n = (v) => Number(v || 0).toLocaleString('en-IN')
const title = (e) => e.titleHi || e.titleEn || 'Event'
const when = (e) => [new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), e.time].filter(Boolean).join(' · ')
const clock = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d))

// A short sound and buzz, so the gate team knows the result without looking
function signal(ok) {
    try { navigator.vibrate?.(ok ? 80 : [120, 80, 120]) } catch { /* not supported */ }
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        const ac = (signal.ac ||= new Ctx())
        const o = ac.createOscillator()
        const g = ac.createGain()
        o.frequency.value = ok ? 880 : 220
        g.gain.value = 0.15
        o.connect(g); g.connect(ac.destination)
        o.start(); o.stop(ac.currentTime + (ok ? 0.12 : 0.35))
    } catch { /* no sound */ }
}

// The list of events to choose from
function EventPicker() {
    const [events, setEvents] = useState(null)
    const [error, setError] = useState('')
    useEffect(() => { api.get('/checkin/events').then(setEvents).catch((e) => setError(e.message)) }, [])
    const today = dayKey(new Date())
    return (
        <>
            <PageHeader title="Event Check-in" subtitle="Choose an event, then scan the QR code on members' cards at the gate." />
            <Notice>{error}</Notice>
            {!events && !error && <ListLoading />}
            {events?.length === 0 && <p className="card text-center text-navy/70">📭 No events in the last two weeks or the next two months. Add one on the Events page.</p>}
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {events?.map((e) => {
                    const isToday = dayKey(e.date) === today
                    return (
                        <li key={e._id}>
                            <Link to={`/admin/checkin/${e._id}`} className={`card flex h-full items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isToday ? 'ring-2 ring-gold' : ''}`}>
                                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><BoxIcon name="ticket" size={24} /></span>
                                <span className="min-w-0 flex-1">
                                    {isToday && <span className="mb-1 inline-block rounded-full bg-gold px-2 py-0.5 text-xs font-extrabold text-navy">Today</span>}
                                    <b className="line-clamp-2 leading-snug">{title(e)}</b>
                                    <span className="block text-xs text-navy/60">📅 {when(e)}{e.location ? ` · 📍 ${e.location}` : ''}</span>
                                    <span className="mt-1 block text-sm font-semibold text-brand">✅ {n(e.members)} members{e.guests ? ` · +${n(e.guests)} guests` : ''}</span>
                                </span>
                                <Icon name="arrow" size={18} className="shrink-0 text-brand/50" />
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}

// The camera: reads QR codes and calls onCode with what they hold
function Scanner({ onCode, paused }) {
    const video = useRef(null)
    const [state, setState] = useState('off') // off | starting | on | denied | none
    const stream = useRef(null)
    const last = useRef({ code: '', at: 0 })
    const pausedRef = useRef(paused)
    pausedRef.current = paused

    const stop = () => {
        stream.current?.getTracks().forEach((t) => t.stop())
        stream.current = null
        setState('off')
    }
    useEffect(() => stop, [])

    async function start() {
        if (!navigator.mediaDevices?.getUserMedia) return setState('none')
        setState('starting')
        try {
            stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
            video.current.srcObject = stream.current
            await video.current.play()
            setState('on')
        } catch (e) {
            setState(e?.name === 'NotAllowedError' ? 'denied' : 'none')
        }
    }

    // Look at a frame about 6 times a second
    useEffect(() => {
        if (state !== 'on') return
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        const timer = setInterval(() => {
            const v = video.current
            if (!v || pausedRef.current || v.readyState < 2) return
            const w = 480
            const h = Math.round((v.videoHeight / v.videoWidth) * w) || 480
            canvas.width = w; canvas.height = h
            ctx.drawImage(v, 0, 0, w, h)
            const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })
            if (!found?.data) return
            // The same card held in front of the camera is read once, not again and again
            if (found.data === last.current.code && Date.now() - last.current.at < 5000) return
            last.current = { code: found.data, at: Date.now() }
            onCode(found.data)
        }, 160)
        return () => clearInterval(timer)
    }, [state, onCode])

    return (
        <div className="relative overflow-hidden rounded-2xl bg-navy">
            <video ref={video} playsInline muted className={`aspect-square w-full object-cover ${state === 'on' ? '' : 'hidden'}`} />
            {state === 'on' && (
                <>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-3xl border-4 border-gold/90 shadow-[0_0_0_999px_rgba(10,26,63,0.35)]" />
                    <button type="button" onClick={stop} className="absolute top-3 right-3 rounded-full bg-navy/70 px-3 py-1.5 text-sm font-semibold text-white">Stop camera</button>
                    <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-white drop-shadow">Hold the card's QR code inside the box</p>
                </>
            )}
            {state !== 'on' && (
                <div className="flex aspect-square flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-gold"><BoxIcon name="camera" size={34} /></span>
                    {state === 'denied' && <p className="text-sm text-white/85">The camera is blocked. Allow the camera for this site in the browser settings, or type the member number below.</p>}
                    {state === 'none' && <p className="text-sm text-white/85">This phone or browser cannot use the camera here. Type the member number below.</p>}
                    <button type="button" onClick={start} disabled={state === 'starting'} className="btn bg-gold text-navy">{state === 'starting' ? 'Starting…' : '📷 Start scanning'}</button>
                </div>
            )}
        </div>
    )
}

// What happened with the last card: green (let in), amber (already in), red (not a valid member)
function Result({ r }) {
    if (!r) return (
        <div className="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-navy/15 p-4 text-center text-navy/55">
            The result of each scan shows here.
        </div>
    )
    const look = {
        ok: ['border-green-500 bg-green-50', 'bg-green-500', '✓', 'Welcome! Checked in'],
        already: ['border-amber-400 bg-amber-50', 'bg-amber-500', '!', 'Already checked in'],
        bad: ['border-red-400 bg-red-50', 'bg-red-500', '✕', 'Not let in'],
    }[r.kind]
    return (
        <div role="status" aria-live="assertive" className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${look[0]}`}>
            {r.member?.photo
                ? <img src={r.member.photo} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover" />
                : <span aria-hidden="true" className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold text-white ${look[1]}`}>{look[2]}</span>}
            <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-wide uppercase">{look[3]}</p>
                {r.member && <p className="truncate text-xl leading-tight font-extrabold">{r.member.name}</p>}
                {r.member && <p className="text-sm text-navy/70">{[r.member.memberNo, r.member.place].filter(Boolean).join(' · ')}</p>}
                {r.kind === 'already' && <p className="text-sm text-navy/70">at {clock(r.at)}{r.by ? ` by ${r.by}` : ''}</p>}
                {r.kind === 'bad' && <p className="text-sm font-semibold text-red-800">{r.message}</p>}
            </div>
        </div>
    )
}

function EventCheckIn({ eventId }) {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)
    const [busy, setBusy] = useState(false)
    const [code, setCode] = useState('')
    const [tab, setTab] = useState('list')

    const load = () => api.get(`/checkin/${eventId}`).then(setData).catch((e) => setError(e.message))
    useEffect(() => { load() }, [eventId])
    // Keep the numbers fresh when several phones are scanning at the same gate
    useEffect(() => {
        const t = setInterval(() => { if (!document.hidden) load() }, 20000)
        return () => clearInterval(t)
    }, [eventId])

    const send = useRef(null)
    send.current = async (value) => {
        if (busy) return
        setBusy(true)
        try {
            const r = await api.post(`/checkin/${eventId}`, { code: value })
            setResult({ kind: r.result === 'ok' ? 'ok' : 'already', ...r })
            signal(r.result === 'ok')
            load()
        } catch (e) {
            setResult({ kind: 'bad', message: e.message })
            signal(false)
        } finally { setBusy(false) }
    }
    const [onCode] = useState(() => (v) => send.current(v))

    async function typed(e) {
        e.preventDefault()
        if (!code.trim()) return
        await send.current(code.trim())
        setCode('')
    }

    async function guest() {
        try { await api.post(`/checkin/${eventId}/guests`, { count: 1 }); signal(true); load() } catch (e) { setError(e.message) }
    }

    async function undo(row) {
        if (!window.confirm(row.member ? `Undo the check-in of ${row.name}?` : `Remove these ${row.guests} guest(s)?`)) return
        try { await api.del(`/checkin/${eventId}/${row._id}`); load() } catch (e) { setError(e.message) }
    }

    function downloadCsv() {
        const rows = [['Name', 'Member no.', 'District', 'Guests', 'Time', 'Checked in by'],
        ...data.list.map((r) => [r.name || 'Guest (not a member)', r.memberNo || '', r.district || '', r.member ? '' : r.guests, new Date(r.createdAt).toLocaleString('en-IN'), r.byName || ''])]
        const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
        a.download = `attendance-${(data.event.titleEn || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }

    if (!data) return (<><Link to="/admin/checkin" className="mb-3 inline-block font-semibold text-brand">← All events</Link><Notice>{error}</Notice>{!error && <ListLoading />}</>)

    return (
        <>
            <Link to="/admin/checkin" className="mb-3 inline-block font-semibold text-brand">← All events</Link>
            <PageHeader title={title(data.event)} subtitle={`${when(data.event)}${data.event.location ? ` · ${data.event.location}` : ''}`}>
                {data.list.length > 0 && <button onClick={downloadCsv} className="abtn">📥 Download Excel</button>}
            </PageHeader>
            <Notice>{error}</Notice>

            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                {[['Members', data.members, 'text-green-700'], ['Guests', data.guests, 'text-amber-700'], ['Total', data.total, 'text-brand']].map(([label, v, tone]) => (
                    <div key={label} className="rounded-2xl border border-brand/10 bg-white p-3 text-center shadow-sm">
                        <div className={`text-2xl font-extrabold sm:text-3xl ${tone}`}>{n(v)}</div>
                        <div className="text-xs font-semibold text-navy/60 sm:text-sm">{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
                <section className="flex flex-col gap-3">
                    <Scanner onCode={onCode} paused={busy} />
                    <Result r={result} />
                    <form onSubmit={typed} className="flex gap-2">
                        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Member no. (BBP-00012) or phone" aria-label="Member number or phone number" className="input min-h-11 flex-1 py-2" />
                        <button disabled={busy || !code.trim()} className="abtn-primary min-h-11 px-4">Check in</button>
                    </form>
                    <button type="button" onClick={guest} className="abtn min-h-11">➕ Add 1 guest (not a member)</button>
                </section>

                <section className="card min-w-0 p-0 sm:p-0">
                    <div role="tablist" className="flex border-b border-brand/10">
                        {[['list', `Who came (${n(data.list.length)})`], ['district', 'By district']].map(([k, label]) => (
                            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                                className={`flex-1 px-4 py-3 text-sm font-bold ${tab === k ? 'border-b-2 border-brand text-brand' : 'text-navy/60'}`}>{label}</button>
                        ))}
                    </div>
                    <div className="max-h-[32rem] overflow-y-auto p-3 sm:p-4">
                        {data.list.length === 0 && <p className="py-6 text-center text-navy/60">Nobody checked in yet.</p>}
                        {tab === 'list' && (
                            <ul className="divide-y divide-brand/10">
                                {data.list.map((r) => (
                                    <li key={r._id} className="flex items-center gap-3 py-2">
                                        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${r.member ? 'bg-brand text-white' : 'bg-amber-100 text-amber-800'}`}>
                                            {r.member ? r.name?.[0]?.toUpperCase() : `+${r.guests}`}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <b className="block truncate">{r.member ? r.name : `${r.guests} guest${r.guests === 1 ? '' : 's'} (not members)`}</b>
                                            <span className="block truncate text-xs text-navy/60">{[r.memberNo, r.district, clock(r.createdAt), r.byName && `by ${r.byName}`].filter(Boolean).join(' · ')}</span>
                                        </div>
                                        <button onClick={() => undo(r)} title="Undo" aria-label={`Undo ${r.name || 'guests'}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy/40 hover:bg-red-50 hover:text-red-600"><Icon name="close" size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {tab === 'district' && data.byDistrict.length > 0 && (
                            <ul className="flex flex-col gap-2">
                                {data.byDistrict.map((d) => (
                                    <li key={d.key} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-2 text-sm">
                                        <span className="truncate">{d.key}</span>
                                        <span className="h-3 rounded-r-[4px] bg-brand/80" style={{ width: `${Math.max(3, (d.value / data.byDistrict[0].value) * 100)}%` }} />
                                        <b>{n(d.value)}</b>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>
        </>
    )
}

export default function CheckIn() {
    const { eventId } = useParams()
    return eventId ? <EventCheckIn key={eventId} eventId={eventId} /> : <EventPicker />
}
