import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { portrait } from '../../lib/img.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import { stateByCode } from '../../data/states.js'

const FILTERS = [['pending', '⏳ Pending'], ['approved', '✅ Approved'], ['rejected', '❌ Rejected'], ['cancelled', '🚫 Ended']]
const TONE = { pending: 'gold', approved: 'green', rejected: 'red', cancelled: 'red' }
const STATUS_LABEL = { pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected', cancelled: '🚫 Membership ended' }
const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function downloadCsv(rows) {
  const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '')
  const born = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }) : '')
  const head = ['Name', 'Phone', 'Email', 'Date of birth', 'City', 'District', 'State', 'Status', 'Member no',
    'Applied on', 'Approved/Rejected on', 'Approved/Rejected by', 'Photo link', 'Assembly constituency no', 'Lok Sabha constituency no']
  const lines = rows.map((m) => [
    m.name, m.phone, m.email, born(m.dob), m.city, m.district, m.state, m.status, m.memberNo,
    when(m.createdAt), when(m.reviewedAt), m.reviewedByName, m.photo?.url, m.assemblyNo, m.lokSabhaNo,
  ])
  const csv = [head, ...lines]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  // The BOM makes Excel show Hindi text correctly.
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'members.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

// Opens WhatsApp with the message ready to send. You only press send.
function whatsappLink(m) {
  const link = `${window.location.origin}/card/${m.cardToken}`
  const text = `जय भीम ${m.name}! आपकी सदस्यता स्वीकार हो गई है। सदस्यता संख्या: ${m.memberNo}. अपना सदस्यता कार्ड यहाँ देखें: ${link}\n\nJai Bhim ${m.name}! Your membership is approved. Member no: ${m.memberNo}. See your card: ${link}`
  return `https://wa.me/91${m.phone}?text=${encodeURIComponent(text)}`
}


