import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading, FindNote } from './ui.jsx'
import { useFind, matchesFind } from './find.js'
import Icon from '../../components/Icon.jsx'
import RsvpList from './RsvpList.jsx'
import FilePreview from '../../components/FilePreview.jsx'
import { STATES } from '../../data/states.js'
import { thumb as smallPicture } from '../../lib/img.js'

const KINDS = {
  news: {
    label: 'News', hint: 'Shown on the Home page and the News page.', endpoint: '/news', needImage: false,
    fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn'],
  },
  events: {
    label: 'Events', hint: 'Programs and meetings, shown on the News page.', endpoint: '/events', needImage: false,
    fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn', 'date', 'time', 'location', 'stateCode'],
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
const niceDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const niceTime = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
const WHEN = [['now', '🚀 Publish now'], ['later', '🕒 Schedule'], ['draft', '📝 Save as draft']]

const ADD_LABEL = { news: 'Add news', events: 'Add event', gallery: 'Add photo', slides: 'Add slide' }
const PAGE = 100 // the most the server gives at once

const LABELS = {
  titleHi: 'Title (Hindi)', titleEn: 'Title (English)',
  bodyHi: 'Details (Hindi)', bodyEn: 'Details (English)',
  date: 'Date', location: 'Location', time: 'Time (optional)', stateCode: 'State (optional, for the calendar)',
}

export default function Content({ kind }) {
  const config = KINDS[kind]
  const [items, setItems] = useState(null)
  const { find, clear: clearFind } = useFind() // opened from the search box at the top
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [adding, setAdding] = useState(false)
  const [when, setWhen] = useState('now')
  const [rsvps, setRsvps] = useState({}) // people coming to each event
  const [rsvpFor, setRsvpFor] = useState(null)
  const [at, setAt] = useState('')

  // A page of 100 at a time, newest first; "Load older items" for the rest. From the search box at the top,
  // everything is loaded, so the item is found however old it is.
  const [more, setMore] = useState(false)
  const [busyMore, setBusyMore] = useState(false)
  const shown = useRef(0) // how many are on screen, so a reload after a change keeps them all
  async function fetchFrom(skip, want) {
    let list = []
    for (;;) {
      const page = await api.get(`${config.endpoint}?limit=${PAGE}&skip=${skip + list.length}&all=1`)
      list = list.concat(page)
      if (page.length < PAGE || list.length >= want) return { list, full: page.length === PAGE }
    }
  }
  const load = async () => {
    try {
      const { list, full } = await fetchFrom(0, find ? Infinity : Math.max(shown.current, 1))
      shown.current = list.length
      setItems(list)
      setMore(full)
    } catch (e) { setError(e.message) }
  }
  async function loadMore() {
    setBusyMore(true)
    try {
      const { list, full } = await fetchFrom(items.length, 1)
      const all = [...items, ...list.filter((x) => !items.some((y) => y._id === x._id))]
      shown.current = all.length
      setItems(all)
      setMore(full)
    } catch (e) { setError(e.message) } finally { setBusyMore(false) }
  }
  useEffect(() => { load() }, [config.endpoint, find]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadRsvps = () => kind === 'events' && api.get('/rsvp/counts').then(setRsvps).catch(() => { })
  useEffect(() => { if (kind === 'events') api.get('/rsvp/counts').then(setRsvps).catch(() => { }) }, [kind])

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
            <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/65 hover:bg-mist">
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
                        : f === 'time' ? <input type="time" {...common} />
                          : f === 'stateCode' ? (
                            <select {...common}>
                              <option value="">All India / not one state</option>
                              {[...STATES].sort((a, b) => a.en.localeCompare(b.en)).map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                            </select>
                          )
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
              {when === 'draft' && <p className="mt-1.5 text-xs text-navy/65">Only admins can see drafts. Publish it later by editing it.</p>}
            </div>

            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-semibold">
                {editing ? 'Replace image (leave empty to keep the current one)' : `Image ${config.needImage ? '(required)' : '(optional)'}`}
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-brand/25 bg-mist/40 p-2.5 transition hover:border-brand hover:bg-mist">
                {/* The photo just chosen, or the current one when editing */}
                {file
                  ? <FilePreview file={file} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  : editing?.image?.url
                  ? <img src={editing.image.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-brand"><Icon name="image" size={22} /></span>}
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-semibold text-brand">{file ? file.name : 'Choose a photo'}</span>
                  <span className="text-navy/65">JPG, PNG or WebP, up to 5 MB</span>
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
      <FindNote find={find} clear={clearFind} />
      {!items && <ListLoading />}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 Nothing published yet. Click "{ADD_LABEL[kind]}" to add the first one.</p>}
      {/* One compact row per item: small picture, title, date and status, then the buttons */}
      <ul className="grid gap-2.5 xl:grid-cols-2">
        {items?.filter((it) => matchesFind(find, it.titleEn, it.titleHi)).map((it) => {
          const status = statusOf(it)
          const wide = kind === 'slides' // slider pictures are wide, so their thumbnail is too
          const chip = 'rounded-full px-2 py-0.5 font-semibold'
          return (
            <li key={it._id} className={`card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-3 ${editing?._id === it._id ? 'ring-2 ring-brand' : ''} ${status === 'draft' ? 'bg-navy/[0.03]' : ''}`}>
              {it.image?.url
                ? <img src={smallPicture(it.image.url, wide ? 224 : 128, 128)} alt="" loading="lazy" className={`h-16 shrink-0 rounded-lg bg-mist object-cover ${wide ? 'w-28' : 'w-16'}`} />
                : <span aria-hidden="true" className={`flex h-16 shrink-0 items-center justify-center rounded-lg bg-mist text-brand/60 ${wide ? 'w-28' : 'w-16'}`}><Icon name={kind === 'events' ? 'calendar' : kind === 'news' ? 'news' : 'image'} size={24} /></span>}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-bold">{it.titleHi || it.titleEn || config.untitled || '(no title)'}</div>
                {it.titleHi && it.titleEn && <div className="line-clamp-1 text-sm text-navy/65">{it.titleEn}</div>}
                <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {status === 'live' && <span className={`${chip} bg-green-100 text-green-900`}>● Live</span>}
                  {status === 'draft' && <span className={`${chip} bg-navy/10 text-navy`}>📝 Draft (hidden)</span>}
                  {status === 'scheduled' && <span className={`${chip} bg-gold/25 text-navy`}>🕒 Goes live {niceTime(it.publishAt)}</span>}
                  {it.date
                    ? <span className={`${chip} bg-mist text-brand`}>📅 {niceDay(it.date)}</span>
                    : it.createdAt && <span className={`${chip} bg-navy/5 text-navy/70`}>Added {niceDay(it.createdAt)}</span>}
                  {it.location && <span className={`${chip} bg-mist text-brand`}>📍 {it.location}</span>}
                  {it.order != null && <span className={`${chip} bg-mist text-brand`}>#{it.order}</span>}
                  {it.section === 'adivasi' && (
                    <span className={`${chip} bg-gold/20 text-navy`}>
                      🪘 Adivasi{it.kind ? ` · ${it.kind}` : ''}{it.communityEn || it.communityHi ? ` · ${it.communityEn || it.communityHi}` : ''}
                    </span>
                  )}
                  {kind === 'events' && (
                    <>
                      <button type="button" onClick={() => setRsvpFor(it)} className={`${chip} bg-mist text-brand hover:bg-brand hover:text-white`}>🙋 {rsvps[it._id]?.people || 0} coming</button>
                      <Link to={`/admin/checkin/${it._id}`} className={`${chip} bg-purple-50 text-purple-800 hover:bg-purple-100`}>📷 Check-in</Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <button type="button" onClick={() => startEdit(it)} className="abtn min-h-9 flex-1 px-3 sm:flex-none">✏️ Edit</button>
                <button type="button" onClick={() => remove(it._id)} aria-label={`Delete ${it.titleEn || it.titleHi || 'this item'}`} className="abtn-danger min-h-9 flex-1 px-3 sm:flex-none">🗑️<span className="sm:sr-only"> Delete</span></button>
              </div>
            </li>
          )
        })}
      </ul>
      {more && (
        <div className="mt-5 text-center">
          <button onClick={loadMore} disabled={busyMore} className="abtn min-h-10 px-5">{busyMore ? 'Loading…' : '⬇️ Load older items'}</button>
          <p className="mt-1.5 text-xs text-navy/65">{items.length} loaded. The search on this page covers only the loaded ones.</p>
        </div>
      )}
      {rsvpFor && <RsvpList event={rsvpFor} onClose={() => setRsvpFor(null)} onChange={loadRsvps} />}
    </>
  )
}
