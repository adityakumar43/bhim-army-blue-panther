import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'

// "I will attend" box on an event's own page
export default function EventRsvp({ eventId }) {
  const { t } = useTranslation()
  const key = `rsvp:${eventId}`
  const [info, setInfo] = useState(null) // { people, registrations, open }
  const [form, setForm] = useState({ name: '', phone: '', district: '', people: '1' })
  const [done, setDone] = useState(() => { try { return localStorage.getItem(key) === '1' } catch { return false } })
  const [open, setOpenForm] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.get(`/rsvp/${eventId}`).then(setInfo).catch(() => setInfo(null)) }, [eventId])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api.post(`/rsvp/${eventId}`, form)
      setInfo((i) => ({ ...i, people: r.people, registrations: r.registrations }))
      setDone(true)
      setOpenForm(false)
      try { localStorage.setItem(key, '1') } catch { /* storage blocked */ }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!info) return null
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <section className="mt-8 rounded-2xl border border-brand/15 bg-mist/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">🙋 {t('rsvp.title')}</h2>
          {info.people > 0 && <p className="text-navy/70">👥 {t('rsvp.coming', { count: info.people })}</p>}
        </div>
        {info.open && !done && !open && (
          <button onClick={() => setOpenForm(true)} className="btn bg-brand text-white">✅ {t('rsvp.attend')}</button>
        )}
      </div>

      {!info.open && <p className="mt-3 font-semibold text-navy/70">{t('rsvp.closed')}</p>}

      {done && info.open && (
        <p role="status" className="mt-3 rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-900">
          🎉 {t('rsvp.done')} <button onClick={() => { setDone(false); setOpenForm(true) }} className="ml-1 text-sm font-normal underline">{t('rsvp.change')}</button>
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 font-semibold">{t('rsvp.name')}
            <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('rsvp.phone')}
            <input required type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={set('phone')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('rsvp.district')}
            <input maxLength="100" value={form.district} onChange={set('district')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('rsvp.people')}
            <input type="number" min="1" max="20" required value={form.people} onChange={set('people')} className="input" />
          </label>
          {/* Hidden trap for bots */}
          <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {error && <p role="alert" className="text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className="btn flex-1 bg-brand text-white disabled:opacity-60">{busy ? t('rsvp.sending') : t('rsvp.submit')}</button>
            <button type="button" onClick={() => setOpenForm(false)} className="btn border-2 border-navy/20">{t('rsvp.cancel')}</button>
          </div>
          <p className="text-xs text-navy/60 sm:col-span-2">{t('rsvp.privacy')}</p>
        </form>
      )}
    </section>
  )
}
