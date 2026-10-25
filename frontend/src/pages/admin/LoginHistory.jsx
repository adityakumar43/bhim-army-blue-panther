import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const deviceEmoji = (d = '') => (/iPhone|Android|iPad/.test(d) ? '📱' : '💻')

// List of admin-panel logins. mine = only my own logins (used on the Security page)
export default function LoginHistory({ mine = false, limit = 100 }) {
  const [items, setItems] = useState(null)
  const [people, setPeople] = useState([])
  const [person, setPerson] = useState('')
  const [failedOnly, setFailedOnly] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const p = new URLSearchParams({ limit: String(limit) })
    if (mine) p.set('mine', '1')
    if (person) p.set('admin', person)
    if (failedOnly) p.set('failed', '1')
    setItems(null)
    api.get(`/logins?${p}`).then((r) => { setItems(r.items); setPeople(r.people) }).catch((e) => setError(e.message))
  }, [mine, person, failedOnly, limit])

  return (
    <div>
      {!mine && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 p-3 sm:p-3">
          <select aria-label="Person" value={person} onChange={(e) => setPerson(e.target.value)} className="input min-h-10 min-w-48 flex-1 py-2">
            <option value="">👤 Everyone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} className="h-5 w-5 accent-brand" />
            ❌ Failed tries only
          </label>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No logins recorded yet.</p>}
      {items?.length > 0 && (
        <ul className="card divide-y divide-brand/10 p-0 sm:p-0">
          {items.map((l) => (
            <li key={l._id} className="flex items-start gap-3 px-4 py-3">
              <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${l.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {l.success ? '✅' : '❌'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-navy/90">
                  {!mine && <b>{l.name || l.email} </b>}
                  {l.success
                    ? <>{mine ? 'Logged in' : 'logged in'} <span className="text-navy/60">{l.reason}</span></>
                    : <span className="font-semibold text-red-700">{mine ? 'Failed login' : 'failed to log in'}: {l.reason}</span>}
                </p>
                <p className="text-xs text-navy/55">
                  🕒 {when(l.createdAt)} · {deviceEmoji(l.device)} {l.device} · 🌐 {l.ip}
                  {!l.name && l.email && <> · ✉️ {l.email}</>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
