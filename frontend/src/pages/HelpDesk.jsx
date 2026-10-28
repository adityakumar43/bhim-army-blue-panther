import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import { STATES, stateName } from '../data/states.js'
import { CATEGORIES, STATUS, categoryOf } from '../data/helpdesk.js'

const EMPTY = { name: '', phone: '', email: '', stateCode: '', district: '', category: '', incidentDate: '', description: '', website: '' }
const PHONE_OK = /^[6-9]\d{9}$/
const MIN = 20, MAX = 3000
const LAST = 'helpdesk-last' // the last reference number on this phone, so "Track" is filled in for them
const cleanPhone = (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)

const read = () => { try { return JSON.parse(localStorage.getItem(LAST)) || null } catch { return null } }
const save = (v) => { try { localStorage.setItem(LAST, JSON.stringify(v)) } catch { /* storage blocked */ } }

// One numbered part of the form
function Part({ n, title, done, children }) {
  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold">
        <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition ${done ? 'bg-green-600 text-white' : 'bg-mist text-brand'}`}>
          {done ? '✓' : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

// Where a complaint is: received → action in progress → resolved (or closed)
function Progress({ status, lang }) {
  const order = ['new', 'in_progress', 'resolved']
  const at = status === 'closed' ? 3 : order.indexOf(status)
  return (
    <ol className="mt-5 grid grid-cols-3">
      {order.map((key, i) => {
        const state = status === 'closed' ? 'done' : i < at ? 'done' : i === at ? (key === 'resolved' ? 'done' : 'now') : 'todo'
        const dot = { done: 'bg-green-600 text-white', now: 'bg-gold text-navy ring-4 ring-gold/30', todo: 'border-2 border-navy/15 bg-white text-navy/40' }[state]
        return (
          <li key={key} className="relative flex flex-col items-center text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute top-4 right-1/2 h-1 w-full -translate-y-1/2 ${state === 'todo' ? 'bg-navy/10' : 'bg-green-500'}`} />}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${dot}`}>{state === 'done' ? '✓' : i + 1}</span>
            <span className={`mt-2 text-xs font-semibold sm:text-sm ${state === 'todo' ? 'text-navy/45' : 'text-navy'}`}>{STATUS[key][lang]}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Public help desk: report a problem, or track one already reported
export default function HelpDesk() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'hi' ? 'hi' : 'en'
  const [tab, setTab] = useState('report')
  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [sent, setSent] = useState(null) // { refNo, phone } after a report goes through
  const [copied, setCopied] = useState(false)
  const [track, setTrack] = useState(() => { const l = read(); return { refNo: l?.refNo || '', phone: l?.phone || '' } })
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [when, setWhen] = useState({ day: '', month: '', year: '' }) // date of the incident, from three dropdowns
  const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))
  const date = (d) => new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' })

  useEffect(() => {
    if (!photo) return setPreview('')
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', timeZone: 'UTC' })), [lang])
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => thisYear - i)

  const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])
  const phoneOk = PHONE_OK.test(form.phone)
  const descLen = form.description.trim().length
  const done1 = !!form.category
  const done2 = !!form.stateCode && descLen >= MIN
  const done3 = !!form.name.trim() && phoneOk

  async function report(e) {
    e.preventDefault()
    setError('')
    if (!form.category) return setError(t('help.pickCategory', { defaultValue: 'Please choose what the problem is about.' }))
    if (!form.stateCode) return setError(t('help.pickState', { defaultValue: 'Please choose your state.' }))
    if (descLen < MIN) return setError(t('help.tooShort', { defaultValue: 'Please tell us a little more about what happened (at least 20 letters).' }))
    if (!form.name.trim()) return setError(t('help.needName', { defaultValue: 'Please enter your name.' }))
    if (!phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
    const pad = (n) => String(n).padStart(2, '0')
    const incidentDate = when.day && when.month && when.year ? `${when.year}-${pad(when.month)}-${pad(when.day)}` : ''
    if ((when.day || when.month || when.year) && !incidentDate) return setError(t('help.fullDate', { defaultValue: 'Choose the day, month and year of the incident, or leave all three empty.' }))
    if (incidentDate && new Date(`${incidentDate}T00:00:00Z`).toISOString().slice(0, 10) !== incidentDate) return setError(t('join.badDate', { defaultValue: 'This date does not exist. Please check the day and month.' }))
    if (incidentDate > new Date().toLocaleDateString('en-CA')) return setError(t('help.futureDate', { defaultValue: 'The date of the incident cannot be in the future.' }))
    setBusy(true)
    try {
      const data = new FormData()
      Object.entries({ ...form, incidentDate }).forEach(([k, v]) => v && data.append(k, v))
      if (photo) data.append('photo', await shrinkImage(photo), 'photo.jpg')
      const r = await api.post('/helpdesk', data)
      const mine = { refNo: r.refNo, phone: form.phone }
      setSent(mine)
      save(mine)
      setTrack(mine)
      setForm(EMPTY)
      setWhen({ day: '', month: '', year: '' })
      setPhoto(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function lookUp(e) {
    e?.preventDefault()
    setBusy(true)
    setError('')
    setFound(null)
    try {
      setFound(await api.post('/helpdesk/track', track))
      save(track)
    } catch (err) {
      setError(err.message.startsWith('No complaint') ? t('help.notFound') : err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (key) => { setTab(key); setError(''); setSent(null); setFound(null); setCopied(false) }
  const copy = async () => { try { await navigator.clipboard.writeText(sent.refNo); setCopied(true) } catch { /* not allowed */ } }
  const photoButton = 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-within:ring-4 focus-within:ring-brand/30'

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
      {/* Emergency: tap to call */}
      <div role="note" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
        <p className="flex gap-2 font-bold text-red-900"><span aria-hidden="true">🚨</span>{t('help.emergency')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a href="tel:112" className="flex min-h-12 items-center gap-3 rounded-xl bg-red-600 px-4 text-white shadow-sm hover:bg-red-700">
            <span className="text-xl" aria-hidden="true">📞</span>
            <span className="leading-tight"><b className="text-lg">112</b><span className="block text-xs text-white/85">{t('help.police', { defaultValue: 'Police / emergency' })}</span></span>
          </a>
          <a href="tel:14566" className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-red-600 bg-white px-4 text-red-700 hover:bg-red-100">
            <span className="text-xl" aria-hidden="true">📞</span>
            <span className="leading-tight"><b className="text-lg">14566</b><span className="block text-xs text-red-800/80">{t('help.atrocityLine', { defaultValue: 'National helpline against atrocities on SC/ST (free)' })}</span></span>
          </a>
        </div>
      </div>

      <div role="tablist" className="mb-6 flex gap-1 rounded-2xl border border-navy/10 bg-white p-1 shadow-sm">
        {[['report', `📝 ${t('help.reportTab')}`], ['track', `🔍 ${t('help.trackTab')}`]].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => switchTab(key)}
            className={`min-h-11 flex-1 rounded-xl px-3 font-semibold transition ${tab === key ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* After sending: the reference number, big and easy to keep */}
      {tab === 'report' && sent && (
        <section role="status" className="rounded-2xl border border-green-300 bg-green-50 p-6 text-center shadow-sm sm:p-8">
          <p className="text-5xl" aria-hidden="true">✅</p>
          <h2 className="mt-2 text-2xl font-extrabold text-green-900">{t('help.thanks')}</h2>
          <p className="mt-2 text-navy/75">{t('help.yourRef')}</p>
          <div className="my-3 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-xl bg-white px-5 py-3 font-mono text-2xl font-extrabold tracking-wider text-brand ring-2 ring-brand/20">{sent.refNo}</span>
            <button type="button" onClick={copy} className="btn min-h-12 gap-1 border-2 border-brand bg-white px-3 text-sm text-brand">
              {copied ? `✓ ${t('help.copied', { defaultValue: 'Copied' })}` : `📋 ${t('help.copy', { defaultValue: 'Copy' })}`}
            </button>
          </div>
          <p className="mx-auto max-w-md text-sm text-navy/70">📸 {t('help.saveRef')}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy/70">📞 {t('help.weWillCall', { defaultValue: 'Our team will contact you on your mobile number.' })}</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => { switchTab('track'); setTimeout(lookUp, 0) }} className="btn gap-2 bg-brand text-white hover:bg-navy">🔍 {t('help.trackNow', { defaultValue: 'See progress' })}</button>
            <button type="button" onClick={() => setSent(null)} className="btn border-2 border-brand bg-white text-brand">{t('help.another')}</button>
          </div>
        </section>
      )}

      {tab === 'report' && !sent && (
        <form onSubmit={report} noValidate className="flex flex-col gap-5">
          <Part n="1" title={t('help.category')} done={done1}>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => setForm((o) => ({ ...o, category: c.key }))} aria-pressed={form.category === c.key}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${form.category === c.key ? 'border-brand bg-brand/5 text-brand shadow-sm' : 'border-navy/10 bg-white text-navy/80 hover:border-brand/40 hover:bg-mist/50'}`}>
                  <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
                  <span className="flex-1">{c[lang]}</span>
                  {form.category === c.key && <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">✓</span>}
                </button>
              ))}
            </div>
          </Part>

          <Part n="2" title={t('help.detailsTitle', { defaultValue: 'Tell us what happened' })} done={done2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 font-semibold">📍 {t('help.state')}
                <select required value={form.stateCode} onChange={set('stateCode')} className="input">
                  <option value="">{t('help.choose', { defaultValue: '— Choose —' })}</option>
                  {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">🏘️ {t('help.district')}
                <input maxLength="100" value={form.district} onChange={set('district')} className="input" />
              </label>
              <div role="group" aria-labelledby="help-date" className="flex flex-col gap-1.5 font-semibold sm:col-span-2">
                <span id="help-date">📅 {t('help.date')}</span>
                <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2 sm:max-w-md">
                  <select aria-label={t('join.day', { defaultValue: 'Day' })} value={when.day} onChange={(e) => setWhen({ ...when, day: e.target.value })} className="input px-2">
                    <option value="">{t('join.day', { defaultValue: 'Day' })}</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <select aria-label={t('join.month', { defaultValue: 'Month' })} value={when.month} onChange={(e) => setWhen({ ...when, month: e.target.value })} className="input px-2">
                    <option value="">{t('join.month', { defaultValue: 'Month' })}</option>
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select aria-label={t('join.year', { defaultValue: 'Year' })} value={when.year} onChange={(e) => setWhen({ ...when, year: e.target.value })} className="input px-2">
                    <option value="">{t('join.year', { defaultValue: 'Year' })}</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">📝 {t('help.description')}
                <textarea required rows="6" maxLength={MAX} value={form.description} onChange={set('description')}
                  placeholder={t('help.descriptionHint')} className="input resize-y" />
                <span className="flex justify-between text-xs font-normal">
                  <span className={descLen >= MIN ? 'text-green-700' : 'text-navy/50'}>
                    {descLen >= MIN ? `✓ ${t('help.enough', { defaultValue: 'Good' })}` : t('help.minHint', { defaultValue: 'At least 20 letters' })}
                  </span>
                  <span className={form.description.length > MAX - 150 ? 'font-bold text-red-600' : 'text-navy/50'}>{form.description.length} / {MAX}</span>
                </span>
              </label>
            </div>

            {/* Photo or document */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-navy/15 p-4">
              <p className="font-semibold">📎 {t('help.photo')}</p>
              {preview ? (
                <div className="mt-3 flex items-center gap-3">
                  <img src={preview} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-navy/10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-navy/70">{photo.name}</p>
                    <button type="button" onClick={() => setPhoto(null)} className="mt-1 text-sm font-semibold text-red-700 underline">🗑️ {t('help.removePhoto', { defaultValue: 'Remove' })}</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Phones and tablets: open the back camera straight away */}
                  <label className={`${photoButton} hidden bg-brand text-white pointer-coarse:inline-flex`}>
                    📷 {t('join.takePhoto', { defaultValue: 'Take photo' })}
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} className="sr-only" />
                  </label>
                  <label className={`${photoButton} border-2 border-brand bg-white text-brand hover:bg-brand hover:text-white`}>
                    🖼️ {t('join.fromGallery', { defaultValue: 'Choose from gallery' })}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} className="sr-only" />
                  </label>
                </div>
              )}
              <p className="mt-2 text-xs text-navy/55">{t('help.photoHint', { defaultValue: 'For example a photo of the incident, an FIR copy or an application. JPG or PNG.' })}</p>
            </div>
          </Part>

          <Part n="3" title={t('help.contactTitle', { defaultValue: 'How can we reach you?' })} done={done3}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 font-semibold">{t('help.name')}
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">👤</span>
                  <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input pl-10" />
                </span>
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">{t('help.phone')}
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                  <input required type="tel" inputMode="numeric" maxLength="10" placeholder="12345 67890" autoComplete="tel-national" value={form.phone}
                    onChange={set('phone', cleanPhone)} className="input pr-9 pl-14 tracking-wide" />
                  {phoneOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
                </span>
              </label>
              <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">{t('help.email')}
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">📧</span>
                  <input type="email" autoComplete="email" placeholder="name@gmail.com" value={form.email} onChange={set('email', (v) => v.trim())} className="input pl-10" />
                </span>
              </label>
            </div>
          </Part>

          {/* Hidden trap for bots */}
          <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}
          <button disabled={busy} className="btn w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">{busy ? t('help.sending') : `📤 ${t('help.submit')}`}</button>
          <p className="-mt-2 text-center text-xs text-navy/60">🔒 {t('help.privacy')}</p>
        </form>
      )}

      {tab === 'track' && (
        <>
          <form onSubmit={lookUp} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 flex items-center gap-3 text-lg font-extrabold">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-xl" aria-hidden="true">🔍</span>
              {t('help.trackTitle', { defaultValue: 'Check your complaint' })}
            </h2>
            <p className="mb-5 text-sm text-navy/60">{t('help.trackIntro', { defaultValue: 'Enter the reference number you got and the mobile number you gave.' })}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 font-semibold">🎫 {t('help.refNo')}
                <input required placeholder="HD-261026-7KQ3" value={track.refNo} onChange={(e) => setTrack({ ...track, refNo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  className="input font-mono tracking-wide uppercase" />
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">📱 {t('help.phone')}
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                  <input required type="tel" inputMode="numeric" maxLength="10" value={track.phone} onChange={(e) => setTrack({ ...track, phone: cleanPhone(e.target.value) })} className="input pl-14 tracking-wide" />
                </span>
              </label>
            </div>
            {error && <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}
            <button disabled={busy} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">{busy ? t('help.checking') : `🔍 ${t('help.track')}`}</button>
          </form>

          {found && (
            <section aria-live="polite" className="mt-5 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-navy/60">{found.refNo}</p>
                  <h2 className="mt-1 text-2xl font-extrabold">{STATUS[found.status]?.emoji} {STATUS[found.status]?.[lang]}</h2>
                </div>
                <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-brand">{categoryOf(found.category).emoji} {categoryOf(found.category)[lang]}</span>
              </div>
              <Progress status={found.status} lang={lang} />
              <dl className="mt-5 grid gap-2 rounded-xl bg-mist/50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-navy/60">📅 {t('help.reportedOn')}</dt><dd className="font-bold">{date(found.createdAt)}</dd></div>
                <div><dt className="text-navy/60">🔄 {t('help.updatedOn')}</dt><dd className="font-bold">{date(found.updatedAt)}</dd></div>
              </dl>
              {found.publicNote && (
                <div className="mt-4 rounded-xl border-l-4 border-brand bg-mist/60 px-4 py-3">
                  <p className="text-xs font-bold text-brand">💬 {t('help.messageFromTeam')}</p>
                  <p className="mt-1 whitespace-pre-line">{found.publicNote}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
