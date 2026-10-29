import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import RsvpList from './RsvpList.jsx'

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
    label: 'Gallery', hint: 'Photos shown on the Gallery page. Choose "Adivasi & tribal culture" for traditional dances and festivals.',
    endpoint: '/gallery', needImage: true,
    fields: ['titleHi', 'titleEn', 'section', 'kind', 'communityEn', 'communityHi'],
    labels: {
      titleHi: 'Caption (Hindi)', titleEn: 'Caption (English)', section: 'Where should it appear?',
      kind: 'Dance or festival?', communityEn: 'Community / tribe name (English)', communityHi: 'Community / tribe name (Hindi)',
    },
  },
}

KINDS.slides = {
  label: 'Home Slider',
  hint: 'Big pictures that slide automatically at the top of the Home page. 3 to 6 wide photos work best (about 1600 x 700 pixels).',
  endpoint: '/slides', needImage: true, untitled: '(no caption)',
  fields: ['titleHi', 'titleEn', 'link', 'order'],
  labels: {
    titleHi: 'Caption (Hindi, optional)', titleEn: 'Caption (English, optional)',
    link: 'Link when clicked (optional), like /join or https://...', order: 'Order (1 shows first)',
  },
}

// Publishing: live now, scheduled for later, or a draft (Indian time)
const toInput = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T').slice(0, 16)
const statusOf = (it) => (it.draft ? 'draft' : it.publishAt && new Date(it.publishAt) > new Date() ? 'scheduled' : 'live')
const niceTime = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
const WHEN = [['now', '🚀 Publish now'], ['later', '🕒 Schedule'], ['draft', '📝 Save as draft']]

