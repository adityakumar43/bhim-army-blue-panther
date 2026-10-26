import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { Pill } from './ui.jsx'

// Overview card: members with a birthday today and this week.
// Emails go out by themselves each morning; members without email can be wished on WhatsApp from here.

const wishText = (name) =>
    `जय भीम ${name} जी! 🎂\nभीम आर्मी ब्लू पैंथर परिवार की ओर से आपको जन्मदिन की हार्दिक शुभकामनाएँ। आप स्वस्थ रहें और यूँ ही आगे बढ़ते रहें।\n\nHappy Birthday! 💙`
const waLink = (phone, name) => `https://wa.me/91${phone}?text=${encodeURIComponent(wishText(name))}`

const when = (d) => (d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`)
const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short', timeZone: 'UTC' })

export default function Birthdays() {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        api.get('/birthdays').then(setData).catch((e) => setError(e.message))
    }, [])

    if (error) return null
    if (!data) return null

    const today = data.list.filter((m) => m.daysAway === 0)
    const soon = data.list.filter((m) => m.daysAway > 0)
    const shownSoon = showAll ? soon : soon.slice(0, 4)

    return (
        <section className="card mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-extrabold">
                    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-xl">🎂</span>
                    Birthdays
                </h2>
                <span className="text-xs text-navy/60">
                    {data.emailOn ? '✉️ Wishes are emailed automatically every morning' : '⚠️ Birthday emails are off (email is not set up)'}
                </span>
            </div>

            {today.length === 0 && soon.length === 0 && <p className="text-sm text-navy/60">No member birthdays this week.</p>}

            {today.length > 0 && (
                <ul className="mb-3 divide-y divide-brand/10 rounded-xl border border-gold/50 bg-gold/10">
                    {today.map((m) => (
                        <li key={m._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                            <span className="min-w-0 flex-1">
                                <span className="font-bold">🎉 {m.name}</span>
                                <span className="ml-2 text-sm text-navy/60">turns {m.turning}{m.district ? ` · ${m.district}` : ''}{m.memberNo ? ` · ${m.memberNo}` : ''}</span>
                            </span>
                            {m.emailed ? <Pill tone="green">✉️ Emailed</Pill> : m.email ? <Pill tone="gold">Email later today</Pill> : <Pill tone="gray">No email</Pill>}
                            <a href={waLink(m.phone, m.name)} target="_blank" rel="noopener noreferrer" className="abtn-primary">
                                💬 Wish on WhatsApp
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            {soon.length > 0 && (
                <>
                    <h3 className="mb-1.5 text-sm font-bold text-navy/70">Coming up this week</h3>
                    <ul className="divide-y divide-brand/10">
                        {shownSoon.map((m) => (
                            <li key={m._id} className="flex items-center gap-3 py-2 text-sm">
                                <span className="w-28 shrink-0 font-semibold text-brand">{when(m.daysAway)}</span>
                                <span className="min-w-0 flex-1 truncate"><strong>{m.name}</strong> <span className="text-navy/60">· {dayLabel(m.date)} · turns {m.turning}</span></span>
                            </li>
                        ))}
                    </ul>
                    {soon.length > 4 && (
                        <button onClick={() => setShowAll((v) => !v)} className="mt-1 text-sm font-semibold text-brand hover:underline">
                            {showAll ? 'Show less' : `Show all ${soon.length}`}
                        </button>
                    )}
                </>
            )}
        </section>
    )
}
