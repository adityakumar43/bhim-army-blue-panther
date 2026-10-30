import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading } from './ui.jsx'
import { Tile } from './Stats.jsx'

const n = (v) => Number(v || 0).toLocaleString('en-IN')
const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']]

// Friendly names for pages and for where people came from
const PAGE_NAMES = {
    '/': 'Home', '/about': 'About', '/news': 'News', '/events': 'Events Calendar', '/gallery': 'Gallery', '/videos': 'Videos',
    '/join': 'Join', '/donate': 'Donate', '/help': 'Help desk', '/volunteer': 'Volunteer', '/contact': 'Contact',
    '/campaigns': 'Campaigns', '/downloads': 'Downloads', '/inspirations': 'Inspirations', '/leadership/states': 'States',
    '/membership/status': 'Membership status', '/privacy': 'Privacy Policy',
}
const SOURCES = {
    direct: '🔗 Direct / saved link', google: '🔍 Google', search: '🔍 Other search', facebook: '📘 Facebook', instagram: '📸 Instagram',
    whatsapp: '💬 WhatsApp', youtube: '▶️ YouTube', x: '✖️ X (Twitter)', app: '📱 Installed app',
}
const DEVICES = { phone: '📱 Phone', computer: '💻 Computer', app: '📲 Installed app' }
const LANGS = { hi: 'हिंदी', en: 'English' }
const pageName = (p) => p.title ? `${p.key.startsWith('/events') ? '📅' : '📰'} ${p.title}` : PAGE_NAMES[p.key] || p.key

// A list of bars, biggest first, with the share of the total
function Bars({ title, rows, label = (r) => r.key, note }) {
    const total = rows.reduce((s, r) => s + r.value, 0)
    const max = Math.max(1, ...rows.map((r) => r.value))
    return (
        <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
            <figcaption className="mb-3 font-extrabold">{title}</figcaption>
            {rows.length === 0 && <p className="text-sm text-navy/60">Nothing yet.</p>}
            <ul className="flex flex-col gap-2">
                {rows.map((r) => (
                    <li key={r.key} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-2 text-sm" title={`${label(r)}: ${r.value}`}>
                        <span className="truncate text-navy/80">{label(r)}</span>
                        <span className="h-3 rounded-r-[4px] bg-brand/80" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
                        <span className="w-20 text-right"><b className="text-navy">{n(r.value)}</b> <span className="text-xs text-navy/45">{total ? Math.round((r.value / total) * 100) : 0}%</span></span>
                    </li>
                ))}
            </ul>
            {note && <p className="mt-3 text-xs text-navy/50">{note}</p>}
        </figure>
    )
}

// One bar per day; hover or tap a bar to see that day
function DayBars({ data }) {
    const [active, setActive] = useState(null)
    const max = Math.max(1, ...data.map((d) => d.visitors))
    const shown = data[active ?? data.length - 1]
    const label = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    return (
        <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
            <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-extrabold">👥 Visitors per day</span>
                <span className="text-sm text-navy/60">{label(shown.day)}: <b className="text-navy">{n(shown.visitors)}</b> visitors · {n(shown.views)} pages</span>
            </figcaption>
            <div className="relative mt-4 h-40" onMouseLeave={() => setActive(null)}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-navy/10" />
                <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-navy/10" />
                <span aria-hidden="true" className="absolute -top-2 right-0 bg-white pl-1 text-[10px] text-navy/45">{n(max)}</span>
                <div className="absolute inset-0 flex items-end gap-px border-b border-navy/20 sm:gap-0.5">
                    {data.map((d, i) => (
                        <button key={d.day} type="button" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                            aria-label={`${label(d.day)}: ${d.visitors} visitors`} className="group flex h-full flex-1 items-end focus:outline-none">
                            <span className={`block w-full rounded-t-[3px] ${i === (active ?? data.length - 1) ? 'bg-brand' : 'bg-brand/45 group-hover:bg-brand/70'}`}
                                style={{ height: d.visitors ? `${Math.max(3, (d.visitors / max) * 100)}%` : '2px', opacity: d.visitors ? 1 : 0.35 }} />
                        </button>
                    ))}
                </div>
            </div>
            <div aria-hidden="true" className="mt-1.5 flex justify-between text-[10px] text-navy/50">
                <span>{label(data[0].day)}</span><span>{label(data.at(-1).day)}</span>
            </div>
        </figure>
    )
}

// Visitor numbers: counted by our own website, no cookies, nothing personal
export default function Visitors() {
    const [days, setDays] = useState(30)
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        setData(null); setError('')
        api.get(`/visits?days=${days}`).then(setData).catch((e) => setError(e.message))
    }, [days])

    const perVisitor = data?.visitors ? (data.views / data.visitors).toFixed(1) : '0'
    const appShare = data?.visitors ? Math.round(((data.devices.find((d) => d.key === 'app')?.value || 0) / data.visitors) * 100) : 0

    return (
        <>
            <PageHeader title="Visitors" subtitle="How many people visit the website, what they read and how they found it. Counted without cookies; nothing personal is kept." />
            <Notice>{error}</Notice>

            <div role="group" aria-label="Time period" className="mb-5 inline-flex flex-wrap gap-1 rounded-2xl border border-brand/10 bg-white p-1 shadow-sm">
                {RANGES.map(([d, label]) => (
                    <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
                        className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${days === d ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/70 hover:bg-mist'}`}>{label}</button>
                ))}
            </div>

            {!data && !error && <ListLoading />}
            {data && (
                <>
                    <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
                        <Tile icon="users" tint="bg-blue-100 text-blue-700" value={n(data.visitors)} label={`Visitors (${RANGES.find(([d]) => d === days)[1].toLowerCase()})`} />
                        <Tile icon="news" tint="bg-amber-100 text-amber-700" value={n(data.views)} label={`Pages opened (${perVisitor} per visitor)`} />
                        <Tile icon="sun" tint="bg-green-100 text-green-700" value={n(data.today.visitors)} label={`Visitors today (${n(data.today.views)} pages)`} />
                        <Tile icon="phone" tint="bg-purple-100 text-purple-700" value={`${appShare}%`} label="Came through the installed app" />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <DayBars data={data.perDay} />
                        <Bars title="📄 Most read pages" rows={data.pages} label={pageName} note="How many times each page was opened." />
                        <Bars title="🧭 How people found the website" rows={data.sources} label={(r) => SOURCES[r.key] || `🌐 ${r.key}`}
                            note="“Direct” means they typed the address, used a saved link, or came from WhatsApp (WhatsApp does not say where a visitor came from)." />
                        <div className="grid gap-4">
                            <Bars title="📱 Phone or computer" rows={data.devices} label={(r) => DEVICES[r.key] || r.key} />
                            <Bars title="🗣️ Language they read in" rows={data.langs} label={(r) => LANGS[r.key] || r.key} />
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-navy/50">
                        ℹ️ A visitor is counted once a day, so the same person visiting on 3 days counts as 3. Your team (anyone logged in to the admin panel on that device) is not counted. Search engine robots are left out.
                    </p>
                </>
            )}
        </>
    )
}
