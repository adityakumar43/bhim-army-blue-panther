import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { STATES } from '../../data/states.js'
import { PageHeader, Notice, ListLoading } from './ui.jsx'
import { Tile, MonthBars } from './Stats.jsx'

const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))
const n = (v) => Number(v || 0).toLocaleString('en-IN')

// Places ranked by members, with how many joined in the last 30 days
function Places({ title, rows, onPick, empty }) {
    const [all, setAll] = useState(false)
    const shown = all ? rows : rows.slice(0, 12)
    const max = Math.max(1, ...rows.map((r) => r.value))
    return (
        <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
            <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-extrabold">{title}</span>
                <span className="text-xs text-navy/55">members · <span className="text-green-700">new in 30 days</span></span>
            </figcaption>
            {rows.length === 0 && <p className="text-sm text-navy/60">{empty}</p>}
            <ul className="flex flex-col gap-1">
                {shown.map((r) => {
                    const inner = (
                        <>
                            <span className="truncate text-left text-navy/85">{r.label}</span>
                            <span className="h-3 rounded-r-[4px] bg-brand/80" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
                            <b className="w-12 text-right text-navy">{n(r.value)}</b>
                            <span className={`w-12 text-right text-xs font-semibold ${r.recent ? 'text-green-700' : 'text-navy/30'}`}>{r.recent ? `+${n(r.recent)}` : '–'}</span>
                        </>
                    )
                    const grid = 'grid w-full grid-cols-[minmax(0,11rem)_1fr_auto_auto] items-center gap-2 rounded-lg px-1 py-1 text-sm'
                    return (
                        <li key={r.label}>
                            {onPick && r.code
                                ? <button onClick={() => onPick(r.code)} title={`See the districts of ${r.label}`} className={`${grid} hover:bg-mist`}>{inner}</button>
                                : <div className={grid}>{inner}</div>}
                        </li>
                    )
                })}
            </ul>
            {rows.length > 12 && (
                <button onClick={() => setAll(!all)} className="mt-3 text-sm font-semibold text-brand hover:underline">
                    {all ? 'Show fewer' : `Show all ${rows.length}`}
                </button>
            )}
        </figure>
    )
}

// Where the members are, how fast they are joining, and who brings in the most new members
export default function Growth() {
    const [state, setState] = useState('')
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [showEmpty, setShowEmpty] = useState(false)

    useEffect(() => {
        setData(null); setError(''); setShowEmpty(false)
        api.get(`/growth${state ? `?state=${state}` : ''}`).then(setData).catch((e) => setError(e.message))
    }, [state])

    const place = data?.state ? sortedStates.find((s) => s.code === data.state)?.en : 'India'
    const change = data ? data.thisMonth - data.lastMonth : 0
    const covered = data?.districtCount ? data.districtCount - data.emptyDistricts.length : 0

    return (
        <>
            <PageHeader title="Member Growth" subtitle="Where our members are, how fast we are growing, and who brings in new members." />
            <Notice>{error}</Notice>

            <div className="mb-5 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-semibold">📍 Showing
                    <select value={data?.locked ? data.state : state} onChange={(e) => setState(e.target.value)} disabled={data?.locked} className="input min-h-10 w-auto py-2">
                        {!data?.locked && <option value="">All of India</option>}
                        {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                    </select>
                </label>
                {state && !data?.locked && <button onClick={() => setState('')} className="text-sm font-semibold text-brand underline">← All of India</button>}
            </div>

            {!data && !error && <ListLoading />}
            {data && (
                <>
                    <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
                        <Tile emoji="👥" tint="bg-blue-100" value={n(data.approved)} label={`Members in ${place}`} />
                        <Tile emoji="🆕" tint="bg-green-100" value={n(data.thisMonth)}
                            label={`Joined this month (${change === 0 ? 'same as' : change > 0 ? `${n(change)} more than` : `${n(-change)} fewer than`} last month)`} />
                        <Tile emoji="⏳" tint="bg-amber-100" value={n(data.pending)} label="Applications waiting" />
                        {data.state && <Tile emoji="🏘️" tint="bg-teal-100" value={`${n(covered)} / ${n(data.districtCount)}`} label="Districts with members" />}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <MonthBars title="🆕 New members per month" data={data.perMonth} />
                        <MonthBars title="📈 Total members" data={data.total} />

                        {!data.state && (
                            <Places title="🗺️ Members by state (tap a state for its districts)" rows={data.byState} onPick={setState} empty="No approved members yet." />
                        )}
                        {data.state && (
                            <div className="flex flex-col gap-4">
                                <Places title={`🏘️ Members by district in ${place}`} rows={data.byDistrict} empty="No approved members in this state yet." />
                                {data.noDistrict > 0 && (
                                    <p className="rounded-xl bg-mist px-4 py-2.5 text-sm text-navy/75">ℹ️ {n(data.noDistrict)} older {data.noDistrict === 1 ? 'member has' : 'members have'} no district saved.</p>
                                )}
                            </div>
                        )}

                        {/* Who brings in the most new members */}
                        <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
                            <figcaption className="mb-1 font-extrabold">🤝 Top inviters</figcaption>
                            <p className="mb-3 text-xs text-navy/60">Members whose invite link brought in the most approved members{data.state ? ` in ${place}` : ''}.</p>
                            {data.inviters.length === 0 && <p className="text-sm text-navy/60">Nobody has joined with an invite link yet. Members find their link on the “Check membership status” page.</p>}
                            <ol className="flex flex-col divide-y divide-navy/5">
                                {data.inviters.map((r, i) => (
                                    <li key={r.memberNo || i} className="flex items-center gap-3 py-2 text-sm">
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${i < 3 ? 'bg-gold text-navy' : 'bg-mist text-navy/70'}`}>{i + 1}</span>
                                        <span className="min-w-0 flex-1">
                                            <b className="block truncate">{r.name}</b>
                                            <span className="block truncate text-xs text-navy/60">{[r.memberNo, r.place].filter(Boolean).join(' · ')}</span>
                                        </span>
                                        <b className="text-brand">{n(r.value)}</b>
                                    </li>
                                ))}
                            </ol>
                        </figure>

                        {/* Districts with nobody yet: where to grow next */}
                        {data.state && data.emptyDistricts.length > 0 && (
                            <figure className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm sm:p-5">
                                <figcaption className="mb-1 font-extrabold">🌱 No members yet in {n(data.emptyDistricts.length)} {data.emptyDistricts.length === 1 ? 'district' : 'districts'}</figcaption>
                                <p className="mb-3 text-xs text-navy/60">Where to grow next in {place}.</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(showEmpty ? data.emptyDistricts : data.emptyDistricts.slice(0, 30)).map((d) => (
                                        <span key={d} className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-navy/80">{d}</span>
                                    ))}
                                </div>
                                {data.emptyDistricts.length > 30 && (
                                    <button onClick={() => setShowEmpty(!showEmpty)} className="mt-3 text-sm font-semibold text-brand hover:underline">
                                        {showEmpty ? 'Show fewer' : `Show all ${data.emptyDistricts.length}`}
                                    </button>
                                )}
                            </figure>
                        )}
                    </div>
                </>
            )}
        </>
    )
}
