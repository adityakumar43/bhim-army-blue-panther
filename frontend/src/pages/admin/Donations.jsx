import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading, Pill } from './ui.jsx'
import Icon from '../../components/BoxIcon.jsx' // two-tone icons for the coloured boxes

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
      {!data && !error && <ListLoading />}
      {data && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="card flex items-center gap-4 p-4 sm:p-5">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700"><Icon name="rupee" size={24} /></span>
              <div>
                <div className="text-3xl leading-none font-extrabold text-brand">{rupees(data.total)}</div>
                <div className="mt-1 text-sm font-semibold text-navy/70">Total received</div>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-4 sm:p-5">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><Icon name="heart" size={24} /></span>
              <div>
                <div className="text-3xl leading-none font-extrabold text-brand">{data.items.length}</div>
                <div className="mt-1 text-sm font-semibold text-navy/70">Donations</div>
              </div>
            </div>
          </div>
          {data.items.length === 0 && <p className="card text-center text-navy/70">📭 No donations yet.</p>}
          <ul className="grid gap-4 xl:grid-cols-2">
            {data.items.map((d) => (
              <li key={d._id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-extrabold text-white">
                      {d.name?.[0]?.toUpperCase() || '🙏'}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-lg leading-tight font-bold">{d.name || 'Anonymous'}</div>
                      <div className="truncate text-sm text-navy/70">{[d.phone && `📞 ${d.phone}`, d.email && `✉️ ${d.email}`].filter(Boolean).join(' · ')}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-lg bg-green-50 px-2 text-xl font-extrabold text-green-800">{rupees(d.amount)}</div>
                    <div className="mt-0.5 text-xs text-navy/60">📅 {new Date(d.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-mist/60 px-3 py-2 text-xs text-navy/70">
                  🧾 Receipt <b className="text-navy">{d.receiptNo || 'not issued'}</b> · Payment ID <span className="break-all">{d.paymentId}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {d.email ? (
                    <>
                      <Pill tone={d.receiptEmailedAt ? 'green' : 'gold'}>
                        {d.receiptEmailedAt ? `📧 Emailed ${new Date(d.receiptEmailedAt).toLocaleDateString('en-IN')}` : '📭 Not emailed yet'}
                      </Pill>
                      <button onClick={() => resend(d._id)} className="abtn min-h-9 px-3">
                        📤 {d.receiptEmailedAt ? 'Send again' : 'Send receipt'}
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
