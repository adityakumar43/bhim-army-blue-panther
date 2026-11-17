import { useMemo, useState } from 'react'
import { api } from '../../lib/api.js'
import { shrinkImage } from '../../lib/shrinkImage.js'
import FilePreview from '../../components/FilePreview.jsx'
import { STATES } from '../../data/states.js'
import { districtsOf } from '../../data/districts.js'
import { CATEGORIES, whatsappRef } from '../../data/helpdesk.js'
import { Notice } from './ui.jsx'

// Typing in a paper complaint form (the printable form in Downloads), for someone without internet. Same checks as
// the Help desk page, but no hourly limit and no voice message; the photos are pictures of the form and of the papers
// that came with it. The case gets a reference number like any other, to tell the person (by WhatsApp below).
// State admins can only choose their own state, District admins also only their own district (and the case is theirs).

const EMPTY = { paperRef: '', category: '', name: '', phone: '', email: '', village: '', policeStation: '', day: '', month: '', year: '', description: '' }
const MAX_PHOTOS = 3
const digits = (v, n) => v.replace(/\D/g, '').slice(0, n)
const pad = (v) => v.padStart(2, '0')

export default function PaperComplaint({ me, onSaved, onClose }) {
  const lockedState = ['stateadmin', 'districtadmin'].includes(me.role) ? me.state : ''
  const lockedDistrict = me.role === 'districtadmin' ? me.district : ''
  const [form, setForm] = useState(EMPTY)
  const [stateCode, setStateCode] = useState(lockedState)
  const [district, setDistrict] = useState(lockedDistrict)
  const [photos, setPhotos] = useState([])
  const [urgent, setUrgent] = useState(false)
  const [signed, setSigned] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState([]) // cases added in this sitting, newest first
  const districts = useMemo(() => districtsOf(stateCode).map((d) => d[0]).sort((a, b) => a.localeCompare(b)), [stateCode])

  // The picker is emptied after each choice: a phone camera often names every picture "image.jpg", and choosing a
  // file with the same name again would otherwise not count as a change
  const pick = (e) => {
    const files = [...(e.target.files || [])]
    if (files.length) setPhotos((p) => [...p, ...files].slice(0, MAX_PHOTOS))
    e.target.value = ''
  }
  const set = (key, max) => (e) => setForm((f) => ({ ...f, [key]: max ? digits(e.target.value, max) : e.target.value }))

  async function save(e, { next }) {
    e.preventDefault()
    setError('')
    if (!form.category) return setError('Choose what the complaint is about.')
    if (!form.month || form.year.length !== 4) return setError('Enter the month and the 4-digit year of the incident (the day only if it is written on the form).')
    if (form.description.trim().length < 20) return setError('Type in what happened from the paper form (at least 20 letters).')
    if (!signed) return setError('Tick the box to confirm the person signed the consent on the paper form.')
    setBusy(true)
    try {
      const data = new FormData()
      for (const k of ['paperRef', 'category', 'name', 'phone', 'email', 'village', 'policeStation', 'description']) data.append(k, form[k].trim())
      data.append('incidentDate', `${form.year}-${pad(form.month)}${form.day ? `-${pad(form.day)}` : ''}`)
      data.append('stateCode', stateCode)
      data.append('district', district)
      data.append('urgent', String(urgent))
      data.append('consent', 'true')
      // Bigger than the Help desk page's photos, so the handwriting on the form stays readable
      for (const [i, f] of photos.entries()) data.append('photos', await shrinkImage(f, 1600), `paper-${i + 1}.jpg`)
      const c = await api.post('/helpdesk/paper', data)
      setSaved((s) => [c, ...s])
      onSaved(c, !next)
      // Next form: start empty, but keep the state and district (a pile of forms is usually from one place)
      setForm(EMPTY)
      setPhotos([])
      setUrgent(false)
      setSigned(false)
      if (!next) onClose()
      else document.getElementById('paper-case-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = 'flex flex-col gap-1.5 text-sm font-semibold'
  const star = <span className="text-red-600" aria-hidden="true">*</span>

  return (
    <section className="card mb-6 border-2 border-brand/20 p-4 sm:p-6" aria-labelledby="paper-case-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="paper-case-title" className="text-xl font-extrabold">📝 Add from a paper form</h2>
          <p className="mt-1 text-sm text-navy/70">Type in a filled paper complaint form. It becomes a <b>New</b> case with its own reference number.</p>
        </div>
        <button type="button" onClick={onClose} className="abtn min-h-10 px-3">✕ Close</button>
      </div>

      {/* Each case saved in this sitting: its reference number, to write on the form and send to the person */}
      {saved.length > 0 && (
        <div role="status" className="mb-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-800">✅ Saved {saved.length} case{saved.length > 1 ? 's' : ''}. Write each reference number in the "office use" box of its paper form, and send it to the person:</p>
          <ul className="mt-2 space-y-1.5">
            {saved.map((c) => (
              <li key={c._id} className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-brand">{c.refNo}</span>
                <span className="text-navy/75">{c.name}{c.paperRef ? ` · form ${c.paperRef}` : ''}</span>
                <a href={whatsappRef(c)} target="_blank" rel="noreferrer"
                  className="abtn min-h-9 border-0 bg-[#15803d] px-3 text-white hover:bg-[#166534] hover:text-white">📲 Send on WhatsApp</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={(e) => save(e, { next: true })} className="grid gap-4 sm:grid-cols-2">
        <label className={label}><span>Paper form number <span className="font-normal text-navy/60">(optional, from the "office use" box)</span></span>
          <input value={form.paperRef} onChange={set('paperRef')} maxLength={40} placeholder="e.g. DHAR-H-031" className="input" />
        </label>
        <label className={label}><span>What it is about {star}</span>
          <select required value={form.category} onChange={set('category')} className="input">
            <option value="">Choose the type</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.en} · {c.hi}</option>)}
          </select>
        </label>
        <label className={label}><span>Full name {star}</span>
          <input required value={form.name} onChange={set('name')} maxLength={100} autoComplete="off" className="input" />
        </label>
        <label className={label}><span>Mobile number {star}</span>
          <span className="flex items-center gap-2"><span className="font-bold text-navy/70">+91</span>
            <input required inputMode="numeric" value={form.phone} onChange={set('phone', 10)} placeholder="10 digits" className="input" /></span>
        </label>
        <label className={`${label} sm:col-span-2`}><span>Email <span className="font-normal text-navy/60">(optional: if given, they get the reference number by email too)</span></span>
          <input type="email" value={form.email} onChange={set('email')} maxLength={120} className="input" />
        </label>
        <label className={label}><span>State {star}</span>
          <select required value={stateCode} disabled={!!lockedState} onChange={(e) => { setStateCode(e.target.value); setDistrict('') }} className="input">
            <option value="">Choose the state</option>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.en} · {s.hi}</option>)}
          </select>
        </label>
        <label className={label}><span>District {lockedDistrict ? star : <span className="font-normal text-navy/60">(if written on the form)</span>}</span>
          <select required={!!lockedDistrict} value={district} disabled={!!lockedDistrict || !stateCode} onChange={(e) => setDistrict(e.target.value)} className="input">
            <option value="">{stateCode ? 'Choose the district' : 'Choose the state first'}</option>
            {lockedDistrict && !districts.includes(lockedDistrict) && <option value={lockedDistrict}>{lockedDistrict}</option>}
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className={label}>Village / locality
          <input value={form.village} onChange={set('village')} maxLength={100} className="input" />
        </label>
        <label className={label}>Police station
          <input value={form.policeStation} onChange={set('policeStation')} maxLength={100} className="input" />
        </label>
        <div className={`${label} sm:col-span-2`} role="group" aria-labelledby="paper-case-date">
          <span id="paper-case-date">Date of the incident {star} <span className="font-normal text-navy/60">(the day only if it is written on the form)</span></span>
          <span className="flex items-center gap-2">
            <input inputMode="numeric" aria-label="Day (optional)" placeholder="DD" value={form.day} onChange={set('day', 2)} className="input w-16 text-center" />
            <span aria-hidden="true">/</span>
            <input required inputMode="numeric" aria-label="Month" placeholder="MM" value={form.month} onChange={set('month', 2)} className="input w-16 text-center" />
            <span aria-hidden="true">/</span>
            <input required inputMode="numeric" aria-label="Year" placeholder="YYYY" value={form.year} onChange={set('year', 4)} className="input w-24 text-center" />
          </span>
        </div>
        <label className={`${label} sm:col-span-2`}><span>What happened {star} <span className="font-normal text-navy/60">(type it in as written on the form)</span></span>
          <textarea required rows={5} value={form.description} onChange={set('description')} maxLength={3000} className="input" />
          <span className="text-xs font-normal text-navy/60">{form.description.length}/3000</span>
        </label>

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">📎 Photos <span className="font-normal text-navy/60">({photos.length}/{MAX_PHOTOS}: the paper form itself, and any FIR copy or other paper that came with it)</span></p>
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((f, i) => (
                <div key={`${f.name}-${f.lastModified}-${i}`} className="relative">
                  <FilePreview file={f} alt={`Photo ${i + 1}`} className="h-24 w-24 rounded-lg object-cover ring-1 ring-brand/10" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}
                    className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow">✕</button>
                </div>
              ))}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="abtn-primary min-h-10 cursor-pointer px-4 text-white">📷 Camera
                <input type="file" accept="image/*" capture="environment" onChange={pick} className="sr-only" />
              </label>
              <label className="abtn min-h-10 cursor-pointer px-4">🖼️ From gallery
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} className="sr-only" />
              </label>
            </div>
          )}
        </div>

        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-5 w-5 accent-red-600" />
          🔴 Urgent (shows at the top of the list)
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-mist/60 p-3 text-sm sm:col-span-2">
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span><b>The person signed (or put a thumb impression on) the consent on the paper form</b>, agreeing that the team records their complaint and contacts them to help. {star}</span>
        </label>

        <div className="sm:col-span-2"><Notice>{error}</Notice></div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button disabled={busy} className="abtn-primary min-h-11 px-5 disabled:opacity-60">{busy ? 'Saving…' : '💾 Save and add the next form'}</button>
          <button type="button" disabled={busy} onClick={(e) => e.currentTarget.form.reportValidity() && save(e, { next: false })} className="abtn min-h-11 px-5 disabled:opacity-60">Save and close</button>
        </div>
        <p className="text-xs text-navy/60 sm:col-span-2">Keep the paper form, with the reference number written on it, in a safe place: it carries the person's signature.</p>
      </form>
    </section>
  )
}
