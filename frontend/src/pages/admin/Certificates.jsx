import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import { STATES, stateByCode } from '../../data/states.js'
import { CERT_TYPES, certType, RELATIONS, day } from '../../data/certificates.js'

const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const linkOf = (c) => `${window.location.origin}/certificate/${c.token}`
const EMPTY = {
    type: 'appointment', name: '', relation: '', guardian: '', phone: '', email: '', district: '', stateCode: '',
    post: '', area: '', validUntil: '', reason: '', issueDate: '', signatoryName: '', signatoryTitle: '', sendEmail: true,
    // appointment letter layout
    address: '', showPhone: true, signatureUrl: '', preamble: '', closing: '', copies: '',
    letterhead: { leaders: [], office: '' },
    // general letter
    to: '', subject: '', salutation: '', body: '', signOff: '',
}
const LAYOUT_KEYS = ['letterhead', 'preamble', 'closing', 'copies', 'signatoryName', 'signatoryTitle', 'signatureUrl', 'salutation', 'signOff']
// Always three boxes for the blue band in the form (empty ones are skipped on the letter)
const threeLeaders = (lh) => [0, 1, 2].map((i) => ({ name: '', title: '', phone: '', ...(lh?.leaders?.[i] || {}) }))

function waLink(c) {
    const t = certType(c.type)
    const msg = `जय भीम ${c.name}!\n${t.hi} / ${t.en} (${c.refNo})\nदेखें और डाउनलोड करें / View and download:\n${linkOf(c)}`
    return `https://wa.me/${c.phone ? `91${c.phone}` : ''}?text=${encodeURIComponent(msg)}`
}

