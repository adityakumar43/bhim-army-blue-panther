import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'

const ICONS = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  check: 'M20 6L9 17l-5-5',
  x: 'M6 6l12 12M18 6L6 18',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4',
  card: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 10h20M6 15h4',
}
const Svg = ({ name, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={ICONS[name]} /></svg>
)

const LOOK = {
  pending: { emoji: '⏳', box: 'border-gold/60 bg-gold/10', badge: 'bg-gold text-navy' },
  approved: { emoji: '🎉', box: 'border-green-300 bg-green-50', badge: 'bg-green-600 text-white' },
  rejected: { emoji: '❌', box: 'border-red-200 bg-red-50', badge: 'bg-red-600 text-white' },
  cancelled: { emoji: '🚫', box: 'border-red-200 bg-red-50', badge: 'bg-red-600 text-white' },
}
const PHONE_OK = /^[6-9]\d{9}$/
const pad = (n) => String(n).padStart(2, '0')

// The three steps of an application: sent → reviewed by the team → decision
function Steps({ status, t }) {
  const steps = [
    [t('status.stepApplied', { defaultValue: 'Application sent' }), 'done'],
    [t('status.stepReview', { defaultValue: 'Team review' }), status === 'pending' ? 'now' : 'done'],
    [t('status.stepDone', { defaultValue: 'Decision' }), status === 'approved' || status === 'cancelled' ? 'done' : status === 'rejected' ? 'no' : 'todo'],
  ]
  const dot = { done: 'bg-green-600 text-white', now: 'bg-gold text-navy ring-4 ring-gold/30', no: 'bg-red-600 text-white', todo: 'bg-white text-navy/40 border-2 border-navy/15' }
  return (
    <ol className="mt-5 grid grid-cols-3">
      {steps.map(([label, state], i) => (
        <li key={label} className="relative flex flex-col items-center text-center">
          {i > 0 && <span aria-hidden="true" className={`absolute top-4 right-1/2 h-1 w-full -translate-y-1/2 ${state === 'todo' ? 'bg-navy/10' : state === 'no' ? 'bg-red-300' : 'bg-green-500'}`} />}
          <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${dot[state]}`}>
            {state === 'done' ? <Svg name="check" size={16} /> : state === 'no' ? <Svg name="x" size={16} /> : i + 1}
          </span>
          <span className={`mt-2 text-xs font-semibold sm:text-sm ${state === 'todo' ? 'text-navy/45' : 'text-navy'}`}>{label}</span>
        </li>
      ))}
    </ol>
  )
}

// Applicants check their own application with their mobile number and date of birth
export default function MemberStatus() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [form, setForm] = useState({ phone: '', day: '', month: '', year: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const date = (d) => new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' })
  const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))

  const phoneOk = PHONE_OK.test(form.phone)
  const dob = form.day && form.month && form.year ? `${form.year}-${pad(form.month)}-${pad(form.day)}` : ''
  const dobReal = dob && new Date(`${dob}T00:00:00Z`).toISOString().slice(0, 10) === dob
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', timeZone: 'UTC' })), [lang])
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - 1920 }, (_, i) => thisYear - 1 - i)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
    if (!dobReal) return setError(t('join.badDate', { defaultValue: 'This date does not exist. Please check the day and month.' }))
    setBusy(true)
    try {
      setResult(await api.post('/members/status', { phone: form.phone, dob }))
    } catch (err) {
      setError(err.message.startsWith('We could not find') ? t('status.notFound') : err.message)
    } finally {
      setBusy(false)
    }
  }

  const look = LOOK[result?.status] || LOOK.pending
  const select = 'input px-2'

  return (
    <div className="mx-auto max-w-xl px-5 py-10 sm:py-12">
      {!result && (
        <form onSubmit={submit} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-extrabold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist text-xl" aria-hidden="true">🔍</span>
            {t('status.lookup', { defaultValue: 'Find your application' })}
          </h2>

          <label className="flex flex-col gap-1.5 font-semibold">{t('status.phone')}
            <span className="relative block">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
              <input type="tel" inputMode="numeric" required autoComplete="tel-national" maxLength="10" placeholder="98765 43210" value={form.phone}
                onChange={set('phone', (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10))}
                className="input pr-10 pl-14 tracking-wide" />
              {phoneOk && <Svg name="check" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-green-600" />}
            </span>
          </label>

          <div className="mt-4 flex flex-col gap-1.5 font-semibold" role="group" aria-labelledby="status-dob">
            <span id="status-dob">{t('status.dob')}</span>
            <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
              <select required aria-label={t('join.day', { defaultValue: 'Day' })} value={form.day} onChange={set('day')} className={select}>
                <option value="">{t('join.day', { defaultValue: 'Day' })}</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
              <select required aria-label={t('join.month', { defaultValue: 'Month' })} value={form.month} onChange={set('month')} className={select}>
                <option value="">{t('join.month', { defaultValue: 'Month' })}</option>
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select required aria-label={t('join.year', { defaultValue: 'Year' })} value={form.year} onChange={set('year')} className={select}>
                <option value="">{t('join.year', { defaultValue: 'Year' })}</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}

          <button disabled={busy} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">
            <Svg name="search" /> {busy ? t('status.checking') : t('status.check')}
          </button>
          <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-navy/55">
            <Svg name="lock" size={14} className="mt-px shrink-0" />
            {t('status.privacy', { defaultValue: 'We only show the status of your application. Your details stay private.' })}
          </p>
        </form>
      )}

      {result && (
        <section aria-live="polite" className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${look.box}`}>
          <p className="text-sm font-semibold text-navy/70">🙏 {t('status.hello', { name: result.name })}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{look.emoji}</span>
            <h2 className="text-2xl font-extrabold">{t(`status.${result.status}`)}</h2>
          </div>
          <p className="mt-2 text-navy/80">{t(`status.${result.status}Body`)}</p>

          <Steps status={result.status} t={t} />

          <dl className="mt-6 grid gap-2 rounded-xl bg-white/70 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-navy/60">📅 {t('status.appliedOn')}</dt><dd className="font-bold">{date(result.appliedAt)}</dd></div>
            {result.memberNo && <div><dt className="text-navy/60">🪪 {t('status.memberNo')}</dt><dd className="font-bold tracking-wide">{result.memberNo}</dd></div>}
          </dl>

          {result.cardToken && (
            <Link to={`/card/${result.cardToken}`} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy">
              <Svg name="card" /> {t('status.openCard')}
            </Link>
          )}
          {(result.status === 'rejected' || result.status === 'cancelled') && (
            <Link to="/contact" className="btn mt-5 w-full gap-2 border-2 border-brand bg-white text-brand">✉️ {t('nav.contact')}</Link>
          )}
          <button type="button" onClick={() => { setResult(null); setError('') }} className="mt-4 w-full text-center text-sm font-semibold text-brand underline">
            {t('status.again', { defaultValue: 'Check another number' })}
          </button>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy/70">
        <span>{t('status.notApplied')}</span>
        <Link to="/join" className="font-bold text-brand underline">{t('status.joinNow')} →</Link>
      </div>
    </div>
  )
}
