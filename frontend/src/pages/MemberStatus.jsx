import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'

const LOOK = {
  pending: ['⏳', 'bg-gold/15 border-gold/50'],
  approved: ['✅', 'bg-green-50 border-green-300'],
  rejected: ['❌', 'bg-red-50 border-red-200'],
}

// Applicants check their own application with their mobile number and date of birth
export default function MemberStatus() {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({ phone: '', dob: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const date = (d) => new Date(d).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await api.post('/members/status', form))
    } catch (err) {
      setError(err.message.startsWith('We could not find') ? t('status.notFound') : err.message)
    } finally {
      setBusy(false)
    }
  }

  const [emoji, tone] = LOOK[result?.status] || LOOK.pending

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <form onSubmit={submit} className="panel flex flex-col gap-4 sm:p-8">
        <label className="flex flex-col gap-1 font-semibold">{t('status.phone')}
          <input type="tel" inputMode="numeric" required autoComplete="tel" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
        </label>
        <label className="flex flex-col gap-1 font-semibold">{t('status.dob')}
          <input type="date" required max={new Date().toLocaleDateString('en-CA')} value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })} className="input" />
        </label>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">
          {busy ? t('status.checking') : `🔍 ${t('status.check')}`}
        </button>
      </form>

      {result && (
        <section aria-live="polite" className={`mt-6 rounded-2xl border p-6 ${tone}`}>
          <p className="text-sm text-navy/70">{t('status.hello', { name: result.name })}</p>
          <h2 className="mt-1 text-2xl font-extrabold">{emoji} {t(`status.${result.status}`)}</h2>
          <p className="mt-2 text-navy/80">{t(`status.${result.status}Body`)}</p>
          <dl className="mt-4 grid gap-1 text-sm">
            <div className="flex gap-2"><dt className="text-navy/60">{t('status.appliedOn')}:</dt><dd className="font-semibold">{date(result.appliedAt)}</dd></div>
            {result.memberNo && <div className="flex gap-2"><dt className="text-navy/60">{t('status.memberNo')}:</dt><dd className="font-semibold">{result.memberNo}</dd></div>}
          </dl>
          {result.cardToken && (
            <Link to={`/card/${result.cardToken}`} className="btn mt-5 bg-brand text-white">🪪 {t('status.openCard')}</Link>
          )}
        </section>
      )}

      <p className="mt-6 text-center text-sm text-navy/70">
        {t('status.notApplied')} <Link to="/join" className="font-semibold text-brand underline">{t('status.joinNow')}</Link>
      </p>
    </div>
  )
}
