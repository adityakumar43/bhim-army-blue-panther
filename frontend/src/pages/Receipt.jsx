import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/text.js'
import { ORG } from '../lib/orgInfo.js'

export default function Receipt() {
  const { token } = useParams()
  const { t, i18n } = useTranslation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer
    let tries = 0
    async function load() {
      try {
        const r = await api.get(`/donations/receipt/${token}`)
        if (cancelled) return
        setData(r)
        // The payment can take a few seconds to be confirmed, so check again
        if (r.pending && tries++ < 10) timer = setTimeout(load, 3000)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [token])

  if (error) return <p role="alert" className="px-5 py-16 text-center text-red-700">{error}</p>
  if (!data) return <p className="px-5 py-16 text-center">{t('loading')}</p>
  if (data.pending) return <p role="status" className="px-5 py-16 text-center text-lg">{t('receipt.pending')}</p>

  const rows = [
    [t('receipt.no'), data.receiptNo],
    [t('receipt.date'), formatDate(data.paidAt, i18n.language)],
    [t('receipt.donor'), data.name || t('receipt.anonymous')],
    [t('receipt.amount'), `₹${Number(data.amount).toLocaleString('en-IN')}`],
    [t('receipt.paymentId'), data.paymentId],
  ]

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="mb-6 text-center text-xl font-extrabold text-brand print:hidden">{t('receipt.thanks')}</p>
      <article className="border-2 border-navy p-6">
        <h1 className="text-2xl font-extrabold">{t('org')}</h1>
        <p className="mb-5 text-navy/80">{t('address')}</p>
        <h2 className="mb-4 border-t border-navy/20 pt-4 text-xl font-extrabold">{t('receipt.title')}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-navy/80">{t('receipt.note')}</p>
      </article>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
        <button onClick={() => window.print()} className="btn bg-brand text-white">{t('receipt.print')}</button>
        <Link to="/" className="btn border-2 border-navy">{t('receipt.home')}</Link>
      </div>
    </div>
  )
}
