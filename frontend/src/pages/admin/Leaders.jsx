import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { portrait } from '../../lib/img.js'
import { STATES, stateByCode } from '../../data/states.js'
import { PageHeader, Notice, ListLoading, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import BoxIcon from '../../components/BoxIcon.jsx'

const EMPTY = { level: 'national', state: '', nameHi: '', nameEn: '', roleHi: '', roleEn: '', areaHi: '', areaEn: '', phone: '', order: '' }
const TEXTS = [
  ['nameHi', 'Name (Hindi)'], ['nameEn', 'Name (English)'],
  ['roleHi', 'Post (Hindi), like प्रदेश अध्यक्ष'], ['roleEn', 'Post (English), like State President'],
]
const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))

export default function Leaders() {
  // A State admin works only on their own state's leaders
  const { me } = useOutletContext()
  const myState = me.role === 'stateadmin' ? me.state : null
  const blank = myState ? { ...EMPTY, level: 'state', state: myState } : EMPTY
  const [items, setItems] = useState(null)
  const [form, setForm] = useState(blank)
  const [file, setFile] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [editing, setEditing] = useState(null)
  const [show, setShow] = useState('all') // which leaders the list shows
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const load = () => api.get('/leaders').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  function reset() {
    setForm(blank)
    setFile(null)
    setRemovePhoto(false)
    setEditing(null)
    setAdding(false)
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

  // Districts already used in the chosen state, offered while typing a district name
  const knownDistricts = (field) => {
    const seen = new Map() // one spelling per name, ignoring capitals
    for (const l of items || []) if (l.level === 'district' && l.state === form.state && l[field]) seen.set(l[field].trim().toLowerCase(), l[field].trim())
    return [...seen.values()].sort()
  }

  const count = (code) => (items || []).filter((l) => (code === 'national' ? l.level === 'national' : l.state === code)).length
  const shown = (items || []).filter((l) => (myState ? l.state === myState
    : show === 'all' || (show === 'national' ? l.level === 'national' : l.state === show)))
  const stateOf = (l) => stateByCode(l.state)?.en || l.state
  const where = (l) => (l.level === 'national' ? 'National' : l.level === 'district' ? `${l.areaEn || l.areaHi}, ${stateOf(l)}` : stateOf(l))

  const showForm = adding || !!editing

  return (
    <>
      <PageHeader title="Leadership" subtitle="National leaders show on the About page. State and district teams show on each state's page.">
        {!showForm && <button onClick={() => { setAdding(true); setError(''); setNote('') }} className="abtn-primary">➕ Add leader</button>}
      </PageHeader>
      <Notice kind="success">{note}</Notice>

      {myState && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-mist px-4 py-2.5 text-sm font-semibold text-brand">
          📍 You can add and edit leaders of {stateByCode(myState)?.en} only.
        </p>
      )}

      {showForm && (
        <form key={formKey} onSubmit={submit} className="card mb-6 border-brand/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{editing ? '✏️ Edit leader' : '➕ Add a leader'}</h2>
            <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1 font-semibold">🏛️ Leadership
              <select value={form.level} onChange={set('level')} className="input">
                {!myState && <option value="national">National</option>}
                <option value="state">State team</option>
                <option value="district">District team</option>
              </select>
            </label>
            {!myState && form.level !== 'national' && (
              <label className="flex flex-col gap-1 font-semibold">📍 State
                <select required value={form.state} onChange={set('state')} className="input">
                  <option value="">Choose...</option>
                  {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                </select>
              </label>
            )}
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
            {/* A district team member: the district's name (Hindi or English, at least one). Same spelling = same district. */}
            {form.level === 'district' && [['areaHi', '🏘️ District (Hindi), like देवरिया'], ['areaEn', '🏘️ District (English), like Deoria']].map(([f, label]) => (
              <label key={f} className="flex flex-col gap-1 font-semibold">{label}
                <input value={form[f]} onChange={set(f)} maxLength="100" list={`districts-${f}`} required={!form.areaHi && !form.areaEn} className="input" />
                <datalist id={`districts-${f}`}>{knownDistricts(f).map((d) => <option key={d} value={d} />)}</datalist>
              </label>
            ))}
            {form.level === 'district' && (
              <p className="rounded-lg bg-mist/70 px-3 py-2 text-xs font-normal text-navy/70 sm:col-span-2 xl:col-span-4">
                💡 People with the same district name are shown together on the state page. Pick the name from the list if the district already has members, so it is spelled the same way.
              </p>
            )}
            <label className="flex flex-col gap-1 font-semibold">📞 Public phone (optional)
              <input type="tel" value={form.phone} onChange={set('phone')} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">🔢 Order (1 shows first)
              <input type="number" min="0" value={form.order} onChange={set('order')} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold sm:col-span-2">
              📷 {editing?.photo ? 'Replace photo (leave empty to keep it)' : 'Photo (optional)'}
              <span className="flex items-center gap-3">
                {editing?.photo && <img src={portrait(editing.photo, 120)} alt="" className="h-12 w-9 rounded-lg object-cover" />}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} className="file-pick min-w-0 flex-1" />
              </span>
              <span className="text-xs font-normal text-navy/60">A clear face photo, JPG, PNG or WebP, up to 5 MB</span>
            </label>
          </div>
          {editing?.photo && !file && (
            <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} className="h-5 w-5" />
              Remove the photo
            </label>
          )}
          {error && <div className="mt-3"><Notice>{error}</Notice></div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={reset} className="abtn min-h-11">Cancel</button>
            <button disabled={busy} className="abtn-primary min-h-11 px-6">
              {busy ? 'Saving...' : editing ? '💾 Save changes' : '✅ Add leader'}
            </button>
          </div>
        </form>
      )}

      {!showForm && <Notice>{error}</Notice>}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">👥 Leaders {items && `(${shown.length})`}</h2>
        {!myState && <select aria-label="Show" value={show} onChange={(e) => setShow(e.target.value)} className="input min-h-10 w-auto max-w-xs py-1.5 text-sm">
          <option value="all">Everyone</option>
          <option value="national">National ({count('national')})</option>
          {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en} ({count(s.code)})</option>)}
        </select>}
      </div>
      {!items && <ListLoading />}
      {items && shown.length === 0 && <p className="card text-center text-navy/70">📭 No leaders here yet. Click "Add leader" to add one.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((l) => (
          <li key={l._id} className={`card flex flex-col p-4 sm:p-4 ${editing?._id === l._id ? 'ring-2 ring-brand' : ''}`}>
            <div className="flex items-start gap-3">
              {l.photo
                ? <img src={portrait(l.photo, 120)} alt="" className="h-20 w-15 shrink-0 object-cover shadow-sm" />
                : <span className="flex h-20 w-15 shrink-0 items-center justify-center rounded-lg bg-mist text-brand/50" aria-hidden="true"><BoxIcon name="user" size={28} /></span>}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 leading-tight font-bold">{l.nameEn || l.nameHi}</div>
                <div className="truncate text-sm text-navy/70">{l.roleEn || l.roleHi}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone={l.level === 'national' ? 'gold' : l.level === 'district' ? 'green' : 'blue'}>{l.level === 'national' ? '🏛️' : l.level === 'district' ? '🏘️' : '📍'} {where(l)}</Pill>
                  {l.order ? <Pill tone="gray">#{l.order}</Pill> : null}
                </div>
                {l.phone && <div className="mt-1 text-xs text-navy/60">📞 {l.phone}</div>}
              </div>
            </div>
            <div className="mt-auto flex gap-2 pt-3">
              <button onClick={() => startEdit(l)} className="abtn min-h-9 flex-1 px-3">✏️ Edit</button>
              <button onClick={() => remove(l)} className="abtn-danger min-h-9 flex-1 px-3">🗑️ Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
