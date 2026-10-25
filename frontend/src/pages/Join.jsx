import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import { STATES, stateName } from '../data/states.js'

const FIELDS = ['name', 'phone', 'email', 'city', 'district']

export default function Join() {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({})
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (!photo) throw new Error(t('join.photoNeeded'))
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v))
      data.append('photo', await shrinkImage(photo), 'photo.jpg')
      await api.post('/members', data)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="mb-3 text-3xl font-extrabold text-brand">{t('join.doneTitle')}</h1>
        <p className="text-lg">{t('join.doneBody')}</p>
      </div>
    )
  }

  const input = 'input'
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="mx-auto max-w-xl px-5 py-12">

      <form onSubmit={submit} className="panel flex flex-col gap-4 sm:p-8">
        {FIELDS.map((f) => (
          <label key={f} className="flex flex-col gap-1 font-semibold">
            {t(`join.${f}`)}
            <input
              type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
              inputMode={f === 'phone' ? 'numeric' : undefined}
              required={f === 'name' || f === 'phone' || f === 'email'}
              autoComplete={f === 'name' ? 'name' : f === 'phone' ? 'tel' : f === 'email' ? 'email' : 'off'}
              onChange={set(f)} className={input}
            />
          </label>
        ))}

        {/* State from a list, so each application reaches the right state team */}
        <label className="flex flex-col gap-1 font-semibold">
          {t('join.state')}
          <select required defaultValue="" onChange={set('stateCode')} className={input}>
            <option value="" disabled>—</option>
            {[['state', t('join.states')], ['ut', t('join.uts')]].map(([type, groupLabel]) => (
              <optgroup key={type} label={groupLabel}>
                {STATES.filter((s) => s.type === type)
                  .sort((a, b) => stateName(a, i18n.language).localeCompare(stateName(b, i18n.language), i18n.language))
                  .map((s) => <option key={s.code} value={s.code}>{stateName(s, i18n.language)}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        {[['assemblyNo', 'join.assemblyNo'], ['lokSabhaNo', 'join.lokSabhaNo']].map(([f, label]) => (
          <label key={f} className="flex flex-col gap-1 font-semibold">
            {t(label)}
            <input inputMode="numeric" pattern="[0-9]{1,3}" maxLength="3" onChange={set(f)} className={input} />
          </label>
        ))}
        <p className="-mt-2 text-sm text-navy/70">{t('join.constituencyHint')}</p>


        <label className="flex flex-col gap-1 font-semibold">
          {t('join.dob')}
          <input type="date" required max={new Date().toLocaleDateString('en-CA')} autoComplete="bday"
            onChange={set('dob')} className={input} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">
          {t('join.photo')}
          <span className="text-sm font-normal text-navy/70">{t('join.photoHint')}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" required
            onChange={(e) => setPhoto(e.target.files[0] || null)} className="font-normal" />
        </label>

        <label className="flex flex-col gap-1 font-semibold">
          {t('join.message')}
          <textarea rows="3" maxLength="500" onChange={set('message')} className={input} />
        </label>
        {/* Hidden trap for bots. Real visitors never see or fill this. */}
        <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true"
          onChange={set('website')} className="absolute -left-2499.75 h-0 w-0 opacity-0" />
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">
          {busy ? t('join.sending') : t('join.submit')}
        </button>
      </form>
    </div>
  )
}
