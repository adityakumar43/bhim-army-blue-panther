import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function Donations() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const load = () => api.get('/donations').then(setData).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  async function resend(id) {
    setError('')
    setNote('')
    try {
      await api.post(`/donations/${id}/resend`)
      setNote('Receipt email sent.')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHeader title="Donations" subtitle="Payments received through the Donate page." />
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {!data && !error && <p>Loading...</p>}
      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="card">
              <div className="text-3xl font-extrabold text-brand">{rupees(data.total)}</div>
              <div className="font-semibold">Total received</div>
            </div>
            <div className="card">
              <div className="text-3xl font-extrabold text-brand">{data.items.length}</div>
              <div className="font-semibold">Donations</div>
            </div>
          </div>
          {data.items.length === 0 && <p className="text-navy/70">No donations yet.</p>}
          <ul className="grid gap-4 xl:grid-cols-2">
            {data.items.map((d) => (
              <li key={d._id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{d.name || 'Anonymous'}</div>
                    <div className="text-sm text-navy/70">{[d.phone, d.email].filter(Boolean).join(' · ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-brand">{rupees(d.amount)}</div>
                    <div className="text-sm text-navy/70">{new Date(d.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-navy/70">
                  Receipt {d.receiptNo || 'not issued'} · Payment ID {d.paymentId}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {d.email ? (
                    <>
                      <Pill tone={d.receiptEmailedAt ? 'green' : 'gold'}>
                        {d.receiptEmailedAt ? `Emailed ${new Date(d.receiptEmailedAt).toLocaleDateString('en-IN')}` : 'Not emailed yet'}
                      </Pill>
                      <button onClick={() => resend(d._id)} className="abtn">
                        {d.receiptEmailedAt ? 'Send again' : 'Send receipt'}
                      </button>
                    </>
                  ) : <Pill tone="gray">No email given</Pill>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
