import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { portrait } from '../../lib/img.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const FILTERS = [['pending', '⏳ Pending'], ['approved', '✅ Approved'], ['rejected', '❌ Rejected']]
const TONE = { pending: 'gold', approved: 'green', rejected: 'red' }
const STATUS_LABEL = { pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected' }
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


export default function Members() {
  const { refresh } = useOutletContext()
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get(`/members?status=${status}`).then(setItems).catch((e) => setError(e.message))
  useEffect(() => { setItems(null); setError(''); load() }, [status])

  async function act(fn) {
    try {
      await fn()
      await load()
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = (id) => {
    if (window.confirm('Delete this application permanently?')) act(() => api.del(`/members/${id}`))
  }

  return (
    <>
      <PageHeader title="Members" subtitle="Review the applications that come from the Join page.">
        {items?.length > 0 && (
          <button onClick={() => downloadCsv(items)} className="abtn">📥 Download Excel (CSV)</button>
        )}
      </PageHeader>

      <div role="group" aria-label="Filter by status" className="mb-5 flex w-full gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto">
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setStatus(key)} aria-pressed={status === key}
            className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition sm:flex-none sm:px-5 ${status === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
        ))}
      </div>

      <Notice>{error}</Notice>
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No {status} applications.</p>}

      <ul className="grid gap-4 xl:grid-cols-2">
        {items?.map((m) => (
          <li key={m._id} className="card flex flex-col p-4 sm:p-5">
            <div className="flex items-start gap-3">
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
                </div>
              </div>
            </div>

            {m.reviewedAt && m.status !== 'pending' && (
              <div className="mt-3 rounded-xl bg-mist/60 px-3 py-2 text-sm font-semibold text-navy/80">
                {m.status === 'approved' ? '✅ Approved' : '❌ Rejected'} by {m.reviewedByName || 'an admin'} on {when(m.reviewedAt)}
              </div>
            )}
            {m.message && <p className="mt-3 rounded-xl border-l-4 border-gold bg-gold/5 px-3 py-2 text-sm text-navy/80">💬 {m.message}</p>}

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
                  {m.email && (
                    <button onClick={() => act(() => api.post(`/members/${m._id}/send-card`))} className="abtn min-h-9 px-3">
                      📧 {m.cardEmailedAt ? 'Email again' : 'Email card'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              {m.status !== 'approved' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'approved' }))} className="abtn-primary min-h-9 px-3">✅ Approve</button>
              )}
              {m.status !== 'rejected' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'rejected' }))} className="abtn min-h-9 px-3">❌ Reject</button>
              )}
              <button onClick={() => remove(m._id)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