const ADD_LABEL = { news: 'Add news', events: 'Add event', gallery: 'Add photo', slides: 'Add slide' }

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
  const [preview, setPreview] = useState('')
  const [adding, setAdding] = useState(false)
  const [when, setWhen] = useState('now')
  const [rsvps, setRsvps] = useState({}) // people coming to each event
  const [rsvpFor, setRsvpFor] = useState(null)
  const [at, setAt] = useState('')

  // Small preview of the photo chosen in the form
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const load = () => api.get(`${config.endpoint}?limit=100&all=1`).then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [config.endpoint])
  const loadRsvps = () => kind === 'events' && api.get('/rsvp/counts').then(setRsvps).catch(() => { })
  useEffect(() => { loadRsvps() }, [kind])

  function reset() {
    setForm({})
    setFile(null)
    setEditing(null)
    setAdding(false)
    setWhen('now')
    setAt('')
    setFormKey((k) => k + 1) // remounts the form so the inputs empty out
  }

  function startEdit(item) {
    const values = {}
    config.fields.forEach((f) => {
      values[f] = f === 'date' && item.date ? item.date.slice(0, 10) : item[f] || ''
    })
    setForm(values)
    const st = statusOf(item)
    setWhen(st === 'live' ? 'now' : st === 'scheduled' ? 'later' : 'draft')
    setAt(item.publishAt ? toInput(item.publishAt) : '')
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
      if (when === 'later' && !at) throw new Error('Choose the date and time to publish')
      data.append('draft', String(when === 'draft'))
      data.append('publishAt', when === 'later' ? at : '')
      // A gallery photo is "general" unless marked Adivasi, and the extra boxes only belong to the Adivasi section
      if (kind === 'gallery') {
        data.set('section', form.section === 'adivasi' ? 'adivasi' : 'general')
        if (form.section !== 'adivasi') ['kind', 'communityEn', 'communityHi'].forEach((k) => data.set(k, ''))
      }
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

  // Titles, details, section and link take half the row on large screens; short fields take a quarter
  const wide = (f) => f.startsWith('title') || f.startsWith('body') || ['section', 'link'].includes(f)
  const thumb = preview || editing?.image?.url
  const showForm = adding || !!editing

  return (
    <>
      <PageHeader title={config.label} subtitle={config.hint}>
        {!showForm && <button onClick={() => { setAdding(true); setError('') }} className="abtn-primary">➕ {ADD_LABEL[kind]}</button>}
      </PageHeader>

      {showForm && (
        <form key={formKey} onSubmit={submit} className="card mb-6 border-brand/30">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{editing ? '✏️ Edit item' : `➕ ${ADD_LABEL[kind]}`}</h2>
            <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {config.fields.map((f) => {
              // The dance/festival and community boxes only matter for the Adivasi section
              if (['kind', 'communityEn', 'communityHi'].includes(f) && form.section !== 'adivasi') return null
              const common = { className: 'input', defaultValue: form[f], onChange: (e) => setForm({ ...form, [f]: e.target.value }) }
              return (
                <label key={f} className={`flex flex-col gap-1 font-semibold ${wide(f) ? 'xl:col-span-2' : ''}`}>
                  {config.labels?.[f] || LABELS[f]}
                  {f.startsWith('body') ? <textarea rows="3" {...common} />
                    : f === 'section' ? (
                      <select {...common}>
                        <option value="general">Photos (programs, rallies, general)</option>
                        <option value="adivasi">Adivasi &amp; tribal culture (dances, festivals)</option>
                      </select>
                    ) : f === 'kind' ? (
                      <select {...common}>
                        <option value="">Choose...</option>
                        <option value="dance">Traditional dance</option>
                        <option value="festival">Festival</option>
                      </select>
                    ) : f === 'order' ? <input type="number" min="0" {...common} />
                      : f === 'date' ? <input type="date" required {...common} />
                        : <input type="text" {...common} />}
                </label>
              )
            })}
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-semibold">When should it go live?</p>
              <div role="group" aria-label="When should it go live?" className="flex flex-wrap gap-1 rounded-xl bg-mist/60 p-1">
                {WHEN.map(([key, label]) => (
                  <button key={key} type="button" onClick={() => { setWhen(key); if (key === 'later' && !at) setAt(toInput(Date.now() + 3600e3)) }}
                    aria-pressed={when === key}
                    className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition ${when === key ? 'bg-brand text-white shadow-sm' : 'text-navy/65 hover:bg-white hover:text-navy'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {when === 'later' && (
                <label className="mt-2 flex flex-col gap-1 font-semibold">Publish on (Indian time)
                  <input type="datetime-local" required value={at} min={toInput(Date.now())} onChange={(e) => setAt(e.target.value)} className="input" />
                </label>
              )}
              {when === 'draft' && <p className="mt-1.5 text-xs text-navy/60">Only admins can see drafts. Publish it later by editing it.</p>}
            </div>

            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-semibold">
                {editing ? 'Replace image (leave empty to keep the current one)' : `Image ${config.needImage ? '(required)' : '(optional)'}`}
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-brand/25 bg-mist/40 p-2.5 transition hover:border-brand hover:bg-mist">
                {thumb
                  ? <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-brand"><Icon name="image" size={22} /></span>}
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-semibold text-brand">{file ? file.name : 'Choose a photo'}</span>
                  <span className="text-navy/60">JPG, PNG or WebP, up to 5 MB</span>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" required={config.needImage && !editing}
                  onChange={(e) => setFile(e.target.files[0] || null)} className="sr-only" />
              </label>
            </div>
          </div>
          {error && <div className="mt-3"><Notice>{error}</Notice></div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={reset} className="abtn min-h-11">Cancel</button>
            <button disabled={busy} className="abtn-primary min-h-11 px-6">
              {busy ? 'Saving...' : when === 'draft' ? '📝 Save draft' : when === 'later' ? '🕒 Schedule' : editing ? '💾 Save changes' : '✅ Publish'}
            </button>
          </div>
        </form>
      )}

      {!showForm && <Notice>{error}</Notice>}
      <h2 className="mb-3 text-lg font-extrabold">📋 All items {items && `(${items.length})`}</h2>
      {!items && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing published yet. Click "{ADD_LABEL[kind]}" to add the first one.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items?.map((it) => (
          <li key={it._id} className={`card flex flex-col overflow-hidden p-0 sm:p-0 ${editing?._id === it._id ? 'ring-2 ring-brand' : ''}`}>
            {it.image?.url && <img src={it.image.url} alt="" loading="lazy" className="aspect-video w-full rounded-none object-cover" />}
            <div className="flex flex-1 flex-col p-4">
              <div className="line-clamp-2 font-bold">{it.titleHi || it.titleEn || config.untitled || '(no title)'}</div>
              {it.titleHi && it.titleEn && <div className="line-clamp-1 text-sm text-navy/60">{it.titleEn}</div>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {statusOf(it) === 'draft' && <span className="rounded-full bg-navy/10 px-2 py-0.5 font-semibold text-navy">📝 Draft</span>}
                {statusOf(it) === 'scheduled' && <span className="rounded-full bg-gold/25 px-2 py-0.5 font-semibold text-navy">🕒 Goes live {niceTime(it.publishAt)}</span>}
                {it.date && <span className="rounded-full bg-mist px-2 py-0.5 font-semibold text-brand">📅 {new Date(it.date).toLocaleDateString('en-IN')}</span>}
                {it.location && <span className="rounded-full bg-mist px-2 py-0.5 font-semibold text-brand">📍 {it.location}</span>}
                {it.order != null && <span className="rounded-full bg-mist px-2 py-0.5 font-semibold text-brand">#{it.order}</span>}
                {it.section === 'adivasi' && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-navy">
                    🪘 Adivasi{it.kind ? ` · ${it.kind}` : ''}{it.communityEn || it.communityHi ? ` · ${it.communityEn || it.communityHi}` : ''}
                  </span>
                )}
              </div>
              {kind === 'events' && (
                <button onClick={() => setRsvpFor(it)} className="mt-3 flex items-center justify-between rounded-xl bg-mist/60 px-3 py-2 text-sm font-semibold text-brand hover:bg-mist">
                  <span>🙋 {rsvps[it._id]?.people || 0} coming</span><span className="text-xs">View list →</span>
                </button>
              )}
              <div className="mt-auto flex gap-2 pt-3">
                <button onClick={() => startEdit(it)} className="abtn min-h-9 flex-1 px-3">✏️ Edit</button>
                <button onClick={() => remove(it._id)} className="abtn-danger min-h-9 flex-1 px-3">🗑️ Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {rsvpFor && <RsvpList event={rsvpFor} onClose={() => setRsvpFor(null)} onChange={loadRsvps} />}
    </>
  )
}
