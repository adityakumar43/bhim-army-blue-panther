import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import Consent from '../components/Consent.jsx'
import { STATES, stateName } from '../data/states.js'
import { districtsOf, districtName } from '../data/districts.js'

// Small line icons shown inside the boxes
const ICONS = {
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pin: 'M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  vote: 'M9 12l2 2 4-4M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 7V4h8v3',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4',
  check: 'M20 6L9 17l-5-5',
}
const Svg = ({ name, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={ICONS[name]} /></svg>
)

// A label, the box (with an icon inside, or a "+91" in front), a green tick when it is right, and a hint or a problem below
function Field({ label, icon, prefix, required, ok, problem, hint, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1.5 font-semibold ${className}`}>
      <span>{label}{required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</span>
      <span className="relative block">
        {icon && <Svg name={icon} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand/60" />}
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">{prefix}</span>}
        {children}
        {ok && <Svg name="check" size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-green-600" />}
      </span>
      {problem ? <span className="text-xs font-semibold text-red-700">⚠️ {problem}</span>
        : hint && <span className="text-xs font-normal text-navy/60">{hint}</span>}
    </label>
  )
}

function Section({ emoji, title, done, children }) {
  return (
    <fieldset className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold" aria-hidden="true">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-xl">{emoji}</span>
        <span className="flex-1">{title}</span>
        {done && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white"><Svg name="check" size={14} /></span>}
      </h2>
      {children}
    </fieldset>
  )
}

const DRAFT = 'joinDraft'
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT)) || null } catch { return null } }
const saveDraft = (v) => { try { localStorage.setItem(DRAFT, JSON.stringify(v)) } catch { /* private mode */ } }
const dropDraft = () => { try { localStorage.removeItem(DRAFT) } catch { /* private mode */ } }

const PHONE_OK = /^[6-9]\d{9}$/
const EMAIL_OK = /^\S+@\S+\.\S+$/
const pad = (n) => String(n).padStart(2, '0')

export default function Join() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [draft] = useState(readDraft) // what this visitor typed last time, if anything
  const [form, setForm] = useState(() => draft || {})
  const [restored, setRestored] = useState(() => !!draft && Object.values(draft).some(Boolean))
  const [touched, setTouched] = useState({})
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [applied, setApplied] = useState(false) // this mobile number has already applied
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [agree, setAgree] = useState(false)

  const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))
  const blur = (f) => () => setTouched((old) => ({ ...old, [f]: true }))

  // Keep what they type, so a dropped connection or a reload does not lose it (the photo cannot be kept)
  useEffect(() => { if (!done) saveDraft(form) }, [form, done])

  // Show the chosen photo, and free the memory when it changes
  useEffect(() => {
    if (!photo) return setPreview('')
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  // Date of birth from three lists. A day that does not exist (31 June) is caught here.
  const { dobDay = '', dobMonth = '', dobYear = '' } = form
  const dob = dobDay && dobMonth && dobYear ? `${dobYear}-${pad(dobMonth)}-${pad(dobDay)}` : ''
  const dobReal = dob && new Date(`${dob}T00:00:00Z`).toISOString().slice(0, 10) === dob
  // Members must be 18 or older: born on or before this day, 18 years ago
  const now = new Date()
  const adultCutoff = `${now.getFullYear() - 18}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const adult = !!dobReal && dob <= adultCutoff
  const dobProblem = dob && !dobReal ? t('join.badDate', { defaultValue: 'This date does not exist. Please check the day and month.' })
    : dobReal && !adult ? t('join.tooYoung', { defaultValue: 'You must be 18 or older to become a member.' }) : ''

  const phone = form.phone || ''
  const phoneOk = PHONE_OK.test(phone)
  const phoneProblem = phone && !phoneOk && (touched.phone || phone.length >= 10) ? t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }) : ''
  const emailOk = EMAIL_OK.test(form.email || '')
  const emailProblem = form.email && !emailOk && touched.email ? t('join.emailHint', { defaultValue: 'Please check the email address' }) : ''

  // As soon as the mobile number is complete, check whether it has already applied
  useEffect(() => {
    setApplied(false)
    if (!phoneOk) return
    const timer = setTimeout(() => {
      api.get(`/members/check?phone=${phone}`).then((r) => setApplied(!!r.applied)).catch(() => { })
    }, 400)
    return () => clearTimeout(timer)
  }, [phone, phoneOk])

  // Districts of the chosen state, from a list, so every member of a district is spelled the same
  const districts = useMemo(() => districtsOf(form.stateCode)
    .map((d) => ({ en: d[0], label: districtName(d, lang) }))
    .sort((a, b) => a.label.localeCompare(b.label, lang)), [form.stateCode, lang])
  const district = districts.some((d) => d.en === form.district) ? form.district : '' // an old typed draft is dropped

  const required = [!!form.name?.trim(), phoneOk && !applied, emailOk, adult, !!form.stateCode, !!district, !!photo]
  const filled = required.filter(Boolean).length
  const total = required.length

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', timeZone: 'UTC' })), [lang])
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - 18 - 1920 + 1 }, (_, i) => thisYear - 18 - i) // members are 18 or older

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!photo) return setError(t('join.photoNeeded'))
    if (!dobReal) return setError(dobProblem || t('join.badDate', { defaultValue: 'Please choose your date of birth' }))
    if (!adult) return setError(dobProblem)
    if (!agree) return setError(t('privacy.needAgree', { defaultValue: 'Please tick the box to agree before sending.' }))
    setBusy(true)
    try {
      const data = new FormData()
      const fields = Object.entries(form).filter(([k]) => !k.startsWith('dob') && k !== 'district') // the three date lists become one date
        ;[...fields, ['dob', dob], ['district', district]].forEach(([k, v]) => v && data.append(k, v))
      data.append('photo', await shrinkImage(photo), 'photo.jpg')
      data.append('consent', 'true')
      await api.post('/members', data)
      dropDraft()
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    dropDraft()
    setForm({})
    setTouched({})
    setRestored(false)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl" aria-hidden="true">✅</div>
          <h1 className="mb-2 text-2xl font-extrabold text-brand sm:text-3xl">{t('join.doneTitle')}</h1>
          <p className="text-lg text-navy/80">{t('join.doneBody')}</p>
          <Link to="/membership/status" className="btn mt-6 gap-2 bg-mist text-brand hover:bg-brand hover:text-white">🔍 {t('status.link')}</Link>
        </div>
      </div>
    )
  }

  const input = 'input pl-11'
  const why = [
    ['🪪', t('join.why1', { defaultValue: 'A membership card with your own member number' })],
    ['📅', t('join.why2', { defaultValue: 'Invitations to meetings, rallies and events' })],
    ['📢', t('join.why3', { defaultValue: 'News and campaigns first' })],
    ['🤝', t('join.why4', { defaultValue: 'Be part of the movement in your state' })],
    ['⚖️', t('join.why5', { defaultValue: 'Support when you face injustice' })],
  ]
  const photoButton = 'btn min-h-11 cursor-pointer gap-2 px-4 py-2 text-sm focus-within:ring-4 focus-within:ring-brand/20 sm:text-base'

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
      <form onSubmit={submit} className="flex min-w-0 flex-col gap-5">
        <Link to="/membership/status" className="flex items-center justify-center gap-2 rounded-xl border border-brand/15 bg-mist px-4 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-white">
          🔍 {t('status.link')}
        </Link>

        {restored && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-gold/60 bg-gold/10 px-4 py-3 text-sm">
            <span className="flex-1">💾 {t('join.draftRestored', { defaultValue: 'We kept what you typed last time.' })} {t('join.photoAgain', { defaultValue: 'Please choose your photo again.' })}</span>
            <button type="button" onClick={startOver} className="font-semibold text-brand underline">{t('join.startOver', { defaultValue: 'Start again' })}</button>
          </div>
        )}

        {/* How much is left */}
        <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
            <span>{filled === total
              ? `🎉 ${t('join.allDone', { defaultValue: 'All set! You can send your application.' })}`
              : t('join.progress', { done: filled, total, defaultValue: '{{done}} of {{total}} required fields done' })}</span>
            <span className="text-navy/50"><span className="text-red-600">*</span> {t('join.required', { defaultValue: 'Required' })}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled}>
            <div className={`h-full rounded-full transition-all duration-500 ${filled === total ? 'bg-green-600' : 'bg-gold'}`} style={{ width: `${(filled / total) * 100}%` }} />
          </div>
        </div>

        <Section emoji="👤" title={t('join.secAbout', { defaultValue: 'About you' })} done={required[0] && required[1] && required[2] && required[3]}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('join.name')} icon="user" required ok={!!form.name?.trim()} className="sm:col-span-2">
              <input type="text" required autoComplete="name" value={form.name || ''} onChange={set('name')} className={`${input} pr-10`} />
            </Field>
            <Field label={t('join.phone')} prefix="+91" required ok={phoneOk && !applied} problem={phoneProblem}>
              <input type="tel" inputMode="numeric" required autoComplete="tel-national" maxLength="15" placeholder="98765 43210"
                value={phone} onChange={set('phone', (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10))}
                onBlur={blur('phone')} className="input pr-10 pl-14 tracking-wide" />
            </Field>
            <div className="flex flex-col gap-1.5 font-semibold" role="group" aria-labelledby="dob-label">
              <span id="dob-label">{t('join.dob')}<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></span>
              <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
                <select required aria-label={t('join.day', { defaultValue: 'Day' })} value={dobDay} onChange={set('dobDay')} className="input px-2">
                  <option value="">{t('join.day', { defaultValue: 'Day' })}</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
                <select required aria-label={t('join.month', { defaultValue: 'Month' })} value={dobMonth} onChange={set('dobMonth')} className="input px-2">
                  <option value="">{t('join.month', { defaultValue: 'Month' })}</option>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select required aria-label={t('join.year', { defaultValue: 'Year' })} value={dobYear} onChange={set('dobYear')} className="input px-2">
                  <option value="">{t('join.year', { defaultValue: 'Year' })}</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {dobProblem && <span className="text-xs font-semibold text-red-700">⚠️ {dobProblem}</span>}
            </div>
            {applied && (
              <p role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
                <span>ℹ️ {t('join.alreadyApplied', { defaultValue: 'This mobile number has already applied.' })}</span>
                <Link to="/membership/status" className="font-bold text-brand underline">{t('status.link')}</Link>
              </p>
            )}
            <Field label={t('join.email')} icon="mail" required ok={emailOk} problem={emailProblem} className="sm:col-span-2">
              <input type="email" required autoComplete="email" placeholder="name@example.com" value={form.email || ''}
                onChange={set('email', (v) => v.trim())} onBlur={blur('email')} className={`${input} pr-10`} />
            </Field>
          </div>
        </Section>

        <Section emoji="📍" title={t('join.secPlace', { defaultValue: 'Where you live' })} done={!!form.stateCode && !!district}>
          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">

            {/* State from a list, so each application reaches the right state team */}
            <Field label={t('join.state')} icon="map" required>
              <select required value={form.stateCode || ''} onChange={(e) => setForm((old) => ({ ...old, stateCode: e.target.value, district: '' }))} className={input}>
                <option value="" disabled>—</option>
                {[['state', t('join.states')], ['ut', t('join.uts')]].map(([type, groupLabel]) => (
                  <optgroup key={type} label={groupLabel}>
                    {STATES.filter((s) => s.type === type)
                      .sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang))
                      .map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label={t('join.district')} icon="pin" required>
              <select required value={district} onChange={set('district')} disabled={!form.stateCode} className={`${input} disabled:opacity-60`}>
                <option value="" disabled>{form.stateCode ? '—' : t('join.stateFirst', { defaultValue: 'Choose your state first' })}</option>
                {districts.map((d) => <option key={d.en} value={d.en}>{d.label}</option>)}
              </select>
            </Field>
            <Field label={t('join.city')} icon="home" className="sm:col-span-2">
              <input type="text" autoComplete="address-level3" value={form.city || ''} onChange={set('city')} className={input} />
            </Field>
            {[['assemblyNo', 'join.assemblyNo'], ['lokSabhaNo', 'join.lokSabhaNo']].map(([f, label]) => (
              <Field key={f} label={t(label)} icon="vote">
                <input inputMode="numeric" pattern="[0-9]{1,3}" maxLength="3" value={form[f] || ''}
                  onChange={set(f, (v) => v.replace(/\D/g, ''))} className={input} />
              </Field>
            ))}
          </div>
          <p className="mt-3 flex gap-2 rounded-lg bg-mist/70 p-3 text-sm text-navy/70"><span aria-hidden="true">💡</span>{t('join.constituencyHint')}</p>
        </Section>

        <Section emoji="📸" title={t('join.photo')} done={!!photo}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-mist bg-mist text-brand/50">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Svg name="user" size={40} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {/* Phones and tablets: open the front camera straight away */}
                <label className={`${photoButton} hidden bg-brand text-white pointer-coarse:inline-flex`}>
                  <Svg name="camera" /> {t('join.takePhoto', { defaultValue: 'Take photo' })}
                  <input type="file" accept="image/*" capture="user" onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} className="sr-only" />
                </label>
                <label className={`${photoButton} border-2 border-brand bg-white text-brand hover:bg-brand hover:text-white`}>
                  <Svg name="image" />
                  {photo ? t('join.changePhoto', { defaultValue: 'Change photo' }) : t('join.fromGallery', { defaultValue: 'Choose from gallery' })}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} className="sr-only" />
                </label>
              </div>
              <p className="mt-2 text-sm text-navy/60">{t('join.photoHint')}</p>
              {photo && <p className="mt-1 truncate text-xs text-navy/50">📎 {photo.name}</p>}
            </div>
          </div>
        </Section>

        <Section emoji="💬" title={t('join.message')}>
          <textarea rows="3" maxLength="500" value={form.message || ''} onChange={set('message')} className="input" />
          <p className="mt-1 text-right text-xs text-navy/50">{(form.message || '').length}/500</p>
        </Section>

        {/* Hidden trap for bots. Real visitors never see or fill this. */}
        <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true"
          onChange={set('website')} className="absolute -left-2499.75 h-0 w-0 opacity-0" />

        <Consent checked={agree} onChange={(v) => { setAgree(v); setError('') }} error={!!error && !agree}
          text={t('privacy.agreeJoin', { defaultValue: 'I am 18 or older. I agree that my details and photo are used for my membership (my card shows my name, photo and state), as explained in the Privacy Policy.' })} />

        {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}

        <button disabled={busy || applied} className="btn gap-2 bg-gold text-lg text-navy shadow-md hover:brightness-95 disabled:opacity-60">
          <Svg name="send" />
          {busy ? t('join.sending') : t('join.submit')}
        </button>
        <p className="flex items-start justify-center gap-1.5 px-2 text-center text-sm text-navy/60">
          <Svg name="lock" size={15} className="mt-0.5 shrink-0" /> {t('join.privacy', { defaultValue: 'Your details are safe with us and seen only by our team.' })}
        </p>
      </form>

      {/* Why join: beside the form on computers, below it on phones */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-2xl bg-navy text-white shadow-md">
          <div className="bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.8),transparent_70%)] p-6">
            <img src="/logo.png" alt="" className="mb-3 h-16 w-16 object-contain" />
            <h2 className="text-xl font-extrabold">{t('join.whyTitle', { defaultValue: 'Why join?' })}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {why.map(([emoji, text]) => (
                <li key={emoji} className="flex items-start gap-3 text-sm leading-snug text-white/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base" aria-hidden="true">{emoji}</span>
                  <span className="pt-1.5">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-sm font-bold text-gold">
              {['educate', 'organize', 'struggle'].map((k) => t(`about.${k}.title`)).join(' · ')}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
