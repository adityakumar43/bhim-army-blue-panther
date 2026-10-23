import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'

const PRESETS = [100, 500, 1000, 2500]

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
  const [amount, setAmount] = useState(500)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const input = 'input'

  async function pay(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await loadCheckout()
      const order = await api.post('/donations/order', { amount, ...form })
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
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="mb-3 text-3xl font-extrabold text-brand">{t('donate.doneTitle')}</h1>
        <p className="text-lg">{t('donate.doneBody')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      
      <form onSubmit={pay} className="panel flex flex-col gap-4 sm:p-8">
        <fieldset>
          <legend className="mb-2 font-semibold">{t('donate.amount')}</legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button type="button" key={p} onClick={() => setAmount(p)} aria-pressed={amount === p}
                className={`border px-5 py-3 font-semibold ${amount === p ? 'border-brand bg-brand text-white' : 'border-navy/30'}`}>
                ₹{p}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 font-semibold">{t('donate.other')}
          <input type="number" min="10" max="500000" value={amount}
            onChange={(e) => setAmount(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">{t('donate.name')}
          <input onChange={set('name')} autoComplete="name" className={input} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">{t('donate.phone')}
          <input type="tel" inputMode="numeric" onChange={set('phone')} autoComplete="tel" className={input} />
        </label>
        <label className="flex flex-col gap-1 font-semibold">{t('donate.email')}
          <input type="email" onChange={set('email')} autoComplete="email" className={input} />
        </label>
        <p className="-mt-2 text-sm text-navy/70">{t('donate.receiptHint')}</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="btn bg-gold text-lg text-navy disabled:opacity-60">
          {busy ? t('donate.wait') : `${t('donate.pay')} ₹${amount || 0}`}
        </button>
      </form>
    </div>
  )
}
