import { useMemo, useState } from 'react'
import { api } from '../../lib/api.js'
import { shrinkImage } from '../../lib/shrinkImage.js'
import FilePreview from '../../components/FilePreview.jsx'
import { STATES } from '../../data/states.js'
import { districtsOf } from '../../data/districts.js'
import { Notice } from './ui.jsx'

// Typing in a paper membership form (the printable form in Downloads). Same checks as the Join page, but:
// no hourly limit, the email is optional, and the entry remembers who typed it in and the form's number.
// It still goes to "Pending" and needs approval like every other application.
// State admins can only choose their own state, District admins also only their own district.

const EMPTY = { paperRef: '', name: '', phone: '', day: '', month: '', year: '', email: '', city: '', assemblyNo: '', lokSabhaNo: '', message: '' }
const digits = (v, n) => v.replace(/\D/g, '').slice(0, n)

export default function PaperForm({ me, onSaved, onClose }) {
  const lockedState = ['stateadmin', 'districtadmin'].includes(me.role) ? me.state : ''
  const lockedDistrict = me.role === 'districtadmin' ? me.district : ''
  const [form, setForm] = useState(EMPTY)
  const [stateCode, setStateCode] = useState(lockedState)
  const [district, setDistrict] = useState(lockedDistrict)
  const [photo, setPhoto] = useState(null)
  const [signed, setSigned] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState([]) // names added in this sitting, newest first
  const districts = useMemo(() => districtsOf(stateCode).map((d) => d[0]).sort((a, b) => a.localeCompare(b)), [stateCode])

  // The picker is emptied after each choice: a phone camera often names every picture "image.jpg", and choosing a
  // file with the same name again would otherwise not count as a change (the next form would have no photo)
  const pick = (e) => { const f = e.target.files?.[0]; if (f) setPhoto(f); e.target.value = '' }
  const set = (key, max) => (e) => setForm((f) => ({ ...f, [key]: max ? digits(e.target.value, max) : e.target.value }))
  const pad = (v) => v.padStart(2, '0')

  async function save(e, { next }) {
    e.preventDefault()
    setError('')
    if (!photo) return setError('Add the photo from the paper form (take a picture of it with the camera).')
    if (!signed) return setError('Tick the box to confirm the applicant signed the declaration on the paper form.')
    if (!form.day || !form.month || form.year.length !== 4) return setError('Enter the full date of birth: day, month and a 4-digit year.')
    setBusy(true)
    try {
      const data = new FormData()
      for (const k of ['paperRef', 'name', 'phone', 'email', 'city', 'assemblyNo', 'lokSabhaNo', 'message']) data.append(k, form[k].trim())
      data.append('dob', `${form.year}-${pad(form.month)}-${pad(form.day)}`)
      data.append('stateCode', stateCode)
      data.append('district', district)
      data.append('consent', 'true')
      data.append('photo', await shrinkImage(photo), 'photo.jpg')
      const m = await api.post('/members/paper', data)
      setSaved((s) => [m.name, ...s])
      onSaved()
      // Next form: start empty, but keep the state and district (a pile of forms is usually from one place)
      setForm(EMPTY)
      setPhoto(null)
      setSigned(false)
      if (!next) onClose()
      else document.getElementById('paper-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = 'flex flex-col gap-1.5 text-sm font-semibold'
  const star = <span className="text-red-600" aria-hidden="true">*</span>

  return (
    <section className="card mb-6 border-2 border-brand/20 p-4 sm:p-6" aria-labelledby="paper-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="paper-title" className="text-xl font-extrabold">📝 Add from a paper form</h2>
          <p className="mt-1 text-sm text-navy/70">Type in a filled paper membership form. It goes to <b>Pending</b> and is approved like any other application.</p>
        </div>
        <button type="button" onClick={onClose} className="abtn min-h-10 px-3">✕ Close</button>
      </div>

      {saved.length > 0 && (
        <Notice kind="success">✅ Saved {saved.length} form{saved.length > 1 ? 's' : ''} in this sitting: {saved.join(', ')}. You will find them under Pending.</Notice>
      )}

      <form onSubmit={(e) => save(e, { next: true })} className="grid gap-4 sm:grid-cols-2">
        <label className={label}><span>Paper form number <span className="font-normal text-navy/60">(optional, from the "office use" box)</span></span>
          <input value={form.paperRef} onChange={set('paperRef')} maxLength={40} placeholder="e.g. DHAR-0142" className="input" />
        </label>
        <label className={label}><span>Full name {star}</span>
          <input required value={form.name} onChange={set('name')} maxLength={100} autoComplete="off" className="input" />
        </label>
        <label className={label}><span>Mobile number {star}</span>
          <span className="flex items-center gap-2"><span className="font-bold text-navy/70">+91</span>
            <input required inputMode="numeric" value={form.phone} onChange={set('phone', 10)} placeholder="10 digits" className="input" /></span>
        </label>
        <div className={label} role="group" aria-labelledby="paper-dob">
          <span id="paper-dob">Date of birth {star} <span className="font-normal text-navy/60">(day / month / year)</span></span>
          <span className="flex items-center gap-2">
            <input required inputMode="numeric" aria-label="Day" placeholder="DD" value={form.day} onChange={set('day', 2)} className="input w-16 text-center" />
            <span aria-hidden="true">/</span>
            <input required inputMode="numeric" aria-label="Month" placeholder="MM" value={form.month} onChange={set('month', 2)} className="input w-16 text-center" />
            <span aria-hidden="true">/</span>
            <input required inputMode="numeric" aria-label="Year" placeholder="YYYY" value={form.year} onChange={set('year', 4)} className="input w-24 text-center" />
          </span>
        </div>
        <label className={`${label} sm:col-span-2`}><span>Email <span className="font-normal text-navy/60">(optional: without it, send the card by WhatsApp after approval)</span></span>
          <input type="email" value={form.email} onChange={set('email')} maxLength={120} className="input" />
        </label>
        <label className={label}><span>State {star}</span>
          <select required value={stateCode} disabled={!!lockedState} onChange={(e) => { setStateCode(e.target.value); setDistrict('') }} className="input">
            <option value="">Choose the state</option>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.en} · {s.hi}</option>)}
          </select>
        </label>
        <label className={label}><span>District {star}</span>
          <select required value={district} disabled={!!lockedDistrict || !stateCode} onChange={(e) => setDistrict(e.target.value)} className="input">
            <option value="">{stateCode ? 'Choose the district' : 'Choose the state first'}</option>
            {lockedDistrict && !districts.includes(lockedDistrict) && <option value={lockedDistrict}>{lockedDistrict}</option>}
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className={label}>Village / city
          <input value={form.city} onChange={set('city')} maxLength={100} className="input" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Assembly no.
            <input inputMode="numeric" value={form.assemblyNo} onChange={set('assemblyNo', 3)} className="input" />
          </label>
          <label className={label}>Lok Sabha no.
            <input inputMode="numeric" value={form.lokSabhaNo} onChange={set('lokSabhaNo', 3)} className="input" />
          </label>
        </div>
        <label className={`${label} sm:col-span-2`}><span>Why they want to join <span className="font-normal text-navy/60">(optional)</span></span>
          <textarea rows={2} value={form.message} onChange={set('message')} maxLength={500} className="input" />
        </label>

        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="flex h-28 w-22 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist text-3xl text-brand/40">
            {photo ? <FilePreview file={photo} className="h-full w-full object-cover" /> : <span aria-hidden="true">👤</span>}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Photo {star} <span className="font-normal text-navy/60">(take a picture of the photo stuck on the form, close up)</span></span>
            <div className="flex flex-wrap gap-2">
              <label className="abtn-primary min-h-10 cursor-pointer px-4 text-white">📷 Camera
                <input type="file" accept="image/*" capture="environment" onChange={pick} className="sr-only" />
              </label>
              <label className="abtn min-h-10 cursor-pointer px-4">🖼️ {photo ? 'Change photo' : 'From gallery'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="sr-only" />
              </label>
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-mist/60 p-3 text-sm sm:col-span-2">
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span><b>The applicant signed (or put a thumb impression on) the declaration on the paper form</b>, agreeing that their details and photo are used for their membership. {star}</span>
        </label>

        <div className="sm:col-span-2"><Notice>{error}</Notice></div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button disabled={busy} className="abtn-primary min-h-11 px-5 disabled:opacity-60">{busy ? 'Saving…' : '💾 Save and add the next form'}</button>
          <button type="button" disabled={busy} onClick={(e) => e.currentTarget.form.reportValidity() && save(e, { next: false })} className="abtn min-h-11 px-5 disabled:opacity-60">Save and close</button>
        </div>
        <p className="text-xs text-navy/60 sm:col-span-2">Keep the paper form: write the membership number on it once the application is approved.</p>
      </form>
    </section>
  )
}
