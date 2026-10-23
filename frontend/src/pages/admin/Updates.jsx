import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const EMPTY = { textHi: '', textEn: '', link: '', important: false, startsAt: '', endsAt: '' }
const STATUS = { live: ['Showing now', 'green'], scheduled: ['Scheduled', 'gold'], expired: ['Ended', 'gray'] }
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const nice = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })

export default function Updates() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const load = () => api.get('/announcements').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  function reset() {
    setForm(EMPTY)
    setEditing(null)
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

  return (
    <>
      <PageHeader title="Home updates" subtitle='Short notices shown in the "Latest updates" bar at the top of the Home page.' />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form onSubmit={submit} className="card flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">{editing ? 'Edit update' : 'Add an update'}</h2>
          <label className="flex flex-col gap-1 font-semibold">Text (Hindi)
            <input value={form.textHi} onChange={set('textHi')} maxLength="200" className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">Text (English)
            <input value={form.textEn} onChange={set('textEn')} maxLength="200" className="input" />
            <span className="text-sm font-normal text-navy/70">Write in one or both languages, up to 200 letters each.</span>
          </label>
          <label className="flex flex-col gap-1 font-semibold">Link when clicked (optional)
            <input value={form.link} onChange={set('link')} placeholder="/join or https://..." className="input" />
          </label>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={form.important} onChange={set('important')} className="h-5 w-5" />
            Important (shown first, with an "Important" tag)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-semibold">Show from (optional)
              <input type="date" value={form.startsAt} onChange={set('startsAt')} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">Show until (optional)
              <input type="date" value={form.endsAt} onChange={set('endsAt')} className="input" />
            </label>
          </div>
          <p className="-mt-2 text-sm text-navy/70">Leave both dates empty to show it until you delete it. The last day counts as a full day.</p>
          <Notice>{error}</Notice>
          <Notice kind="success">{note}</Notice>
          <div className="flex gap-3">
            <button disabled={busy} className="btn flex-1 bg-brand text-white disabled:opacity-60">
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish'}
            </button>
            {editing && <button type="button" onClick={reset} className="abtn min-h-12">Cancel</button>}
          </div>
        </form>

        <section className="card">
          <h2 className="mb-4 text-xl font-extrabold">All updates {items && `(${items.length})`}</h2>
          {!items && <p>Loading...</p>}
          {items?.length === 0 && <p className="text-navy/70">No updates yet. Use the form to add the first one.</p>}
          <ul className="flex flex-col gap-3">
            {items?.map((a) => {
              const [label, tone] = STATUS[a.status] || STATUS.live
              return (
                <li key={a._id} className={`border p-3 ${editing?._id === a._id ? 'border-brand bg-mist' : 'border-brand/15'}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Pill tone={tone}>{label}</Pill>
                    {a.important && <Pill tone="gold">Important</Pill>}
                  </div>
                  {a.textEn && <p className="font-semibold">{a.textEn}</p>}
                  {a.textHi && <p className={a.textEn ? 'text-navy/80' : 'font-semibold'}>{a.textHi}</p>}
                  <div className="mt-1 text-sm text-navy/70">
                    {a.startsAt ? `From ${nice(a.startsAt)}` : 'Starts at once'}{' · '}{a.endsAt ? `Until ${nice(a.endsAt)}` : 'No end date'}
                    {a.link ? ` · Link: ${a.link}` : ''}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => startEdit(a)} className="abtn">Edit</button>
                    <button onClick={() => remove(a)} className="abtn-danger">Delete</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}