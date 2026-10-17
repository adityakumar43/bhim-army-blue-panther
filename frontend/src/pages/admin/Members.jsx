import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const FILTERS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']]
const TONE = { pending: 'gold', approved: 'green', rejected: 'red' }

function downloadCsv(rows) {
  const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '')
  const head = ['Name', 'Phone', 'Email', 'City', 'District', 'State', 'Status', 'Member no',
    'Applied on', 'Approved/Rejected on', 'Approved/Rejected by']
  const lines = rows.map((m) => [
    m.name, m.phone, m.email, m.city, m.district, m.state, m.status, m.memberNo,
    when(m.createdAt), when(m.reviewedAt), m.reviewedByName,
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
          <button onClick={() => downloadCsv(items)} className="abtn">Download Excel (CSV)</button>
        )}
      </PageHeader>

      <div role="group" aria-label="Filter by status" className="mb-5 flex w-full border border-navy/30 bg-white sm:inline-flex sm:w-auto">
        {FILTERS.map(([key, label]) => (
          <button key={key} onClick={() => setStatus(key)} aria-pressed={status === key}
            className={`  min-h-11 flex-1 px-3 font-semibold sm:flex-none sm:px-5 ${status === key ? 'bg-navy text-white' : ''}`}>{label}</button>
        ))}
      </div>

      <Notice>{error}</Notice>
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="text-navy/70">No {status} applications.</p>}

      <ul className="grid gap-4 xl:grid-cols-2">
        {items?.map((m) => (
          <li key={m._id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold">{m.name}</div>
                <div>{m.phone}{m.email ? ` · ${m.email}` : ''}</div>
                <div className="text-sm text-navy/70">
                  {[m.city, m.district, m.state].filter(Boolean).join(', ')}
                  {' · '}Applied {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                {m.reviewedAt && m.status !== 'pending' && (
                  <div className="text-sm font-semibold text-navy/80">
                    {m.status === 'approved' ? 'Approved' : 'Rejected'} by {m.reviewedByName || 'an admin'} on{' '}
                    {new Date(m.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                )}
              </div>
              <Pill tone={TONE[m.status]}>{m.status}</Pill>
            </div>
            {m.message && <p className="mt-3 border-l-4 border-mist pl-3 text-navy/80">{m.message}</p>}

            {m.status === 'approved' && m.memberNo && (
              <div className="mt-4 border-t border-brand/15 pt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Pill tone="blue">{m.memberNo}</Pill>
                  {m.email && (
                    <Pill tone={m.cardEmailedAt ? 'green' : 'gold'}>{m.cardEmailedAt ? 'Card emailed' : 'Card not emailed'}</Pill>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/card/${m.cardToken}`} target="_blank" rel="noreferrer" className="abtn">Open card</a>
                  <a href={whatsappLink(m)} target="_blank" rel="noreferrer" className="abtn">Send on WhatsApp</a>
                  {m.email && (
                    <button onClick={() => act(() => api.post(`/members/${m._id}/send-card`))} className="abtn">
                      {m.cardEmailedAt ? 'Email again' : 'Email card'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {m.status !== 'approved' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'approved' }))} className="abtn-primary">Approve</button>
              )}
              {m.status !== 'rejected' && (
                <button onClick={() => act(() => api.patch(`/members/${m._id}/status`, { status: 'rejected' }))} className="abtn">Reject</button>
              )}
              <button onClick={() => remove(m._id)} className="abtn-danger">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