// District admins' word on an application. Everyone sees it; a District admin can give or change their own.
function Recommendations({ m, me, onSaved }) {
  const mine = m.recommendations?.find((r) => String(r.byId) === String(me.id))
  const [open, setOpen] = useState(false)
  const [verdict, setVerdict] = useState(mine?.verdict || 'good')
  const [note, setNote] = useState(mine?.note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canGive = me.role === 'districtadmin' && m.status === 'pending'
  if (!m.recommendations?.length && !canGive) return null

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post(`/members/${m._id}/recommend`, { verdict, note })
      setOpen(false)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {m.recommendations?.map((r) => (
        <p key={r.byId} className={`rounded-xl border-l-4 px-3 py-2 text-sm ${r.verdict === 'good' ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-400 bg-red-50 text-red-900'}`}>
          <b>{r.verdict === 'good' ? '👍 Recommended' : '⚠️ Concern'} by {r.byName}</b> (District admin){r.note ? `: ${r.note}` : ''}
        </p>
      ))}
      {canGive && !open && (
        <button onClick={() => setOpen(true)} className="abtn min-h-9 px-3">🗳️ {mine ? 'Change my recommendation' : 'Give my recommendation'}</button>
      )}
      {canGive && open && (
        <form onSubmit={save} className="rounded-xl bg-mist/60 p-3">
          <div role="radiogroup" aria-label="Your recommendation" className="flex flex-wrap gap-2">
            {[['good', '👍 I know this person'], ['concern', '⚠️ I have a concern']].map(([key, label]) => (
              <label key={key} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${verdict === key ? 'border-brand bg-white text-brand' : 'border-brand/15 text-navy/70'}`}>
                <input type="radio" name={`rec-${m._id}`} value={key} checked={verdict === key} onChange={() => setVerdict(key)} className="accent-brand" />
                {label}
              </label>
            ))}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength="300" required={verdict === 'concern'}
            placeholder={verdict === 'concern' ? 'What is the concern? (needed)' : 'A short note (optional)'} className="input mt-2 min-h-10 py-2 text-sm" />
          {error && <p className="mt-2 text-sm text-red-700">⚠️ {error}</p>}
          <div className="mt-2 flex gap-2">
            <button disabled={busy} className="abtn-primary min-h-9 px-3">{busy ? 'Saving…' : '💾 Save'}</button>
            <button type="button" onClick={() => setOpen(false)} className="abtn min-h-9 px-3">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function Members() {
  const { refresh, me } = useOutletContext()
  const myState = ['stateadmin', 'districtadmin'].includes(me.role) ? stateByCode(me.state) : null
  const viewOnly = me.role === 'districtadmin' // District admins see and recommend; the state team decides
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState([])
  const [progress, setProgress] = useState('')
  const [note, setNote] = useState('')

  const [q, setQ] = useState('')
  const [stateF, setStateF] = useState('')
  const [districtF, setDistrictF] = useState('')

  // Choices for the State and District boxes, taken from the applications in this tab
  const clean = (v) => (v || '').trim()
  const states = useMemo(() => [...new Set((items || []).map((m) => clean(m.state)).filter(Boolean))].sort(), [items])
  const districts = useMemo(() => [...new Set((items || [])
    .filter((m) => !stateF || clean(m.state) === stateF)
    .map((m) => clean(m.district)).filter(Boolean))].sort(), [items, stateF])

  // Search by name, phone, email, member no, city or district
  const shown = useMemo(() => {
    const text = q.trim().toLowerCase()
    const digits = text.replace(/\D/g, '')
    return (items || []).filter((m) => {
      if (stateF && clean(m.state) !== stateF) return false
      if (districtF && clean(m.district) !== districtF) return false
      if (!text) return true
      const words = [m.name, m.email, m.memberNo, m.city, m.district].join(' ').toLowerCase()
      return words.includes(text) || (digits.length >= 3 && String(m.phone || '').replace(/\D/g, '').includes(digits))
    })
  }, [items, q, stateF, districtF])
  const filtering = q || stateF || districtF
  const clearFilters = () => { setQ(''); setStateF(''); setDistrictF('') }

  // Only people who are still on screen stay ticked after the search changes
  useEffect(() => { setPicked((p) => p.filter((id) => shown.some((m) => m._id === id))) }, [shown])
  const allPicked = shown.length > 0 && shown.every((m) => picked.includes(m._id))

  const load = () => api.get(`/members?status=${status}`).then(setItems).catch((e) => setError(e.message))
  useEffect(() => { setItems(null); setError(''); setPicked([]); load() }, [status])

  // Approve or reject many applications at once
  const isPicked = (id) => picked.includes(id)
  const togglePick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  async function bulk(newStatus) {
    const word = newStatus === 'approved' ? 'Approve' : 'Reject'
    if (!window.confirm(`${word} ${picked.length} application(s)?${newStatus === 'approved' ? ' Each person gets their membership card by email.' : ''}`)) return
    setError('')
    setNote('')
    let done = 0
    const failed = []
    // One by one, so each person's card email goes out and is recorded properly
    for (const id of picked) {
      setProgress(`${word === 'Approve' ? 'Approving' : 'Rejecting'} ${done + failed.length + 1} of ${picked.length}...`)
      try {
        await api.patch(`/members/${id}/status`, { status: newStatus })
        done++
      } catch (err) {
        failed.push(`${items.find((m) => m._id === id)?.name || id}: ${err.message}`)
      }
    }
    setProgress('')
    setPicked([])
    if (done) setNote(`${done} application(s) ${newStatus}.`)
    if (failed.length) setError(`Could not update ${failed.length}: ${failed.join('; ')}`)
    await load()
    refresh()
  }

  async function act(fn) {
    try {
      await fn()
      await load()
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  function endMembership(m) {
    const reason = window.prompt(`End the membership of ${m.name} (${m.memberNo})?\n\nTheir card will show "NOT VALID" when scanned. You can restore it later.\n\nReason (optional):`, '')
    if (reason === null) return // pressed Cancel
    act(() => api.patch(`/members/${m._id}/status`, { status: 'cancelled', reason }))
  }

  const remove = (id) => {
    if (window.confirm('Delete this application permanently?')) act(() => api.del(`/members/${id}`))
  }

  return (
    <>
      <PageHeader title="Members" subtitle="Review the applications that come from the Join page.">
        {shown.length > 0 && !viewOnly && (
          <button onClick={() => downloadCsv(shown)} className="abtn">📥 Download Excel ({shown.length})</button>
        )}
      </PageHeader>

      {myState && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-brand">
          📍 You are seeing only members from {me.district ? `${me.district} district, ` : ''}{myState.en}.{viewOnly && ' Give your recommendation on new applications; the state team approves them.'}
        </p>
      )}

      <div role="group" aria-label="Filter by status" className="mb-5 flex w-full gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto">
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setStatus(key)} aria-pressed={status === key}
            className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition sm:flex-none sm:px-5 ${status === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
        ))}
      </div>

      {items?.length > 0 && (
        <div className="card mb-5 flex flex-wrap items-center gap-2 p-3 sm:p-3">
          <label className="relative min-w-60 flex-[2]">
            <span className="sr-only">Search</span>
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-navy/40">🔍</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email or member no."
              className="input min-h-10 py-2 pl-10" />
          </label>
          {!myState && <select aria-label="State" value={stateF} onChange={(e) => { setStateF(e.target.value); setDistrictF('') }} className="input min-h-10 min-w-40 flex-1 py-2">
            <option value="">📍 All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>}
          <select aria-label="District" value={districtF} onChange={(e) => setDistrictF(e.target.value)} className="input min-h-10 min-w-40 flex-1 py-2">
            <option value="">🏘️ All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {filtering && (
            <button onClick={clearFilters} className="abtn min-h-10 px-3"><Icon name="close" size={16} /> Clear</button>
          )}
          <p className="w-full px-1 text-xs text-navy/60">
            Showing <b className="text-navy">{shown.length}</b> of {items.length} {status} applications
          </p>
        </div>
      )}

      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {shown.length > 0 && !viewOnly && (
        <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy/75">
          <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? [] : shown.map((m) => m._id))} className="h-5 w-5 accent-brand" />
          Select all {shown.length} shown
        </label>
      )}
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No {status} applications.</p>}
      {items?.length > 0 && shown.length === 0 && (
        <p className="card text-center text-navy/70">🔍 No one matches your search. <button onClick={clearFilters} className="font-semibold text-brand underline">Clear search</button></p>
      )}

      <ul className="grid gap-4 xl:grid-cols-2">
        {shown.map((m) => (
          <li key={m._id} className={`card flex flex-col p-4 sm:p-5 ${isPicked(m._id) ? 'ring-2 ring-brand' : ''}`}>
            <div className="flex items-start gap-3">
              {!viewOnly && <input type="checkbox" checked={isPicked(m._id)} onChange={() => togglePick(m._id)} aria-label={`Select ${m.name}`}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-brand" />}
              {m.photo?.url
                ? <img src={portrait(m.photo.url, 120)} alt="" className="h-20 w-16 shrink-0 object-cover shadow-sm" />
                : <span aria-hidden="true" className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-mist text-2xl">👤</span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-lg leading-tight font-bold">{m.name}</div>
                  <Pill tone={TONE[m.status]}>{STATUS_LABEL[m.status] || m.status}</Pill>
                </div>
                <div className="mt-1 space-y-0.5 text-sm text-navy/75">
                  <div>📞 {m.phone}{m.email ? <span className="break-all"> · ✉️ {m.email}</span> : ''}</div>
                  {m.dob && <div>🎂 Born {new Date(m.dob).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</div>}
                  {[m.city, m.district, m.state].some(Boolean) && <div>📍 {[m.city, m.district, m.state].filter(Boolean).join(', ')}</div>}
                  {(m.assemblyNo || m.lokSabhaNo) && (
                    <div>
                      🗳️ {m.assemblyNo ? `Assembly no. ${m.assemblyNo}` : ''}
                      {m.assemblyNo && m.lokSabhaNo ? ' · ' : ''}
                      {m.lokSabhaNo ? `Lok Sabha no. ${m.lokSabhaNo}` : ''}
                    </div>
                  )}
                  <div>🗓️ Applied {when(m.createdAt)}</div>
                  {m.referredBy?.name && <div>🤝 Invited by {m.referredBy.name}{m.referredBy.memberNo ? ` (${m.referredBy.memberNo})` : ''}</div>}
                  {m.detailsUpdatedAt && <div>✏️ Updated own details {when(m.detailsUpdatedAt)}</div>}
                </div>
              </div>
            </div>

            {m.reviewedAt && m.status !== 'pending' && (
              <div className="mt-3 rounded-xl bg-mist/60 px-3 py-2 text-sm font-semibold text-navy/80">
                {{ approved: '✅ Approved', rejected: '❌ Rejected', cancelled: '🚫 Membership ended' }[m.status]} by {m.reviewedByName || 'an admin'} on {when(m.reviewedAt)}
                {m.status === 'cancelled' && m.endReason && <div className="mt-1 font-normal">Reason: {m.endReason}</div>}
              </div>
            )}
            {m.message && <p className="mt-3 rounded-xl border-l-4 border-gold bg-gold/5 px-3 py-2 text-sm text-navy/80">💬 {m.message}</p>}
            <Recommendations m={m} me={me} onSaved={load} />

            {m.status === 'approved' && m.memberNo && (
              <div className="mt-3 border-t border-brand/10 pt-3">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Pill tone="blue">🪪 {m.memberNo}</Pill>
                  {m.email && (
                    <Pill tone={m.cardEmailedAt ? 'green' : 'gold'}>{m.cardEmailedAt ? '📧 Card emailed' : '📭 Card not emailed'}</Pill>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/card/${m.cardToken}`} target="_blank" rel="noreferrer" className="abtn min-h-9 px-3">🪪 Open card</a>
                  <a href={whatsappLink(m)} target="_blank" rel="noreferrer" className="abtn min-h-9 border-green-300 px-3 text-green-800 hover:border-green-500 hover:text-green-900">💬 WhatsApp</a>
                  {m.email && !viewOnly && (
                    <button onClick={() => act(() => api.post(`/members/${m._id}/send-card`))} className="abtn min-h-9 px-3">
                      📧 {m.cardEmailedAt ? 'Email again' : 'Email card'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!viewOnly && <div className="flex flex-wrap gap-2 pt-3">
              {m.status === 'approved' && (
                <button onClick={() => endMembership(m)} className="abtn min-h-9 border-red-200 px-3 text-red-700 hover:border-red-400 hover:text-red-800">🚫 End membership</button>
              )}
              {m.status === 'cancelled' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'approved' }))} className="abtn-primary min-h-9 px-3">♻️ Restore membership</button>
              )}
              {(m.status === 'pending' || m.status === 'rejected') && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'approved' }))} className="abtn-primary min-h-9 px-3">✅ Approve</button>
              )}
              {m.status === 'pending' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'rejected' }))} className="abtn min-h-9 px-3">❌ Reject</button>
              )}
              <button onClick={() => remove(m._id)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>
            </div>}
          </li>
        ))}
      </ul>

      {/* Floating bar while applications are ticked */}
      {picked.length > 0 && (
        <div className="sticky bottom-4 z-30 mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-white shadow-2xl">
          <span className="mr-auto font-semibold">☑️ {progress || `${picked.length} selected`}</span>
          {!progress && status !== 'approved' && (
            <button onClick={() => bulk('approved')} className="abtn min-h-9 border-0 bg-green-500 px-4 text-white hover:bg-green-600 hover:text-white">✅ Approve all</button>
          )}
          {!progress && status === 'pending' && (
            <button onClick={() => bulk('rejected')} className="abtn min-h-9 border-0 bg-white/15 px-4 text-white hover:bg-red-500 hover:text-white">❌ Reject all</button>
          )}
          {!progress && <button onClick={() => setPicked([])} className="min-h-9 px-2 text-sm text-white/70 underline hover:text-white">Clear</button>}
        </div>
      )}
    </>
  )
}
