import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading } from './ui.jsx'
import LoginHistory from './LoginHistory.jsx'

const SECTIONS = [
  ['news', 'News'], ['events', 'Events'], ['gallery', 'Gallery'], ['slides', 'Home Slider'],
  ['leaders', 'Leadership'], ['announcements', 'Home Updates'], ['members', 'Members'],
  ['contact', 'Messages'], ['certificates', 'Certificates'], ['donations', 'Donations'], ['admins', 'Team & Roles'], ['auth', 'Security'],
]
const SECTION_NAME = Object.fromEntries(SECTIONS)

// Emoji and colour for each kind of change
const LOOK = {
  create: ['➕', 'bg-green-100'], update: ['✏️', 'bg-blue-100'], delete: ['🗑️', 'bg-red-100'],
  approve: ['✅', 'bg-green-100'], reject: ['❌', 'bg-red-100'], email: ['📧', 'bg-blue-100'],
  read: ['👁️', 'bg-mist'], role: ['🎭', 'bg-gold/30'], disable: ['🚫', 'bg-red-100'],
  enable: ['▶️', 'bg-green-100'], security: ['🔐', 'bg-gold/30'],
}

const dayLabel = (d) => {
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(Date.now() - 864e5)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
const time = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export default function Activity() {
  const [items, setItems] = useState(null)
  const [people, setPeople] = useState([])
  const [more, setMore] = useState(false)
  const [person, setPerson] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('changes')

  const query = (before) => {
    const p = new URLSearchParams()
    if (person) p.set('admin', person)
    if (section) p.set('section', section)
    if (before) p.set('before', before)
    return `/activity?${p}`
  }

  useEffect(() => {
    setItems(null)
    setError('')
    api.get(query()).then((r) => { setItems(r.items); setPeople(r.people); setMore(r.more) }).catch((e) => setError(e.message))
  }, [person, section])

  async function loadMore() {
    setBusy(true)
    try {
      const r = await api.get(query(items[items.length - 1].createdAt))
      setItems([...items, ...r.items])
      setMore(r.more)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Group the entries by day
  const days = []
  for (const it of items || []) {
    const label = dayLabel(it.createdAt)
    if (days.at(-1)?.label !== label) days.push({ label, list: [] })
    days.at(-1).list.push(it)
  }

  return (
    <>
      <PageHeader title="Activity Log" subtitle="Every change made in the admin panel, and every login: who, what and when." />

      <div role="tablist" className="mb-5 inline-flex gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm">
        {[['changes', '📝 Changes'], ['logins', '🔑 Logins']].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`min-h-10 rounded-xl px-5 text-sm font-semibold transition ${tab === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'logins' ? <LoginHistory /> : (
        <>

          <div className="card mb-5 flex flex-wrap items-center gap-2 p-3 sm:p-3">
            <select aria-label="Person" value={person} onChange={(e) => setPerson(e.target.value)} className="input min-h-10 min-w-48 flex-1 py-2">
              <option value="">👤 Everyone</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select aria-label="Section" value={section} onChange={(e) => setSection(e.target.value)} className="input min-h-10 min-w-48 flex-1 py-2">
              <option value="">📂 All sections</option>
              {SECTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          <Notice>{error}</Notice>
          {!items && !error && <ListLoading />}
          {items?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing recorded yet. Changes made from now on will appear here.</p>}

          <div className="flex flex-col gap-5">
            {days.map((day) => (
              <section key={day.label}>
                <h2 className="mb-2 text-sm font-bold tracking-wide text-navy/60 uppercase">📅 {day.label}</h2>
                <ul className="card divide-y divide-brand/10 p-0 sm:p-0">
                  {day.list.map((it) => {
                    const [emoji, tile] = LOOK[it.action] || ['•', 'bg-mist']
                    return (
                      <li key={it._id} className="flex items-start gap-3 px-4 py-3">
                        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tile}`}>{emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-navy/90">
                            <b>{it.adminName || 'An admin'}</b> {it.text}
                            {it.target && <> <b className="text-brand">“{it.target}”</b></>}
                          </p>
                          <p className="text-xs text-navy/55">
                            🕒 {time(it.createdAt)}
                            {SECTION_NAME[it.section] && <> · {SECTION_NAME[it.section]}</>}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>

          {more && (
            <div className="mt-5 text-center">
              <button onClick={loadMore} disabled={busy} className="abtn">{busy ? 'Loading...' : '⬇️ Load older activity'}</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