export default function Certificates() {
    const { me } = useOutletContext()
    const myState = me.role === 'stateadmin' ? stateByCode(me.state) : null
    const canDelete = me.permissions.includes('admins')

    const [items, setItems] = useState(null)
    const [layoutNote, setLayoutNote] = useState('')
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState(EMPTY)
    const [editing, setEditing] = useState(null)
    const [adding, setAdding] = useState(false)
    const [tab, setTab] = useState('')
    const [q, setQ] = useState('')
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [issued, setIssued] = useState(null) // the one just issued, to open or send right away
    const [busy, setBusy] = useState(false)

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
    const load = () => api.get('/certificates').then(setItems).catch((e) => setError(e.message))
    useEffect(() => { load() }, [])

    // Letterhead, wording and signature: copied from the last letter of this state (or the standard letter)
    async function layoutFor(stateCode, type) {
        try {
            const d = await api.get(`/certificates/defaults?type=${type}${stateCode ? `&state=${stateCode}` : ''}`)
            setLayoutNote(d.from === 'last' ? 'Filled in from the last letter for this state. Change anything you need.' : "Filled in from the organisation's standard letter. Change anything you need.")
            return { ...Object.fromEntries(LAYOUT_KEYS.map((k) => [k, d[k] ?? EMPTY[k]])), letterhead: { leaders: threeLeaders(d.letterhead), office: d.letterhead?.office || '' } }
        } catch {
            return {}
        }
    }

    async function startAdd(type = 'appointment') {
        setEditing(null); setAdding(true); setNote(''); setError(''); setIssued(null)
        const base = { ...EMPTY, type, issueDate: todayIso(), stateCode: myState?.code || '', letterhead: { leaders: threeLeaders(), office: '' } }
        setForm(base)
        const layout = await layoutFor(myState?.code, type)
        setForm((f) => ({ ...f, ...layout }))
    }

    // Switching the kind of document while issuing: fill in that kind's usual wording and signer
    async function chooseType(type) {
        setForm((f) => ({ ...f, type }))
        const layout = await layoutFor(form.stateCode, type)
        setForm((f) => (f.type === type ? { ...f, ...layout } : f))
    }

    async function changeState(e) {
        const stateCode = e.target.value
        setForm((f) => ({ ...f, stateCode }))
        if (!editing) {
            const layout = await layoutFor(stateCode, form.type)
            setForm((f) => ({ ...f, ...layout }))
        }
    }

    const setLeader = (i, k) => (e) => setForm((f) => {
        const leaders = threeLeaders(f.letterhead)
        leaders[i] = { ...leaders[i], [k]: e.target.value }
        return { ...f, letterhead: { ...f.letterhead, leaders } }
    })

    async function uploadSignature(e) {
        const file = e.target.files[0]
        e.target.value = ''
        if (!file) return
        setUploading(true); setError('')
        try {
            const data = new FormData()
            data.append('image', file)
            const { url } = await api.post('/certificates/signature', data)
            setForm((f) => ({ ...f, signatureUrl: url }))
        } catch (err) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }
    function startEdit(c) {
        setForm({
            ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? EMPTY[k]])),
            issueDate: iso(c.issueDate), validUntil: iso(c.validUntil), sendEmail: false,
            letterhead: { leaders: threeLeaders(c.letterhead), office: c.letterhead?.office || '' },
        })
        setEditing(c); setAdding(false); setNote(''); setError(''); setIssued(null); setLayoutNote('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const close = () => { setAdding(false); setEditing(null); setError('') }

    async function submit(e) {
        e.preventDefault()
        setBusy(true); setError(''); setNote('')
        try {
            const { sendEmail, ...fields } = form
            if (editing) {
                const { type, ...rest } = fields
                await api.patch(`/certificates/${editing._id}`, rest)
                setNote(`Saved ${editing.refNo}.`)
            } else {
                const c = await api.post('/certificates', { ...fields, sendEmail: sendEmail && !!fields.email })
                setIssued(c)
                setNote(`Issued ${c.refNo}${c.emailing ? ` and emailing it to ${c.email}` : ''}.`)
            }
            close()
            await load()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    async function act(c, fn, done) {
        setError(''); setNote('')
        try { await fn(); if (done) setNote(done); await load() } catch (e) { setError(e.message) }
    }
    const revoke = (c) => {
        const reason = window.prompt(`Cancel ${c.refNo} (${c.name})?\nAnyone opening the link will see it is cancelled.\n\nReason (optional):`)
        if (reason === null) return
        act(c, () => api.patch(`/certificates/${c._id}`, { status: 'revoked', revokeReason: reason }), `${c.refNo} is now cancelled.`)
    }
    const restore = (c) => act(c, () => api.patch(`/certificates/${c._id}`, { status: 'active' }), `${c.refNo} is valid again.`)
    const email = (c) => act(c, () => api.post(`/certificates/${c._id}/email`), `Emailed ${c.refNo} to ${c.email}.`)
    const remove = (c) => {
        if (!window.confirm(`Delete ${c.refNo} (${c.name}) for ever?\nIts link will stop working. To keep a record, use "Cancel" instead.`)) return
        act(c, () => api.del(`/certificates/${c._id}`), `Deleted ${c.refNo}.`)
    }

    const shown = useMemo(() => {
        const text = q.trim().toLowerCase()
        return (items || []).filter((c) => (!tab || c.type === tab) &&
            (!text || [c.name, c.refNo, c.phone, c.post, c.reason, c.district].join(' ').toLowerCase().includes(text)))
    }, [items, tab, q])
    const count = (key) => (items || []).filter((c) => c.type === key).length

    const showForm = adding || !!editing
    const appointment = form.type === 'appointment'
    const letter = form.type === 'letter'
    const field = 'flex flex-col gap-1 font-semibold'

    return (
        <>
            <PageHeader title="Certificates & letters" subtitle={`Appointment letters, certificates and letters on your letterhead, each with a QR code anyone can scan to check it is real.${myState ? ` For ${myState.en} only.` : ''}`}>
                {!showForm && <button onClick={() => startAdd()} className="abtn-primary">➕ Issue new</button>}
            </PageHeader>
            <Notice kind="success">{note}</Notice>

            {issued && (
                <div className="card mb-5 flex flex-wrap items-center gap-2 border-green-300 bg-green-50">
                    <span className="mr-auto font-bold">✅ {certType(issued.type).emoji} {issued.refNo} · {issued.name}</span>
                    <a href={linkOf(issued)} target="_blank" rel="noreferrer" className="abtn">👁️ Open and print</a>
                    <a href={waLink(issued)} target="_blank" rel="noopener noreferrer" className="abtn">💬 Send on WhatsApp</a>
                    <button onClick={() => navigator.clipboard?.writeText(linkOf(issued)).then(() => setNote('Link copied.'))} className="abtn">🔗 Copy link</button>
                </div>
            )}

            {showForm && (
                <form onSubmit={submit} className="card mb-6 border-brand/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-extrabold">{editing ? `✏️ Edit ${editing.refNo}` : '➕ Issue a certificate or letter'}</h2>
                        <button type="button" onClick={close} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist"><Icon name="close" size={18} /></button>
                    </div>

                    {!editing && (
                        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="What to issue">
                            {CERT_TYPES.map((t) => (
                                <button key={t.key} type="button" role="radio" aria-checked={form.type === t.key} onClick={() => chooseType(t.key)}
                                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${form.type === t.key ? 'border-brand bg-mist' : 'border-navy/10 hover:border-brand/40'}`}>
                                    <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
                                    <span><span className="block font-bold leading-tight">{t.en}</span><span className="text-sm text-navy/60">{t.hi}</span></span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {letter ? (
                            <>
                                <label className={`${field} sm:col-span-2 lg:col-span-3`}>सेवा में (To) *
                                    <textarea value={form.to} onChange={set('to')} required maxLength="500" rows="4" className="input"
                                        placeholder={'श्री स्वामी प्रसाद मौर्या जी,\nमाननीय राष्ट्रीय अध्यक्ष\n(अपनी जनता पार्टी),\nपूर्व कैबिनेट मंत्री, उत्तर प्रदेश।'} />
                                    <span className="text-xs font-normal text-navy/60">One line per row, exactly as it should be printed. The first line names the letter in your list.</span>
                                </label>
                                <label className={`${field} sm:col-span-2`}>विषय (Subject, optional)<input value={form.subject} onChange={set('subject')} maxLength="300" className="input" /></label>
                                <label className={field}>Greeting<input value={form.salutation} onChange={set('salutation')} maxLength="60" className="input" placeholder="महोदय," /></label>
                                <label className={`${field} sm:col-span-2 lg:col-span-3`}>पत्र (The letter) *
                                    <textarea value={form.body} onChange={set('body')} required maxLength="6000" rows="12" className="input leading-relaxed"
                                        placeholder="सविनय निवेदन है कि..." />
                                    <span className="text-xs font-normal text-navy/60">Leave an empty line between paragraphs. A long letter carries on to a second page.</span>
                                </label>
                            </>
                        ) : (
                            <>
                                <label className={field}>Full name *<input value={form.name} onChange={set('name')} required maxLength="100" className="input" placeholder="like Ravi Kumar" /></label>
                                <label className={field}>Relation
                                    <select value={form.relation} onChange={set('relation')} className="input">
                                        {RELATIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                                    </select>
                                </label>
                                <label className={field}>Father's / husband's name<input value={form.guardian} onChange={set('guardian')} disabled={!form.relation} maxLength="100" className="input disabled:bg-mist" /></label>
                            </>
                        )}

                        {appointment ? (
                            <>
                                <label className={field}>Post *<input value={form.post} onChange={set('post')} required maxLength="120" className="input" placeholder="like जिला अध्यक्ष / District President" /></label>
                                <label className={field}>Area (optional)<input value={form.area} onChange={set('area')} maxLength="120" className="input" placeholder="like मेरठ जिला" /></label>
                                <label className={field}>Valid until (optional)<input type="date" value={form.validUntil} onChange={set('validUntil')} min={form.issueDate} className="input" />
                                    <span className="text-xs font-normal text-navy/60">Empty = until further orders</span>
                                </label>
                                <label className={`${field} sm:col-span-2 lg:col-span-3`}>Address (पता) on the letter
                                    <input value={form.address} onChange={set('address')} maxLength="300" className="input" placeholder="like ग्राम टेमनी कला, पोस्ट सिराठा, तहसील नादनवाड़ी, जिला पांढुरना (म.प्र.)" />
                                </label>
                            </>
                        ) : !letter && (
                            <label className={`${field} sm:col-span-2 lg:col-span-3`}>{form.type === 'appreciation' ? 'For (the work or event) *' : 'Event they took part in *'}
                                <input value={form.reason} onChange={set('reason')} required maxLength="300" className="input"
                                    placeholder={form.type === 'appreciation' ? 'like बाढ़ राहत शिविर, मेरठ 2026' : 'like संविधान दिवस रैली, 26 नवंबर 2026'} />
                                <span className="text-xs font-normal text-navy/60">This is printed inside the sentence, in both the Hindi and English lines.</span>
                            </label>
                        )}

                        <label className={field}>District<input value={form.district} onChange={set('district')} maxLength="100" className="input" /></label>
                        {myState ? (
                            <label className={field}>State<input value={myState.en} disabled className="input bg-mist" /></label>
                        ) : (
                            <label className={field}>State
                                <select value={form.stateCode} onChange={changeState} className="input">
                                    <option value="">—</option>
                                    {STATES.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                                </select>
                            </label>
                        )}
                        <label className={field}>Issue date<input type="date" value={form.issueDate} onChange={set('issueDate')} required className="input" /></label>

                        <label className={field}>📱 Mobile (optional)<input type="tel" value={form.phone} onChange={set('phone')} maxLength="15" className="input" placeholder="for sending on WhatsApp" />
                            {appointment && (
                                <span className="flex items-center gap-2 text-sm font-normal">
                                    <input type="checkbox" checked={form.showPhone} onChange={set('showPhone')} className="h-4 w-4 accent-brand" /> Print it on the letter
                                </span>
                            )}
                        </label>
                        <label className={field}>✉️ Email (optional)<input type="email" value={form.email} onChange={set('email')} maxLength="120" className="input" /></label>
                        <div className="hidden lg:block" />

                        {letter && <label className={field}>Sign-off<input value={form.signOff} onChange={set('signOff')} maxLength="60" className="input" placeholder="आपका / भवदीय" /></label>}
                        <label className={field}>✍️ Signed by (name)<input value={form.signatoryName} onChange={set('signatoryName')} maxLength="100" className="input" /></label>
                        <label className={field}>Their post {letter ? '(optional)' : '(can be 2 lines)'}<textarea value={form.signatoryTitle} onChange={set('signatoryTitle')} maxLength="150" rows="2" className="input" placeholder={'like प्रदेश अध्यक्ष\nमध्यप्रदेश'} /></label>
                        <div className={field}>Signature picture
                            {form.signatureUrl ? (
                                <div className="flex items-center gap-2">
                                    <img src={form.signatureUrl} alt="Signature" className="h-14 max-w-40 rounded-lg border border-navy/15 bg-white object-contain p-1" />
                                    <button type="button" onClick={() => setForm({ ...form, signatureUrl: '' })} className="abtn min-h-8 px-2 text-xs">Remove</button>
                                </div>
                            ) : (
                                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSignature} disabled={uploading} className="file-pick" />
                            )}
                            <span className="text-xs font-normal text-navy/60">{uploading ? 'Uploading...' : 'Sign on white paper and take a clear photo. Empty = sign by hand after printing.'}</span>
                        </div>
                    </div>

                    {(appointment || letter) && (
                        <details className="mt-4 rounded-xl border border-navy/15 bg-mist/40 p-3" open={!editing}>
                            <summary className="cursor-pointer font-bold">📄 {letter ? 'Letterhead and copies' : 'Letterhead and wording'}</summary>
                            {layoutNote && <p className="mt-2 text-sm text-navy/65">ℹ️ {layoutNote}</p>}
                            <p className="mt-3 mb-1 text-sm font-semibold">Names in the blue band (empty boxes are left out)</p>
                            <div className="grid gap-3 md:grid-cols-3">
                                {threeLeaders(form.letterhead).map((l, i) => (
                                    <div key={i} className="grid gap-1.5 rounded-lg border border-navy/10 bg-white p-2">
                                        <input value={l.name} onChange={setLeader(i, 'name')} maxLength="60" className="input min-h-10 py-2" placeholder="Name" aria-label={`Name ${i + 1}`} />
                                        <input value={l.title} onChange={setLeader(i, 'title')} maxLength="60" className="input min-h-10 py-2" placeholder="Post" aria-label={`Post ${i + 1}`} />
                                        <input value={l.phone} onChange={setLeader(i, 'phone')} maxLength="20" className="input min-h-10 py-2" placeholder="Phone" aria-label={`Phone ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 grid gap-3">
                                <label className={field}>Office address (second band)
                                    <input value={form.letterhead.office} onChange={(e) => setForm({ ...form, letterhead: { ...form.letterhead, office: e.target.value } })} maxLength="200" className="input" />
                                </label>
                                {appointment && (
                                    <>
                                        <label className={field}>Opening paragraph
                                            <textarea value={form.preamble} onChange={set('preamble')} maxLength="2000" rows="5" className="input" />
                                        </label>
                                        <label className={field}>Closing paragraph
                                            <textarea value={form.closing} onChange={set('closing')} maxLength="1000" rows="4" className="input" />
                                        </label>
                                    </>
                                )}
                                <label className={field}>प्रति लिपि (copies to), one per line{letter ? ' — optional' : ''}
                                    <textarea value={form.copies} onChange={set('copies')} maxLength="1000" rows="8" className="input" />
                                </label>
                            </div>
                        </details>
                    )}

                    {!editing && form.email && (
                        <label className="mt-3 flex items-center gap-2 font-semibold">
                            <input type="checkbox" checked={form.sendEmail} onChange={set('sendEmail')} className="h-5 w-5 accent-brand" /> Email it to {form.email} now
                        </label>
                    )}
                    {error && <div className="mt-3"><Notice>{error}</Notice></div>}
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={close} className="abtn min-h-11">Cancel</button>
                        <button disabled={busy} className="abtn-primary min-h-11 px-6">{busy ? 'Saving...' : editing ? '💾 Save changes' : `✅ Issue ${certType(form.type).en.toLowerCase()}`}</button>
                    </div>
                </form>
            )}

            {!showForm && <Notice>{error}</Notice>}

            <div className="mb-3 flex flex-wrap items-center gap-2">
                {[['', '📂 All', items?.length || 0], ...CERT_TYPES.map((t) => [t.key, `${t.emoji} ${t.short}`, count(t.key)])].map(([key, label, n]) => (
                    <button key={key} onClick={() => setTab(key)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${tab === key ? 'border-brand bg-brand text-white' : 'border-navy/15 bg-white hover:border-brand'}`}>
                        {label} <span className="opacity-70">({n})</span>
                    </button>
                ))}
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Search name, ref no, mobile..." className="input ml-auto min-h-10 max-w-xs py-2" />
            </div>

            {!items && <p>Loading...</p>}
            {items?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing issued yet. Click "Issue new" to make the first one.</p>}
            {items?.length > 0 && shown.length === 0 && <p className="card text-center text-navy/70">No match.</p>}

            <ul className="grid gap-4 lg:grid-cols-2">
                {shown.map((c) => {
                    const t = certType(c.type)
                    const revoked = c.status === 'revoked'
                    return (
                        <li key={c._id} className={`card flex gap-3 p-4 sm:p-4 ${revoked ? 'opacity-70' : ''} ${editing?._id === c._id ? 'ring-2 ring-brand' : ''}`}>
                            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist text-2xl">{t.emoji}</span>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold">{c.name}</span>
                                    {revoked && <Pill tone="red">Cancelled</Pill>}
                                    {c.validUntil && !revoked && new Date(c.validUntil) < new Date(todayIso()) && <Pill tone="gold">Ended</Pill>}
                                    {c.emailedAt && <Pill tone="green">✉️ Emailed</Pill>}
                                </div>
                                <div className="text-sm font-semibold text-brand">{c.refNo}</div>
                                <div className="line-clamp-1 text-sm text-navy/70">{c.type === 'appointment' ? `${c.post}${c.area ? ` (${c.area})` : ''}` : c.type === 'letter' ? c.subject || c.body : c.reason}</div>
                                <div className="text-xs text-navy/55">📅 {day(c.issueDate)}{c.district || c.state ? ` · 📍 ${[c.district, c.state].filter(Boolean).join(', ')}` : ''}{c.issuedByName ? ` · by ${c.issuedByName}` : ''}</div>
                                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                    <a href={linkOf(c)} target="_blank" rel="noreferrer" className="abtn min-h-8 px-2 text-xs">👁️ Open</a>
                                    {!revoked && <a href={waLink(c)} target="_blank" rel="noopener noreferrer" className="abtn min-h-8 px-2 text-xs">💬 WhatsApp</a>}
                                    {!revoked && c.email && <button onClick={() => email(c)} className="abtn min-h-8 px-2 text-xs">✉️ Email</button>}
                                    <button onClick={() => startEdit(c)} className="abtn min-h-8 px-2 text-xs">✏️ Edit</button>
                                    {revoked
                                        ? <button onClick={() => restore(c)} className="abtn min-h-8 px-2 text-xs">↩️ Restore</button>
                                        : <button onClick={() => revoke(c)} className="abtn-danger min-h-8 px-2 text-xs">🚫 Cancel</button>}
                                    {canDelete && <button onClick={() => remove(c)} className="abtn-danger min-h-8 px-2 text-xs">🗑️ Delete</button>}
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}
