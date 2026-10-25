import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthName = (key, long) => {
  const [y, m] = key.split('-').map(Number)
  return long ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1]
}

function Tile({ emoji, tint, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand/10 bg-white p-4 shadow-sm">
      <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${tint}`}>{emoji}</span>
      <div className="min-w-0">
        <div className="text-2xl leading-none font-extrabold text-navy">{value}</div>
        <div className="mt-1 text-sm font-semibold text-navy/65">{label}</div>
      </div>
    </div>
  )
}

// One bar per month. Hover or tap a bar to see its exact value.
function MonthBars({ title, data, format = (v) => v }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const last = data.at(-1)
  const shown = active ?? data.length - 1
  return (
    <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-extrabold">{title}</span>
        <span className="text-sm text-navy/60">
          {monthName(data[shown].month, true)}: <b className="text-navy">{format(data[shown].value)}</b>
        </span>
      </figcaption>
      <div className="relative mt-4 h-40" onMouseLeave={() => setActive(null)}>
        {/* light guide lines at the top and middle */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-navy/10" />
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-navy/10" />
        <span aria-hidden="true" className="absolute -top-2 right-0 bg-white pl-1 text-[10px] text-navy/45">{format(max)}</span>
        <div className="absolute inset-0 flex items-end gap-0.5 border-b border-navy/20 sm:gap-1">
          {data.map((d, i) => (
            <button key={d.month} type="button" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
              aria-label={`${monthName(d.month, true)}: ${format(d.value)}`}
              className="group flex h-full flex-1 items-end focus:outline-none">
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${i === shown ? 'bg-brand' : 'bg-brand/45 group-hover:bg-brand/70'}`}
                style={{ height: d.value ? `${Math.max(3, (d.value / max) * 100)}%` : '2px', opacity: d.value ? 1 : 0.35 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-1.5 flex gap-0.5 text-center text-[10px] text-navy/50 sm:gap-1">
        {data.map((d, i) => (
          <span key={d.month} className={`flex-1 ${i % 2 && i !== data.length - 1 ? 'max-sm:invisible' : ''}`}>{monthName(d.month)}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-navy/50">Last 12 months · this month so far: {format(last.value)}</p>
    </figure>
  )
}

// Approved members in each state, biggest first
function StateBars({ data }) {
  const [all, setAll] = useState(false)
  const top = all ? data : data.slice(0, 8)
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
      <figcaption className="mb-3 font-extrabold">🗺️ Approved members by state</figcaption>
      {data.length === 0 && <p className="text-sm text-navy/60">No approved members yet.</p>}
      <ul className="flex flex-col gap-2">
        {top.map((d) => (
          <li key={d.state} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-sm" title={`${d.state}: ${d.value}`}>
            <span className="truncate text-navy/80">{d.state}</span>
            <span className="h-3 rounded-r-[4px] bg-brand/80" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
            <b className="w-10 text-right text-navy">{d.value}</b>
          </li>
        ))}
      </ul>
      {data.length > 8 && (
        <button onClick={() => setAll(!all)} className="mt-3 text-sm font-semibold text-brand hover:underline">
          {all ? 'Show fewer' : `Show all ${data.length} states`}
        </button>
      )}
    </figure>
  )
}

export default function Stats() {
  const [s, setS] = useState(null)
  useEffect(() => { api.get('/admin/stats').then(setS).catch(() => setS({})) }, [])
  if (!s || (!s.members && !s.donations)) return null
  const m = s.members
  const d = s.donations

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-extrabold">📊 Numbers at a glance</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {m && <Tile emoji="👥" tint="bg-blue-100" value={m.approved.toLocaleString('en-IN')} label="Approved members" />}
        {m && <Tile emoji="🆕" tint="bg-amber-100" value={m.thisMonth.toLocaleString('en-IN')} label="Applications this month" />}
        {d && <Tile emoji="💰" tint="bg-green-100" value={rupees(d.total)} label={`Donations received (${d.count})`} />}
        {d && <Tile emoji="📅" tint="bg-rose-100" value={rupees(d.thisMonth)} label="Donations this month" />}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {m && <MonthBars title="📈 Membership applications per month" data={m.perMonth} />}
        {m && <StateBars data={m.byState} />}
        {d && <MonthBars title="💰 Donations per month" data={d.perMonth} format={rupees} />}
      </div>
    </section>
  )
}
