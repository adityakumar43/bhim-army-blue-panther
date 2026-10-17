import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice } from './ui.jsx'

const KINDS = {
  news: {
    label: 'News', hint: 'Shown on the Home page and the News page.', endpoint: '/news', needImage: false,
    fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn'],
  },
  events: {
    label: 'Events', hint: 'Programs and meetings, shown on the News page.', endpoint: '/events', needImage: false,
    fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn', 'date', 'location'],
  },
  gallery: {
    label: 'Gallery', hint: 'Photos shown on the Gallery page.', endpoint: '/gallery', needImage: true,
    fields: ['titleHi', 'titleEn'],
  },
}

KINDS.slides = {
  label: 'Home slider',
  hint: 'Big pictures that slide automatically at the top of the Home page. 3 to 6 wide photos work best (about 1600 x 700 pixels).',
  endpoint: '/slides', needImage: true, untitled: '(no caption)',
  fields: ['titleHi', 'titleEn', 'link', 'order'],
  labels: {
    titleHi: 'Caption (Hindi, optional)', titleEn: 'Caption (English, optional)',
    link: 'Link when clicked (optional), like /join or https://...', order: 'Order (1 shows first)',
  },
}

const LABELS = {
  titleHi: 'Title (Hindi)', titleEn: 'Title (English)',
  bodyHi: 'Details (Hindi)', bodyEn: 'Details (English)',
  date: 'Date', location: 'Location',
}

export default function Content({ kind }) {
  const config = KINDS[kind]
  const [items, setItems] = useState(null)
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const load = () => api.get(config.endpoint).then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [config.endpoint])

  function reset() {
    setForm({})
    setFile(null)
    setEditing(null)
    setFormKey((k) => k + 1) // remounts the form so the inputs empty out
  }

  function startEdit(item) {
    const values = {}
    config.fields.forEach((f) => {
      values[f] = f === 'date' && item.date ? item.date.slice(0, 10) : item[f] || ''
    })
    setForm(values)
    setFile(null)
    setEditing(item)
    setError('')
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = new FormData()
      // Empty values are sent too, so a field can be cleared while editing.
      config.fields.forEach((f) => data.append(f, form[f] ?? ''))
      if (file) data.append('image', file)
      if (editing) await api.put(`${config.endpoint}/${editing._id}`, data)
      else await api.post(config.endpoint, data)
      reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return
    try {
      await api.del(`${config.endpoint}/${id}`)
      if (editing?._id === id) reset()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader title={config.label} subtitle={config.hint} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form key={formKey} onSubmit={submit} className="card flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">{editing ? 'Edit item' : `Add to ${config.label}`}</h2>
          {config.fields.map((f) => {
            const common = { className: 'input', defaultValue: form[f], onChange: (e) => setForm({ ...form, [f]: e.target.value }) }
            return (
              <label key={f} className="flex flex-col gap-1 font-semibold">
                {config.labels?.[f] || LABELS[f]}
                {f.startsWith('body') ? <textarea rows="4" {...common} />
                  : f === 'order' ? <input type="number" min="0" {...common} />
                  : f === 'date' ? <input type="date" required {...common} />
                  : <input type="text" {...common} />}
              </label>
            )
          })}
          <label className="flex flex-col gap-1 font-semibold">
            {editing ? 'Replace image (leave empty to keep the current one)' : `Image ${config.needImage ? '(required)' : '(optional)'}`}
            <span className="text-sm font-normal text-navy/70">JPG, PNG or WebP, up to 5 MB</span>
            {editing?.image?.url && <img src={editing.image.url} alt="" className="h-24 w-24 object-cover" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" required={config.needImage && !editing}
              onChange={(e) => setFile(e.target.files[0] || null)} className="font-normal" />
          </label>
          <Notice>{error}</Notice>
          <div className="flex gap-3">
            <button disabled={busy} className="btn flex-1 bg-brand text-white disabled:opacity-60">
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish'}
            </button>
            {editing && <button type="button" onClick={reset} className="abtn min-h-12">Cancel</button>}
          </div>
        </form>

        <section className="card">
          <h2 className="mb-4 text-xl font-extrabold">Published {items && `(${items.length})`}</h2>
          {!items && <p>Loading...</p>}
          {items?.length === 0 && <p className="text-navy/70">Nothing published yet. Use the form to add the first item.</p>}
          <ul className="flex flex-col gap-3">
            {items?.map((it) => (
              <li key={it._id}
                className={`flex flex-wrap items-center gap-3 border p-3 ${editing?._id === it._id ? 'border-brand bg-mist' : 'border-brand/15'}`}>
                {it.image?.url && <img src={it.image.url} alt="" className="h-16 w-16 object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{it.titleHi || it.titleEn || config.untitled || '(no title)'}</div>
                  {it.date && <div className="text-sm text-navy/70">{new Date(it.date).toLocaleDateString('en-IN')}</div>}
                  {it.order != null && <div className="text-sm text-navy/70">Order {it.order}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(it)} className="abtn">Edit</button>
                  <button onClick={() => remove(it._id)} className="abtn-danger">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
