import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import { STATES, stateName } from '../data/states.js'
import { CATEGORIES, STATUS, categoryOf } from '../data/helpdesk.js'

const EMPTY = { name: '', phone: '', email: '', stateCode: '', district: '', category: '', incidentDate: '', description: '' }

// Public help desk: report a problem, or track one already reported
export default function HelpDesk() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'hi' ? 'hi' : 'en'
  const [tab, setTab] = useState('report')
  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null)
  const [refNo, setRefNo] = useState('')
  const [track, setTrack] = useState({ refNo: '', phone: '' })
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const date = (d) => new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' })

  async function report(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v))
      if (photo) data.append('photo', await shrinkImage(photo), 'photo.jpg')
      const r = await api.post('/helpdesk', data)
      setRefNo(r.refNo)
      setForm(EMPTY)
      setPhoto(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function lookUp(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setFound(null)
    try {
      setFound(await api.post('/helpdesk/track', track))
    } catch (err) {
      setError(err.message.startsWith('No complaint') ? t('help.notFound') : err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (key) => { setTab(key); setError(''); setRefNo(''); setFound(null) }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="mb-5 rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
        🚑 {t('help.emergency')}
      </p>

      <div role="tablist" className="mb-5 flex gap-1 rounded-2xl border border-navy/10 bg-white p-1 shadow-sm">
        {[['report', `📝 ${t('help.reportTab')}`], ['track', `🔍 ${t('help.trackTab')}`]].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => switchTab(key)}
            className={`min-h-11 flex-1 rounded-xl px-3 font-semibold transition ${tab === key ? 'bg-brand text-white' : 'text-navy/70 hover:bg-mist'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'report' && refNo && (
        <section role="status" className="panel border-green-300 bg-green-50 text-center">
          <p className="text-4xl" aria-hidden="true">✅</p>
          <h2 className="mt-2 text-2xl font-extrabold">{t('help.thanks')}</h2>
          <p className="mt-2 text-navy/75">{t('help.yourRef')}</p>
          <p className="my-3 inline-block rounded-xl bg-white px-5 py-3 font-mono text-2xl font-extrabold tracking-wider text-brand ring-2 ring-brand/20">{refNo}</p>
          <p className="text-sm text-navy/70">{t('help.saveRef')}</p>
          <button onClick={() => setRefNo('')} className="btn mt-5 border-2 border-brand text-brand">{t('help.another')}</button>
        </section>
      )}

      {tab === 'report' && !refNo && (
        <form onSubmit={report} className="panel grid gap-4 sm:grid-cols-2 sm:p-8">
          <label className="flex flex-col gap-1 font-semibold">{t('help.name')}
            <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('help.phone')}
            <input required type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={set('phone')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('help.email')}
            <input type="email" autoComplete="email" value={form.email} onChange={set('email')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('help.state')}
            <select required value={form.stateCode} onChange={set('stateCode')} className="input">
              <option value="" disabled>—</option>
              {[...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang))
                .map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('help.district')}
            <input maxLength="100" value={form.district} onChange={set('district')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('help.category')}
            <select required value={form.category} onChange={set('category')} className="input">
              <option value="" disabled>—</option>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c[lang]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('help.date')}
            <input type="date" max={new Date().toLocaleDateString('en-CA')} value={form.incidentDate} onChange={set('incidentDate')} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('help.description')}
            <textarea required rows="6" minLength="20" maxLength="3000" value={form.description} onChange={set('description')}
              placeholder={t('help.descriptionHint')} className="input" />
            <span className="text-right text-xs font-normal text-navy/50">{form.description.length}/3000</span>
          </label>
          <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('help.photo')}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files[0] || null)} className="font-normal" />
          </label>
          {/* Hidden trap for bots */}
          <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {error && <p role="alert" className="text-red-700 sm:col-span-2">{error}</p>}
          <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60 sm:col-span-2">{busy ? t('help.sending') : `📤 ${t('help.submit')}`}</button>
          <p className="text-xs text-navy/60 sm:col-span-2">🔒 {t('help.privacy')}</p>
        </form>
      )}

      {tab === 'track' && (
        <>
          <form onSubmit={lookUp} className="panel flex flex-col gap-4 sm:p-8">
            <label className="flex flex-col gap-1 font-semibold">{t('help.refNo')}
              <input required placeholder="HD-261026-7KQ3" value={track.refNo} onChange={(e) => setTrack({ ...track, refNo: e.target.value })}
                className="input font-mono uppercase" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">{t('help.phone')}
              <input required type="tel" inputMode="numeric" value={track.phone} onChange={(e) => setTrack({ ...track, phone: e.target.value })} className="input" />
            </label>
            {error && <p role="alert" className="text-red-700">{error}</p>}
            <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">{busy ? t('help.checking') : `🔍 ${t('help.track')}`}</button>
          </form>
          {found && (
            <section aria-live="polite" className="panel mt-5">
              <p className="font-mono text-sm text-navy/60">{found.refNo}</p>
              <h2 className="mt-1 text-2xl font-extrabold">{STATUS[found.status]?.emoji} {STATUS[found.status]?.[lang]}</h2>
              <p className="mt-1 text-navy/70">{categoryOf(found.category).emoji} {categoryOf(found.category)[lang]}</p>
              <p className="mt-3 text-sm text-navy/60">{t('help.reportedOn')}: <b>{date(found.createdAt)}</b> · {t('help.updatedOn')}: <b>{date(found.updatedAt)}</b></p>
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
