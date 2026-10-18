import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { ORG } from '../lib/orgInfo.js'

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const input = 'input'

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/contact', form)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-12 lg:grid-cols-2 lg:px-16">
      <div>
        <h1 className="mb-6 text-4xl font-extrabold">{t('contact.title')}</h1>
        <dl className="flex flex-col gap-4 text-lg">
          <div><dt className="font-semibold text-brand">{t('contact.address')}</dt><dd>{t('address')}</dd></div>
          {/* <div><dt className="font-semibold text-brand">{t('contact.phone')}</dt><dd>{ORG.phone}</dd></div> */}
          {/* <div><dt className="font-semibold text-brand">{t('contact.email')}</dt><dd>{ORG.email}</dd></div> */}
        </dl>
      </div>

      {done ? (
        <div>
          <h2 className="mb-2 text-2xl font-extrabold text-brand">{t('contact.doneTitle')}</h2>
          <p className="text-lg">{t('contact.doneBody')}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 font-semibold">{t('contact.name')}
            <input required onChange={set('name')} autoComplete="name" className={input} />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('contact.phone')}
            <input type="tel" inputMode="numeric" onChange={set('phone')} autoComplete="tel" className={input} />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('contact.email')}
            <input type="email" onChange={set('email')} autoComplete="email" className={input} />
          </label>
          <label className="flex flex-col gap-1 font-semibold">{t('contact.message')}
            <textarea required rows="5" maxLength="2000" onChange={set('message')} className={input} />
          </label>
          <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true"
            onChange={set('website')} className="absolute -left-2499.75 h-0 w-0 opacity-0" />
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">
            {busy ? t('contact.sending') : t('contact.send')}
          </button>
        </form>
      )}
    </div>
  )
}
