import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { portrait } from '../../lib/img.js'
import { STATES, stateByCode } from '../../data/states.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const EMPTY = { level: 'national', state: '', nameHi: '', nameEn: '', roleHi: '', roleEn: '', areaHi: '', areaEn: '', phone: '', order: '' }
const TEXTS = [
  ['nameHi', 'Name (Hindi)'], ['nameEn', 'Name (English)'],
  ['roleHi', 'Post (Hindi), like प्रदेश अध्यक्ष'], ['roleEn', 'Post (English), like State President'],
]
const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))

export default function Leaders() {
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [editing, setEditing] = useState(null)
  const [show, setShow] = useState('all') // which leaders the list shows
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const load = () => api.get('/leaders').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  function reset() {
    setForm(EMPTY)
    setFile(null)
    setRemovePhoto(false)
    setEditing(null)
    setFormKey((k) => k + 1) // empties the file box
  }

  function startEdit(l) {
    setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, l[k] == null ? '' : String(l[k])])))
    setFile(null)
    setRemovePhoto(false)
    setEditing(l)
    setError('')
    setNote('')
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNote('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (file) data.append('photo', file)
      if (removePhoto) data.append('removePhoto', 'true')
      if (editing) await api.put(`/leaders/${editing._id}`, data)
      else await api.post('/leaders', data)
      setNote('Saved.')
      reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(l) {
    if (!window.confirm(`Delete ${l.nameEn || l.nameHi}? This cannot be undone.`)) return
    try {
      await api.del(`/leaders/${l._id}`)
      if (editing?._id === l._id) reset()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const count = (code) => (items || []).filter((l) => (code === 'national' ? l.level === 'national' : l.state === code)).length
  const shown = (items || []).filter((l) => show === 'all' || (show === 'national' ? l.level === 'national' : l.state === show))
  const where = (l) => (l.level === 'national' ? 'National' : stateByCode(l.state)?.en || l.state)

  return (
    <>
      <PageHeader title="Leadership" subtitle="National leaders show on the About page. State leaders show on each state's page." />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form key={formKey} onSubmit={submit} className="card flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">{editing ? 'Edit leader' : 'Add a leader'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-semibold">Leadership
              <select value={form.level} onChange={set('level')} className="input">
                <option value="national">National</option>
                <option value="state">State</option>
              </select>
            </label>
            {form.level === 'state' && (
              <label className="flex flex-col gap-1 font-semibold">State
                <select required value={form.state} onChange={set('state')} className="input">
                  <option value="">Choose...</option>
                  {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TEXTS.map(([f, label]) => (
              <label key={f} className="flex flex-col gap-1 font-semibold">{label}
                <input value={form[f]} onChange={set(f)} maxLength="100" className="input" />
              </label>
            ))}
            {form.level === 'state' && [['areaHi', 'District / area (Hindi, optional)'], ['areaEn', 'District / area (English, optional)']].map(([f, label]) => (
              <label key={f} className="flex flex-col gap-1 font-semibold">{label}
                <input value={form[f]} onChange={set(f)} maxLength="100" className="input" />
              </label>
            ))}
            <label className="flex flex-col gap-1 font-semibold">Public phone (optional)
              <input type="tel" value={form.phone} onChange={set('phone')} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">Order (1 shows first)
              <input type="number" min="0" value={form.order} onChange={set('order')} className="input" />
            </label>
          </div>
          <label className="flex flex-col gap-1 font-semibold">
            {editing?.photo ? 'Replace photo (leave empty to keep it)' : 'Photo (optional)'}
            <span className="text-sm font-normal text-navy/70">A clear face photo, JPG, PNG or WebP, up to 5 MB</span>
            {editing?.photo && <img src={portrait(editing.photo, 120)} alt="" className="h-24 w-18 rounded-lg object-cover" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} className="font-normal" />
          </label>
          {editing?.photo && !file && (
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} className="h-5 w-5" />
              Remove the photo
            </label>
          )}
          <Notice>{error}</Notice>
          <Notice kind="success">{note}</Notice>
          <div className="flex gap-3">
            <button disabled={busy} className="btn flex-1 bg-brand text-white disabled:opacity-60">
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Add leader'}
            </button>
            {editing && <button type="button" onClick={reset} className="abtn min-h-12">Cancel</button>}
          </div>
        </form>

        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">Leaders {items && `(${shown.length})`}</h2>
            <select aria-label="Show" value={show} onChange={(e) => setShow(e.target.value)} className="input w-auto">
              <option value="all">Everyone</option>
              <option value="national">National ({count('national')})</option>
              {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en} ({count(s.code)})</option>)}
            </select>
          </div>
          {!items && <p>Loading...</p>}
          {items && shown.length === 0 && <p className="text-navy/70">No leaders here yet. Use the form to add one.</p>}
          <ul className="flex flex-col gap-3">
            {shown.map((l) => (
              <li key={l._id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${editing?._id === l._id ? 'border-brand bg-mist' : 'border-brand/15'}`}>
                {l.photo
                  ? <img src={portrait(l.photo, 120)} alt="" className="h-16 w-12 rounded-md object-cover" />
                  : <span className="h-16 w-12 rounded-md bg-navy/10" />}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{l.nameEn || l.nameHi}</div>
                  <div className="text-sm text-navy/70">{l.roleEn || l.roleHi}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Pill tone={l.level === 'national' ? 'gold' : 'blue'}>{where(l)}</Pill>
                    {l.order ? <Pill tone="gray">Order {l.order}</Pill> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(l)} className="abtn">Edit</button>
                  <button onClick={() => remove(l)} className="abtn-danger">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}