import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'

const EMPTY = { textHi: '', textEn: '', link: '', important: false, startsAt: '', endsAt: '' }
const STATUS = { live: ['🟢 Showing now', 'green'], scheduled: ['⏰ Scheduled', 'gold'], expired: ['⌛ Ended', 'gray'] }
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const nice = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })

export default function Updates() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const load = () => api.get('/announcements').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  function reset() {
    setForm(EMPTY)
    setEditing(null)
    setAdding(false)
  }

  function startEdit(a) {
    setForm({ textHi: a.textHi || '', textEn: a.textEn || '', link: a.link || '', important: !!a.important, startsAt: day(a.startsAt), endsAt: day(a.endsAt) })
    setEditing(a)
    setError('')
    setNote('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNote('')
    try {
      const body = { ...form, startsAt: form.startsAt || null, endsAt: form.endsAt || null }
      if (editing) await api.put(`/announcements/${editing._id}`, body)
      else await api.post('/announcements', body)
      setNote('Saved.')
      reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(a) {
    if (!window.confirm('Delete this update? It will disappear from the Home page.')) return
    try {
      await api.del(`/announcements/${a._id}`)
      if (editing?._id === a._id) reset()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const showForm = adding || !!editing

  return (
    <>
      <PageHeader title="Home updates" subtitle='Short notices shown in the "Latest updates" bar at the top of the Home page.'>
        {!showForm && <button onClick={() => { setAdding(true); setError(''); setNote('') }} className="abtn-primary">➕ Add update</button>}
      </PageHeader>
      <Notice kind="success">{note}</Notice>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 border-brand/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{editing ? '✏️ Edit update' : '➕ Add an update'}</h2>
            <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-semibold">Text (Hindi)
              <input value={form.textHi} onChange={set('textHi')} maxLength="200" className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">Text (English)
              <input value={form.textEn} onChange={set('textEn')} maxLength="200" className="input" />
            </label>
            <p className="-mt-1 text-xs text-navy/60 sm:col-span-2">Write in one or both languages, up to 200 letters each.</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1 font-semibold">🔗 Link when clicked (optional)
              <input value={form.link} onChange={set('link')} placeholder="/join or https://..." className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">📅 Show from (optional)
              <input type="date" value={form.startsAt} onChange={set('startsAt')} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">⌛ Show until (optional)
              <input type="date" value={form.endsAt} onChange={set('endsAt')} className="input" />
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl bg-gold/10 px-3 py-2.5 font-semibold">
              <input type="checkbox" checked={form.important} onChange={set('important')} className="h-5 w-5 accent-brand" />
              ⭐ Important (shown first)
            </label>
          </div>
          <p className="mt-2 text-xs text-navy/60">🕒 Leave both dates empty to show it until you delete it. Days follow Indian time: an update starts at 12:00 am on its first day and stays until 11:59 pm on its last day.</p>
          {error && <div className="mt-3"><Notice>{error}</Notice></div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={reset} className="abtn min-h-11">Cancel</button>
            <button disabled={busy} className="abtn-primary min-h-11 px-6">
              {busy ? 'Saving...' : editing ? '💾 Save changes' : '✅ Publish'}
            </button>
          </div>
        </form>
      )}

      {!showForm && <Notice>{error}</Notice>}
      <h2 className="mb-3 text-lg font-extrabold">📢 All updates {items && `(${items.length})`}</h2>
      {!items && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No updates yet. Click "Add update" to add the first one.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {items?.map((a) => {
          const [label, tone] = STATUS[a.status] || STATUS.live
          return (
            <li key={a._id} className={`card flex flex-col p-4 sm:p-4 ${editing?._id === a._id ? 'ring-2 ring-brand' : ''} ${a.important ? 'border-l-4 border-l-gold' : ''}`}>
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <Pill tone={tone}>{label}</Pill>
                {a.important && <Pill tone="gold">⭐ Important</Pill>}
              </div>
              {a.textEn && <p className="font-semibold">{a.textEn}</p>}
              {a.textHi && <p className={a.textEn ? 'text-navy/80' : 'font-semibold'}>{a.textHi}</p>}
              <div className="mt-1 text-xs text-navy/60">
                📅 {a.startsAt ? `From ${nice(a.startsAt)}` : 'Starts at once'}{' · '}{a.endsAt ? `Until ${nice(a.endsAt)}` : 'No end date'}
                {a.link ? ` · 🔗 ${a.link}` : ''}
              </div>
              <div className="mt-auto flex gap-2 pt-3">
                <button onClick={() => startEdit(a)} className="abtn min-h-9 flex-1 px-3">✏️ Edit</button>
                <button onClick={() => remove(a)} className="abtn-danger min-h-9 flex-1 px-3">🗑️ Delete</button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
