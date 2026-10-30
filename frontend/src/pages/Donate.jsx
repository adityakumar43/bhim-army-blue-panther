import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import Icon from '../components/BoxIcon.jsx' // two-tone icons for the coloured boxes

const PRESETS = [100, 500, 1000, 2500, 5000]
const MIN = 10, MAX = 500000
const PHONE_OK = /^[6-9]\d{9}$/
const EMAIL_OK = /^\S+@\S+\.\S+$/
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const cleanPhone = (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)

// The kinds of work a donation supports. The text is in the locale files, so it can be changed there.
const USES = [
  ['legal', '⚖️', 'Legal help for victims of injustice'],
  ['education', '📚', 'Education and free tuition'],
  ['helpdesk', '🆘', 'Help desk for people in trouble'],
  ['awareness', '📣', 'Awareness programmes and events'],
]

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Could not load the payment window. Check your internet and try again.'))
    document.body.appendChild(s)
  })
}

export default function Donate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('500')
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (f, clean = (v) => v) => (e) => { setError(''); setForm((old) => ({ ...old, [f]: clean(e.target.value) })) }

  const value = Number(amount) || 0
  const amountOk = Number.isInteger(value) && value >= MIN && value <= MAX
  const isPreset = PRESETS.includes(value)
  const phoneOk = PHONE_OK.test(form.phone)
  const emailOk = EMAIL_OK.test(form.email)

  async function pay(e) {
    e.preventDefault()
    setError('')
    if (!amountOk) return setError(t('donate.badAmount', { defaultValue: 'Enter an amount between ₹10 and ₹5,00,000.' }))
    if (form.phone && !phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
    if (form.email && !emailOk) return setError(t('contact.badEmail', { defaultValue: 'Please check your email address.' }))
    setBusy(true)
    try {
      await loadCheckout()
      const order = await api.post('/donations/order', { amount: value, ...form })
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        order_id: order.orderId,
        name: t('org'),
        description: t('donate.desc'),
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#0B3C9D' },
        handler: async (resp) => {
          try {
            const r = await api.post('/donations/verify', resp)
            if (r.receiptToken) navigate(`/receipt/${r.receiptToken}`)
            else setDone(true)
          } catch (err) {
            setError(err.message)
          } finally {
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })
      rzp.on('payment.failed', () => {
        setError(t('donate.failed'))
        setBusy(false)
      })
      rzp.open()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <section role="status" className="rounded-2xl border border-green-300 bg-green-50 p-8 text-center shadow-sm">
          <p className="text-5xl" aria-hidden="true">🙏</p>
          <h2 className="mt-3 text-3xl font-extrabold text-green-900">{t('donate.doneTitle')}</h2>
          <p className="mt-2 text-lg text-navy/80">{t('donate.doneBody')}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:py-12 lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:px-10">
      {/* Left: what the money supports, and that paying is safe (below the form on phones) */}
      <aside className="order-2 flex flex-col gap-5 lg:order-1">
        <section className="rounded-2xl bg-gradient-to-br from-navy to-brand p-6 text-white shadow-md">
          <p className="text-3xl" aria-hidden="true">💙</p>
          <h2 className="mt-2 text-xl font-extrabold">{t('donate.whyTitle', { defaultValue: 'Your support moves our work forward' })}</h2>
          <p className="mt-1 text-sm text-white/80">{t('donate.whyBody', { defaultValue: 'Every rupee helps us stand with people who face injustice and discrimination.' })}</p>
          <ul className="mt-5 grid gap-2.5">
            {USES.map(([key, icon, en]) => (
              <li key={key} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
                <span className="text-xl" aria-hidden="true">{icon}</span>
                <span className="text-sm font-semibold">{t(`donate.use_${key}`, { defaultValue: en })}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex gap-3"><span className="text-xl" aria-hidden="true">🔒</span><span><b>{t('donate.safeTitle', { defaultValue: 'Safe payment' })}</b><br /><span className="text-navy/70">{t('donate.safeBody', { defaultValue: 'Payments are handled by Razorpay. We never see your card or bank details.' })}</span></span></li>
            <li className="flex gap-3"><span className="text-xl" aria-hidden="true">📱</span><span><b>{t('donate.waysTitle', { defaultValue: 'Pay your way' })}</b><br /><span className="text-navy/70">{t('donate.waysBody', { defaultValue: 'UPI, debit or credit card, or net banking.' })}</span></span></li>
            <li className="flex gap-3"><span className="text-xl" aria-hidden="true">🧾</span><span><b>{t('donate.receiptTitle', { defaultValue: 'Instant receipt' })}</b><br /><span className="text-navy/70">{t('donate.receiptBody', { defaultValue: 'You get a receipt right after paying. You can print it or save it as PDF.' })}</span></span></li>
          </ul>
        </section>
      </aside>

      {/* Right: the form (first on phones) */}
      <form onSubmit={pay} noValidate className="order-1 flex flex-col gap-5 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:order-2 lg:self-start">
        <fieldset>
          <legend className="mb-3 flex items-center gap-3 text-lg font-extrabold">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="rupee" size={20} /></span>
            {t('donate.amount')}
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PRESETS.map((p) => (
              <button type="button" key={p} onClick={() => { setError(''); setAmount(String(p)) }} aria-pressed={value === p}
                className={`min-h-14 rounded-xl border-2 text-lg font-extrabold transition ${value === p ? 'border-brand bg-brand text-white shadow-md shadow-brand/20' : 'border-navy/10 bg-white text-navy hover:border-brand/40 hover:bg-mist/50'}`}>
                {rupees(p)}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5 font-semibold">{t('donate.other')}
          <span className="relative block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xl font-bold text-brand" aria-hidden="true">₹</span>
            <input type="text" inputMode="numeric" value={amount} placeholder="1000"
              onChange={(e) => { setError(''); setAmount(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 6)) }}
              className={`input pl-9 text-lg font-bold ${!isPreset && amount ? 'border-brand ring-2 ring-brand/20' : ''}`} />
          </span>
          {amount && !amountOk && <span className="text-sm font-normal text-red-700">{t('donate.badAmount', { defaultValue: 'Enter an amount between ₹10 and ₹5,00,000.' })}</span>}
        </label>

        <div className="border-t border-navy/10 pt-5">
          <h2 className="mb-1 flex items-center gap-3 text-lg font-extrabold">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="receipt" size={20} /></span>
            {t('donate.detailsTitle', { defaultValue: 'Details for your receipt' })}
          </h2>
          <p className="mb-4 text-sm text-navy/60">{t('donate.detailsHint', { defaultValue: 'You can leave these empty to donate without your name.' })}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">{t('donate.name')}
              <span className="relative block">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">👤</span>
                <input value={form.name} onChange={set('name')} maxLength="100" autoComplete="name" className="input pl-10" />
              </span>
            </label>
            <label className="flex flex-col gap-1.5 font-semibold">{t('donate.phone')}
              <span className="relative block">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                <input type="tel" inputMode="numeric" maxLength="15" placeholder="12345 67890" value={form.phone} onChange={set('phone', cleanPhone)} autoComplete="tel-national" className="input pr-9 pl-14 tracking-wide" />
                {phoneOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
              </span>
            </label>
            <label className="flex flex-col gap-1.5 font-semibold">{t('donate.email')}
              <span className="relative block">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">📧</span>
                <input type="email" placeholder="name@gmail.com" value={form.email} onChange={set('email', (v) => v.trim())} autoComplete="email" className="input pr-9 pl-10" />
                {emailOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-navy/60">📧 {t('donate.receiptHint')}</p>
        </div>

        {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}
        <button disabled={busy} className="btn min-h-14 w-full gap-2 bg-gold text-lg font-extrabold text-navy shadow-md hover:brightness-95 disabled:opacity-60">
          {busy ? t('donate.wait') : <>💙 {t('donate.pay')} {amountOk ? rupees(value) : ''}</>}
        </button>
        <p className="-mt-2 text-center text-xs text-navy/55">🔒 {t('donate.secure', { defaultValue: 'Secure payment by Razorpay' })} · {t('privacy.byDonating', { defaultValue: 'By donating, you agree to our' })} <Link to="/privacy" className="font-semibold text-brand underline">{t('privacy.title', { defaultValue: 'Privacy Policy' })}</Link></p>
      </form>
    </div>
  )
}
