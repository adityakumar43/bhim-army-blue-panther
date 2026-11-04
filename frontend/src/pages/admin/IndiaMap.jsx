import { useState } from 'react'

// A tile map of India: every state and union territory is one square, placed roughly where it is on the map.
// Small places (Delhi, Goa, Chandigarh) are as easy to see and tap as big ones, and no borders are drawn.
// [column, row, short name]
const TILES = {
    'chandigarh': [1, 0, 'CH'], 'jammu-kashmir': [2, 0, 'JK'], 'ladakh': [3, 0, 'LA'],
    'punjab': [1, 1, 'PB'], 'himachal-pradesh': [2, 1, 'HP'], 'uttarakhand': [3, 1, 'UK'], 'arunachal-pradesh': [8, 1, 'AR'],
    'rajasthan': [1, 2, 'RJ'], 'haryana': [2, 2, 'HR'], 'delhi': [3, 2, 'DL'], 'uttar-pradesh': [4, 2, 'UP'], 'bihar': [5, 2, 'BR'], 'sikkim': [6, 2, 'SK'], 'assam': [7, 2, 'AS'], 'nagaland': [8, 2, 'NL'],
    'gujarat': [1, 3, 'GJ'], 'madhya-pradesh': [2, 3, 'MP'], 'chhattisgarh': [3, 3, 'CG'], 'jharkhand': [4, 3, 'JH'], 'west-bengal': [5, 3, 'WB'], 'meghalaya': [7, 3, 'ML'], 'manipur': [8, 3, 'MN'],
    'dadra-nagar-haveli-daman-diu': [1, 4, 'DH'], 'maharashtra': [2, 4, 'MH'], 'telangana': [3, 4, 'TG'], 'odisha': [4, 4, 'OD'], 'tripura': [7, 4, 'TR'], 'mizoram': [8, 4, 'MZ'],
    'goa': [1, 5, 'GA'], 'karnataka': [2, 5, 'KA'], 'andhra-pradesh': [3, 5, 'AP'], 'andaman-nicobar': [6, 5, 'AN'],
    'lakshadweep': [1, 6, 'LD'], 'kerala': [2, 6, 'KL'], 'tamil-nadu': [3, 6, 'TN'], 'puducherry': [4, 6, 'PY'],
}

// One blue, light to dark, for more members. Grey = nobody yet. Dark text on the light steps, white on the dark ones.
const STEPS = [
    { bg: '#dfe8fc', ink: '#0a1a3f' },
    { bg: '#93b0ec', ink: '#0a1a3f' },
    { bg: '#4672d0', ink: '#ffffff' },
    { bg: '#0b3c9d', ink: '#ffffff' },
]
const NONE = { bg: '#eef1f6', ink: '#5f6a80' }
const n = (v) => Number(v || 0).toLocaleString('en-IN')

// Upper limit of each step. Member numbers are very uneven between states, so the steps grow
// like a square (1/16, 4/16, 9/16 of the biggest state) to keep smaller states from all looking the same.
function limits(max) {
    const out = []
    for (let k = 1; k <= STEPS.length; k++) out.push(Math.max(k, Math.ceil(max * (k / STEPS.length) ** 2)))
    return out.map((v, i) => Math.max(v, (out[i - 1] || 0) + 1))
}

export default function IndiaMap({ rows, onPick }) {
    const byCode = Object.fromEntries(rows.filter((r) => r.code).map((r) => [r.code, r]))
    const max = Math.max(0, ...Object.values(byCode).map((r) => r.value))
    const top = limits(max)
    const stepOf = (v) => (v > 0 ? top.findIndex((t) => v <= t) : -1)
    const [focus, setFocus] = useState(null)
    const covered = Object.values(byCode).filter((r) => r.value > 0).length
    const info = focus && (byCode[focus.code] || { label: focus.name, value: 0, recent: 0 })

    return (
        <figure className="rounded-2xl border border-brand/10 bg-white p-4 shadow-sm sm:p-5">
            <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-extrabold">🗺️ Members across India</span>
                <span className="text-xs text-navy/55">{covered} of {Object.keys(TILES).length} states and UTs have members</span>
            </figcaption>
            <p className="mb-3 text-xs text-navy/60">Each square is a state or union territory, placed roughly where it is. Darker = more members. Tap one to see its districts.</p>

            <div className="mx-auto grid max-w-md grid-cols-9 gap-1" onMouseLeave={() => setFocus(null)}>
                {Object.entries(TILES).map(([code, [col, row, short]]) => {
                    const r = byCode[code]
                    const v = r?.value || 0
                    const c = v > 0 ? STEPS[stepOf(v)] : NONE
                    const name = r?.label || code.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => onPick(code)}
                            onMouseEnter={() => setFocus({ code, name })}
                            onFocus={() => setFocus({ code, name })}
                            aria-label={`${name}: ${n(v)} members. See its districts.`}
                            className="flex aspect-square flex-col items-center justify-center rounded-[4px] leading-none outline-offset-2 transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-gold"
                            style={{ gridColumn: col + 1, gridRow: row + 1, background: c.bg, color: c.ink }}
                        >
                            <span className="text-[11px] font-extrabold sm:text-xs">{short}</span>
                            {v > 0 && <span className="mt-0.5 text-[9px] font-semibold opacity-90 sm:text-[10px]">{v > 999 ? `${Math.round(v / 100) / 10}k` : v}</span>}
                        </button>
                    )
                })}
            </div>

            {/* What the pointer or keyboard is on */}
            <p className="mt-3 min-h-10 rounded-xl bg-mist/70 px-3 py-2 text-center text-sm" aria-live="polite">
                {info
                    ? <><b>{info.label}</b>: {n(info.value)} {info.value === 1 ? 'member' : 'members'}{info.recent ? <span className="text-green-700"> · +{n(info.recent)} in 30 days</span> : ''}</>
                    : <span className="text-navy/55">Point at a square to see its numbers</span>}
            </p>

            {/* Key */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-navy/70">
                <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-[3px]" style={{ background: NONE.bg, boxShadow: 'inset 0 0 0 1px #d5dbe6' }} />None yet</span>
                {max > 0 && STEPS.map((s, i) => {
                    const from = i === 0 ? 1 : top[i - 1] + 1
                    if (from > max) return null
                    const to = Math.min(top[i], max)
                    return <span key={i} className="flex items-center gap-1"><i className="h-3 w-3 rounded-[3px]" style={{ background: s.bg }} />{from === to ? n(from) : `${n(from)}–${n(to)}`}</span>
                })}
            </div>
        </figure>
    )
}
