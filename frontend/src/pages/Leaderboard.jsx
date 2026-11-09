import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { STATES, stateName, stateByCode } from '../data/states.js'
import { districtsOf, districtName } from '../data/districts.js'
import DistrictSelect from '../components/DistrictSelect.jsx'
import Loading from '../components/Loading.jsx'
import EmptyState from '../components/EmptyState.jsx'
import useLoad from '../lib/useLoad.js'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Invite leaderboard, at /leaderboard: members whose invite link brought in the most approved members,
// for all of India, one state or one district, all time or the last 30 days.
export default function Leaderboard() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [state, setState] = useState('')
    const [district, setDistrict] = useState('')
    const [period, setPeriod] = useState('all')
    const q = new URLSearchParams()
    if (state) q.set('state', state)
    if (state && district) q.set('district', district)
    if (period === '30') q.set('period', '30')
    const query = q.toString()
    const { data, error } = useLoad(() => api.get(`/growth/leaderboard?${query}`), query)
    const failed = !!error

    const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])
    // The place under each name, in the page language
    const place = (r) => {
        const s = r.stateCode && stateByCode(r.stateCode)
        const d = r.stateCode && districtsOf(r.stateCode).find((x) => x[0] === r.district)
        return [d ? districtName(d, lang) : r.district, !state && s ? stateName(s, lang) : ''].filter(Boolean).join(', ')
    }
    const tab = (on) => `min-h-10 rounded-lg px-4 text-sm font-semibold ${on ? 'bg-brand text-white' : 'text-brand hover:bg-mist'}`

    return (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
            {/* Filters */}
            <div className="mb-6 grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-semibold">{t('board.state')}
                    <select value={state} onChange={(e) => { setState(e.target.value); setDistrict('') }} className="input">
                        <option value="">{t('board.allIndia')}</option>
                        {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold">{t('board.district')}
                    {state
                        ? <DistrictSelect stateCode={state} value={district} onChange={setDistrict} />
                        : <select disabled className="input disabled:opacity-60"><option>{t('board.allDistricts')}</option></select>}
                </label>
                <div role="group" aria-label={t('board.title')} className="flex gap-1 rounded-xl bg-mist/60 p-1 sm:col-span-2">
                    <button type="button" onClick={() => setPeriod('all')} aria-pressed={period === 'all'} className={`flex-1 ${tab(period === 'all')}`}>{t('board.allTime')}</button>
                    <button type="button" onClick={() => setPeriod('30')} aria-pressed={period === '30'} className={`flex-1 ${tab(period === '30')}`}>{t('board.month')}</button>
                </div>
            </div>

            {!data && !failed && <Loading />}
            {failed && <p role="alert" className="text-center text-red-700">{t('board.failed')}</p>}
            {data && data.top.length === 0 && <EmptyState icon="users" text={t('board.empty')} hint={false} />}

            {data && data.top.length > 0 && (
                <>
                    <p className="mb-3 text-center text-sm font-semibold text-navy/70" aria-live="polite">
                        {t('board.summary', { joined: data.joined.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN'), inviters: data.inviters.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN') })}
                    </p>
                    <ol className="flex flex-col gap-2">
                        {data.top.map((r, i) => (
                            <li key={i} className={`flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm sm:gap-4 sm:p-4 ${r.rank <= 3 ? 'border-gold/60' : 'border-navy/10'}`}>
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${r.rank <= 3 ? 'bg-gold/20' : 'bg-mist text-navy/70'}`}
                                    aria-label={`#${r.rank}`}>
                                    {MEDALS[r.rank] || r.rank}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <b className="block truncate text-lg">{r.name}</b>
                                    {place(r) && <span className="block truncate text-sm text-navy/65">📍 {place(r)}</span>}
                                </span>
                                <span className="shrink-0 text-right">
                                    <b className="block text-xl text-brand">{r.value.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</b>
                                    <span className="text-xs text-navy/65">{t('board.members', { count: r.value })}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </>
            )}

            {/* How to get on the board */}
            <section className="mt-8 rounded-2xl border border-brand/15 bg-mist/60 p-5">
                <h2 className="text-lg font-extrabold">🤝 {t('board.howTitle')}</h2>
                <p className="mt-1 text-navy/80">{t('board.how')}</p>
                <Link to="/membership/status" className="btn mt-4 bg-brand text-white hover:bg-navy">{t('board.howLink')} →</Link>
                <p className="mt-4 text-xs text-navy/65">{t('board.privacy')}</p>
            </section>
        </div>
    )
}
