import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import { STATES, stateName } from '../data/states.js'
import { CATEGORIES, STATUS, categoryOf } from '../data/helpdesk.js'
import Consent from '../components/Consent.jsx'
import DistrictSelect from '../components/DistrictSelect.jsx'
import Icon from '../components/Icon.jsx'

const EMPTY = { name: '', phone: '', email: '', stateCode: '', district: '', village: '', policeStation: '', category: '', incidentDate: '', description: '', website: '' }
const PHONE_OK = /^[6-9]\d{9}$/
const MIN = 20, MAX = 3000
const MAX_PHOTOS = 3
const MAX_VOICE = 180 // seconds
const LAST = 'helpdesk-last' // the last reference number on this phone, so "Track" is filled in for them
const cleanPhone = (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)

const read = () => { try { return JSON.parse(localStorage.getItem(LAST)) || null } catch { return null } }
const save = (v) => { try { localStorage.setItem(LAST, JSON.stringify(v)) } catch { /* storage blocked */ } }

// The red star on fields that must be filled
const Req = () => <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Short, general points about a person's rights. The text is in the locale files.
const RIGHTS = ['fir', 'zero', 'sp', 'duty', 'relief', 'copies']
const RIGHTS_EN = {
  fir: 'For a serious (cognisable) offence, the police must register an FIR. You can ask for a free copy of it.',
  zero: 'You can file an FIR at any police station, even if the incident happened in another area (Zero FIR).',
  sp: 'If the police station refuses, give your complaint in writing to the Superintendent of Police (SP) of the district, or go to the court (magistrate).',
  duty: 'Under the SC/ST (Prevention of Atrocities) Act, a government servant (who is not SC/ST) who wilfully neglects their duty under the Act, such as not registering your complaint, can be punished.',
  relief: 'Victims of atrocities are entitled to relief money and support from the government under this Act.',
  copies: 'Keep a copy of every application you give. Note the date and the name of the officer.',
}
function Rights({ t }) {
  return (
    <details className="group mb-6 rounded-2xl border border-brand/15 bg-white shadow-sm open:shadow-md">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="scale" size={20} /></span>
        <span className="flex-1">
          <span className="block font-extrabold">{t('help.rightsTitle', { defaultValue: 'Know your rights' })}</span>
          <span className="block text-sm text-navy/60">{t('help.rightsIntro', { defaultValue: 'What the police and the law must do for you' })}</span>
        </span>
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-lg text-brand transition group-open:rotate-45">+</span>
      </summary>
      <div className="px-5 pb-5">
        <ul className="flex flex-col gap-2.5">
          {RIGHTS.map((k) => (
            <li key={k} className="flex gap-2.5 text-navy/85"><span aria-hidden="true" className="mt-0.5 text-green-600">✔</span><span>{t(`help.rights.${k}`, { defaultValue: RIGHTS_EN[k] })}</span></li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg bg-gold/10 px-3 py-2 text-xs text-navy/70">ℹ️ {t('help.rightsNote', { defaultValue: 'This is general information, not legal advice. Our team can guide you on your case.' })}</p>
      </div>
    </details>
  )
}

// Record a voice message in the browser (up to 3 minutes). value = { blob, url, seconds } or null.
function VoiceRecorder({ t, value, onChange }) {
  const [recording, setRecording] = useState(false)
  const [secs, setSecs] = useState(0)
  const [err, setErr] = useState('')
  const live = useRef(null) // { recorder, stream, timer }

  // Leaving the page while recording: switch the microphone off
  useEffect(() => () => {
    const l = live.current
    if (!l) return
    clearInterval(l.timer)
    if (l.recorder.state === 'recording') { l.recorder.onstop = null; l.recorder.stop() }
    l.stream.getTracks().forEach((tr) => tr.stop())
  }, [])

  async function start() {
    setErr('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setErr(t('help.voiceNoSupport', { defaultValue: 'Voice recording does not work in this browser. Please write instead.' }))
    let stream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {
      return setErr(t('help.voiceDenied', { defaultValue: 'Please allow the microphone to record a voice message.' }))
    }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported?.(m))
    const recorder = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined)
    const chunks = []
    const started = Date.now()
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = () => {
      clearInterval(live.current?.timer)
      stream.getTracks().forEach((tr) => tr.stop())
      live.current = null
      setRecording(false)
      const blob = new Blob(chunks, { type: recorder.mimeType || type || 'audio/webm' })
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
      if (blob.size) onChange({ blob, url: URL.createObjectURL(blob), seconds })
    }
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - started) / 1000)
      setSecs(s)
      if (s >= MAX_VOICE && recorder.state === 'recording') recorder.stop()
    }, 250)
    live.current = { recorder, stream, timer }
    recorder.start(1000)
    setSecs(0)
    setRecording(true)
  }
  const stop = () => live.current?.recorder.state === 'recording' && live.current.recorder.stop()
  const remove = () => { if (value) URL.revokeObjectURL(value.url); onChange(null) }

  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50/40 p-4">
      <p className="font-semibold">🎤 {t('help.voiceTitle', { defaultValue: 'Or record a voice message' })}</p>
      <p className="mt-0.5 text-xs text-navy/60">{t('help.voiceHint', { defaultValue: 'Hard to type? Speak and tell us what happened (up to 3 minutes).' })}</p>

      {!recording && !value && (
        <button type="button" onClick={start} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-red-700">
          <span aria-hidden="true">🎙️</span> {t('help.voiceStart', { defaultValue: 'Start recording' })}
        </button>
      )}
      {recording && (
        <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
          <span className="flex items-center gap-2 font-mono text-lg font-bold text-red-700">
            <span aria-hidden="true" className="h-3 w-3 animate-pulse rounded-full bg-red-600" /> {clock(secs)} <span className="text-sm font-normal text-navy/50">/ {clock(MAX_VOICE)}</span>
          </span>
          <button type="button" onClick={stop} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white hover:bg-brand">
            <span aria-hidden="true">⏹️</span> {t('help.voiceStop', { defaultValue: 'Stop' })}
          </button>
          <span className="sr-only">{t('help.voiceRecording', { defaultValue: 'Recording' })}</span>
        </div>
      )}
      {value && !recording && (
        <div className="mt-3 flex flex-col gap-2">
          <audio controls src={value.url} className="w-full max-w-md" />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-green-700">✓ {t('help.voiceDone', { defaultValue: 'Voice message ready' })} ({clock(value.seconds)})</span>
            <button type="button" onClick={remove} className="font-semibold text-red-700 underline">🗑️ {t('help.removePhoto', { defaultValue: 'Remove' })}</button>
            <button type="button" onClick={() => { remove(); start() }} className="font-semibold text-brand underline">🔁 {t('help.voiceAgain', { defaultValue: 'Record again' })}</button>
          </div>
        </div>
      )}
      {err && <p role="alert" className="mt-2 text-sm text-red-700">⚠️ {err}</p>}
    </div>
  )
}

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
  const [photos, setPhotos] = useState([]) // up to 3 files
  const [voice, setVoice] = useState(null) // { blob, url, seconds }
  const [sent, setSent] = useState(null) // { refNo, phone } after a report goes through
  const [copied, setCopied] = useState(false)
  const [track, setTrack] = useState(() => { const l = read(); return { refNo: l?.refNo || '', phone: l?.phone || '' } })
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false) // the "I agree" tick box

  const [when, setWhen] = useState({ day: '', month: '', year: '' }) // date of the incident, from three dropdowns
  const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))
  const date = (d) => new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' })

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])
  // Copy the files first: the file box is emptied right after, so the same photo can be picked again
  const addPhotos = (list) => { const files = Array.from(list || []); setPhotos((old) => [...old, ...files].slice(0, MAX_PHOTOS)) }

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', timeZone: 'UTC' })), [lang])
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => thisYear - i)

  const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])
  const phoneOk = PHONE_OK.test(form.phone)
  const descLen = form.description.trim().length
  const done1 = !!form.category
  const done2 = !!form.stateCode && (descLen >= MIN || !!voice)
  const needsStation = ['police', 'atrocity'].includes(form.category)
  const done3 = !!form.name.trim() && phoneOk

  async function report(e) {
    e.preventDefault()
    setError('')
    if (!form.category) return setError(t('help.pickCategory', { defaultValue: 'Please choose what the problem is about.' }))
    if (!form.stateCode) return setError(t('help.pickState', { defaultValue: 'Please choose your state.' }))
    if (descLen < MIN && !voice) return setError(t('help.tooShortVoice', { defaultValue: 'Please write what happened (at least 20 letters), or record a voice message.' }))
    if (!form.name.trim()) return setError(t('help.needName', { defaultValue: 'Please enter your name.' }))
    if (!phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
    const pad = (n) => String(n).padStart(2, '0')
    const incidentDate = when.day && when.month && when.year ? `${when.year}-${pad(when.month)}-${pad(when.day)}` : ''
    if ((when.day || when.month || when.year) && !incidentDate) return setError(t('help.fullDate', { defaultValue: 'Choose the day, month and year of the incident, or leave all three empty.' }))
    if (incidentDate && new Date(`${incidentDate}T00:00:00Z`).toISOString().slice(0, 10) !== incidentDate) return setError(t('join.badDate', { defaultValue: 'This date does not exist. Please check the day and month.' }))
    if (incidentDate > new Date().toLocaleDateString('en-CA')) return setError(t('help.futureDate', { defaultValue: 'The date of the incident cannot be in the future.' }))
    if (!agree) return setError(t('privacy.needAgree', { defaultValue: 'Please tick the box to agree before sending.' }))
    setBusy(true)
    try {
      const data = new FormData()
      Object.entries({ ...form, incidentDate }).forEach(([k, v]) => v && data.append(k, v))
      data.append('consent', 'true')
      for (const [i, f] of photos.entries()) data.append('photos', await shrinkImage(f), `photo-${i + 1}.jpg`)
      if (voice) {
        const ext = voice.blob.type.includes('mp4') ? 'm4a' : voice.blob.type.includes('ogg') ? 'ogg' : 'webm'
        data.append('voice', voice.blob, `voice.${ext}`)
        data.append('voiceSeconds', voice.seconds)
      }
      const r = await api.post('/helpdesk', data)
      const mine = { refNo: r.refNo, phone: form.phone }
      setSent(mine)
      setAgree(false)
      save(mine)
      setTrack(mine)
      setForm(EMPTY)
      setWhen({ day: '', month: '', year: '' })
      setPhotos([])
      if (voice) URL.revokeObjectURL(voice.url)
      setVoice(null)
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

      <Rights t={t} />

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
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true"><Icon name="check" size={32} /></span>
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
          <p className="-mb-1 text-sm text-navy/60"><Req /> {t('help.requiredNote', { defaultValue: 'Required fields' })}</p>
          <Part n="1" title={<>{t('help.category')}<Req /></>} done={done1}>
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
              <label className="flex flex-col gap-1.5 font-semibold"><span>📍 {t('help.state')}<Req /></span>
                <select required value={form.stateCode} onChange={set('stateCode')} className="input">
                  <option value="">{t('help.choose', { defaultValue: '— Choose —' })}</option>
                  {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">🏘️ {t('help.district')}
                <DistrictSelect stateCode={form.stateCode} value={form.district} onChange={(v) => setForm((old) => ({ ...old, district: v }))} />
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">🏡 {t('help.village', { defaultValue: 'Village / locality' })}
                <input maxLength="100" value={form.village} onChange={set('village')} className="input" />
              </label>
              <label className="flex flex-col gap-1.5 font-semibold">👮 {t('help.policeStation', { defaultValue: 'Police station (thana)' })}
                <input maxLength="100" value={form.policeStation} onChange={set('policeStation')} className={`input ${needsStation ? 'border-gold ring-2 ring-gold/30' : ''}`} />
                {needsStation && <span className="text-xs font-normal text-navy/65">💡 {t('help.stationHint', { defaultValue: 'Important for this kind of complaint. Write the name of the police station.' })}</span>}
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
              <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2"><span>📝 {t('help.description')}<Req /></span>
                <textarea required rows="6" maxLength={MAX} value={form.description} onChange={set('description')}
                  placeholder={t('help.descriptionHint')} className="input resize-y" />
                <span className="flex justify-between text-xs font-normal">
                  <span className={descLen >= MIN || voice ? 'text-green-700' : 'text-navy/50'}>
                    {descLen >= MIN ? `✓ ${t('help.enough', { defaultValue: 'Good' })}` : voice ? `✓ ${t('help.voiceInstead', { defaultValue: 'Voice message added' })}` : t('help.minHintVoice', { defaultValue: 'At least 20 letters, or record a voice message below' })}
                  </span>
                  <span className={form.description.length > MAX - 150 ? 'font-bold text-red-600' : 'text-navy/50'}>{form.description.length} / {MAX}</span>
                </span>
              </label>
            </div>

            <VoiceRecorder t={t} value={voice} onChange={setVoice} />

            {/* Photos or documents (up to 3) */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-navy/15 p-4">
              <p className="font-semibold">📎 {t('help.photo')} <span className="text-sm font-normal text-navy/55">({photos.length}/{MAX_PHOTOS})</span></p>
              {photos.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-3">
                  {previews.map((src, i) => (
                    <li key={src} className="relative">
                      <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-navy/10" />
                      <button type="button" onClick={() => setPhotos((old) => old.filter((_, k) => k !== i))}
                        aria-label={`${t('help.removePhoto', { defaultValue: 'Remove' })} ${i + 1}`}
                        className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow ring-2 ring-white">✕</button>
                    </li>
                  ))}
                </ul>
              )}
              {photos.length < MAX_PHOTOS && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Phones and tablets: open the back camera straight away */}
                  <label className={`${photoButton} hidden bg-brand text-white pointer-coarse:inline-flex`}>
                    📷 {t('join.takePhoto', { defaultValue: 'Take photo' })}
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} className="sr-only" />
                  </label>
                  <label className={`${photoButton} border-2 border-brand bg-white text-brand hover:bg-brand hover:text-white`}>
                    🖼️ {photos.length ? t('help.addMore', { defaultValue: 'Add more' }) : t('join.fromGallery', { defaultValue: 'Choose from gallery' })}
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} className="sr-only" />
                  </label>
                </div>
              )}
              <p className="mt-2 text-xs text-navy/55">{t('help.photosHint', { defaultValue: 'Up to 3 photos. For example a photo of the incident, an FIR copy or an application.' })}</p>
            </div>
          </Part>

          <Part n="3" title={t('help.contactTitle', { defaultValue: 'How can we reach you?' })} done={done3}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 font-semibold"><span>{t('help.name')}<Req /></span>
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">👤</span>
                  <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input pl-10" />
                </span>
              </label>
              <label className="flex flex-col gap-1.5 font-semibold"><span>{t('help.phone')}<Req /></span>
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                  <input required type="tel" inputMode="numeric" maxLength="15" placeholder="12345 67890" autoComplete="tel-national" value={form.phone}
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

          <Consent checked={agree} onChange={(v) => { setAgree(v); setError('') }} error={!!error && !agree}
            text={t('privacy.agreeHelp', { defaultValue: 'I agree that the details I give, including photos and voice messages, are used by the team to help me, as explained in the Privacy Policy.' })} />

          {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}
          <button disabled={busy} className="btn w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">{busy ? t('help.sending') : `📤 ${t('help.submit')}`}</button>
          <p className="-mt-2 text-center text-xs text-navy/60">🔒 {t('help.privacy')}</p>
        </form>
      )}

      {tab === 'track' && (
        <>
          <form onSubmit={lookUp} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-1 flex items-center gap-3 text-lg font-extrabold">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="search" size={20} /></span>
              {t('help.trackTitle', { defaultValue: 'Check your complaint' })}
            </h2>
            <p className="mb-5 text-sm text-navy/60">{t('help.trackIntro', { defaultValue: 'Enter the reference number you got and the mobile number you gave.' })}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 font-semibold"><span>🎫 {t('help.refNo')}<Req /></span>
                <input required placeholder="HD-261026-7KQ3" value={track.refNo} onChange={(e) => setTrack({ ...track, refNo: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  className="input font-mono tracking-wide uppercase" />
              </label>
              <label className="flex flex-col gap-1.5 font-semibold"><span>📱 {t('help.phone')}<Req /></span>
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                  <input required type="tel" inputMode="numeric" maxLength="15" value={track.phone} onChange={(e) => setTrack({ ...track, phone: cleanPhone(e.target.value) })} className="input pl-14 tracking-wide" />
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
              {found.history?.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-extrabold">🕒 {t('help.updates', { defaultValue: 'Updates on your complaint' })}</h3>
                  <ol className="relative ml-2 border-l-2 border-navy/10">
                    {[...found.history].reverse().map((h, i) => (
                      <li key={i} className="mb-5 ml-6 last:mb-0">
                        <span aria-hidden="true" className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full ring-4 ring-white ${i === 0 ? 'bg-brand' : 'bg-navy/25'}`} />
                        <div className="text-xs font-semibold text-navy/55">{date(h.at)}</div>
                        <div className="font-bold">{STATUS[h.status]?.emoji} {STATUS[h.status]?.[lang] || h.status}</div>
                        {h.note && <p className="mt-1.5 rounded-lg bg-mist/60 px-3 py-2 text-sm whitespace-pre-line">💬 {h.note}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {!found.history?.length && found.publicNote && (
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
