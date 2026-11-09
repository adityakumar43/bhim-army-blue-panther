import { useState } from 'react'
import { api } from '../../lib/api.js'
import { usePaged, LoadMore } from './paged.jsx'
import { PageHeader, Notice, ListLoading, Pill, useFind, matchesFind, FindNote } from './ui.jsx'
import Icon from '../../components/BoxIcon.jsx' // two-tone icons for the coloured boxes

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN')
// Like "9 Nov 2026" (Indian time), the same as the other admin pages, not 9/11/2026
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export default function Donations() {
  const { find, clear: clearFind } = useFind() // opened from the search box at the top
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // A page at a time, newest first, with totals over every donation; from the search box, the server finds the match
  const { items, meta, more, busy, load, loadMore } = usePaged(`/donations${find ? `?find=${encodeURIComponent(find)}` : ''}`, 1000, { pick: (r) => r.items, onError: (e) => setError(e.message) })

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
      <FindNote find={find} clear={clearFind} />
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {!items && !error && <ListLoading />}
      {items && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 bg-green-100 text-green-700"><Icon name="rupee" size={24} /></span>
              <div>
                <div className="text-2xl leading-none font-extrabold text-brand sm:text-3xl">{rupees(meta?.total || 0)}</div>
                <div className="mt-1 text-sm font-semibold text-navy/70">Total received</div>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 bg-rose-100 text-rose-700"><Icon name="heart" size={24} /></span>
              <div>
                <div className="text-2xl leading-none font-extrabold text-brand sm:text-3xl">{meta?.count ?? items.length}</div>
                <div className="mt-1 text-sm font-semibold text-navy/70">Donations</div>
              </div>
            </div>
          </div>
          {items.length === 0 && <p className="card text-center text-navy/70">📭 No donations yet.</p>}
          {/* One line per donation, like a table: who, how much, when and the receipt, then the email */}
          {items.length > 0 && (
            <div className="card overflow-hidden p-0 sm:p-0">
              <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_6.5rem_13rem_18rem] gap-4 border-b border-navy/10 bg-mist/50 px-4 py-2 text-xs font-extrabold tracking-wider text-navy/65 uppercase lg:grid">
                <span>Donor</span><span className="text-right">Amount</span><span>Date · Receipt</span><span>Receipt email</span>
              </div>
              <ul className="divide-y divide-navy/8">
                {items.filter((d) => matchesFind(find, d.receiptNo, d.name, d.email, d.phone)).map((d) => (
                  <li key={d._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-mist/30 lg:grid-cols-[minmax(0,1fr)_6.5rem_13rem_18rem]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                        {d.name?.[0]?.toUpperCase() || '🙏'}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-bold">{d.name || 'Anonymous'}</div>
                        <div className="truncate text-sm text-navy/65">{[d.phone && `📞 ${d.phone}`, d.email && `✉️ ${d.email}`].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                    <div className="text-right text-lg font-extrabold text-green-800">{rupees(d.amount)}</div>
                    <div className="col-span-2 min-w-0 text-xs text-navy/65 lg:col-span-1">
                      <div>📅 {day(d.createdAt)} · 🧾 <b className="text-navy">{d.receiptNo || 'not issued'}</b></div>
                      {d.paymentId && <div className="truncate" title={d.paymentId}>Payment ID {d.paymentId}</div>}
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1">
                      {d.email ? (
                        <>
                          <Pill tone={d.receiptEmailedAt ? 'green' : 'gold'}>
                            {d.receiptEmailedAt ? `📧 Emailed ${day(d.receiptEmailedAt)}` : '📭 Not emailed'}
                          </Pill>
                          <button type="button" onClick={() => resend(d._id)} className="abtn min-h-8 px-2.5 text-sm">
                            📤 {d.receiptEmailedAt ? 'Again' : 'Send'}
                          </button>
                        </>
                      ) : <Pill tone="gray">No email given</Pill>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <LoadMore more={more} busy={busy} onClick={loadMore} count={items.length} noun="donations" />
        </>
      )}
    </>
  )
}
