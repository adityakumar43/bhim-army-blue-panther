import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import { stateName, stateByCode } from '../data/states.js'
import BoxIcon from '../components/BoxIcon.jsx'
import Loading from '../components/Loading.jsx'
import { msg, say, fromError } from '../lib/msg.js'

const SAVED = 'pollMember' // member number and mobile, remembered on this phone if the person wants

function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED) || 'null') || { memberNo: '', phone: '' } } catch { return { memberNo: '', phone: '' } }
}

// Bars showing how many chose each answer
function Results({ poll, results, mine, lang, t }) {
    const max = Math.max(1, ...results.counts)
    return (
        <div className="mt-4 flex flex-col gap-2.5">
            {poll.options.map((o, i) => {
                const n = results.counts[i] || 0
                const pct = results.total ? Math.round((n / results.total) * 100) : 0
                return (
                    <div key={i}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                            <span className={`font-semibold ${i === mine ? 'text-brand' : 'text-navy/85'}`}>{pickText(o, 'text', lang)}{i === mine && ` ✓ (${t('poll.yourAnswer', { defaultValue: 'your answer' })})`}</span>
                            <span className="shrink-0 font-bold">{pct}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-navy/10">
                            <div className={`h-full rounded-full ${n === max && n > 0 ? 'bg-brand' : 'bg-brand/45'}`} style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )
            })}
            <p className="text-xs text-navy/65">{t('poll.total', { count: results.total, defaultValue: '{{count}} members answered' })}</p>
        </div>
    )
}

function PollCard({ poll, me, lang, t }) {
    const [choice, setChoice] = useState(null)
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(null) // { name, option, results }
    const [error, setError] = useState('')

    const area = poll.district
        ? `${poll.district}, ${stateName(stateByCode(poll.stateCode) || { en: poll.stateCode, hi: poll.stateCode }, lang)}`
        : poll.stateCode ? stateName(stateByCode(poll.stateCode) || { en: poll.stateCode, hi: poll.stateCode }, lang) : t('poll.allIndia', { defaultValue: 'All India' })

    async function vote() {
        setError('')
        if (choice === null) return setError(msg('poll.err.noOption', { defaultValue: 'Choose an answer first.' }))
        if (!me.memberNo.trim() || me.phone.replace(/\D/g, '').length < 10) return setError(msg('poll.err.missing', { defaultValue: 'Fill in your member number and mobile number above.' }))
        setBusy(true)
        try {
            const r = await api.post(`/polls/${poll._id}/vote`, { option: choice, memberNo: me.memberNo, phone: me.phone })
            me.save()
            setDone(r)
        } catch (e) {
            const code = e.data?.code
            if (code === 'already') setDone({ already: true, option: e.data.option, results: e.data.results })
            else setError(code ? msg(`poll.err.${code}`, { defaultValue: e.message }) : fromError(e))
        } finally { setBusy(false) }
    }

    return (
        <article className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-mist px-2.5 py-1 text-brand">📍 {area}</span>
                {poll.open
                    ? poll.closesAt && <span className="rounded-full bg-gold/20 px-2.5 py-1 text-navy">⏳ {t('poll.closes', { date: formatDate(poll.closesAt, lang), defaultValue: 'Open till {{date}}' })}</span>
                    : <span className="rounded-full bg-navy/10 px-2.5 py-1 text-navy/70">{t('poll.closed', { defaultValue: 'Closed' })}</span>}
            </div>
            <h2 className="text-xl leading-snug font-extrabold sm:text-2xl">{pickText(poll, 'question', lang)}</h2>

            {/* Closed: only the results */}
            {!poll.open && poll.results && <Results poll={poll} results={poll.results} lang={lang} t={t} />}

            {/* Answered: thank you, and the results if the team shows them */}
            {poll.open && done && (
                <div className="mt-4">
                    <p role="status" className={`rounded-xl px-4 py-3 font-semibold ${done.already ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800'}`}>
                        {done.already ? `ℹ️ ${t('poll.err.already', { defaultValue: 'You have already answered this poll.' })}` : `✅ ${t('poll.thanks', { name: done.name, defaultValue: 'Thank you, {{name}}! Your answer is saved.' })}`}
                    </p>
                    {done.results
                        ? <Results poll={poll} results={done.results} mine={done.option} lang={lang} t={t} />
                        : <p className="mt-3 text-sm text-navy/65">{t('poll.resultsLater', { defaultValue: 'The results will be shared by the team.' })}</p>}
                </div>
            )}

            {/* Open: choose an answer */}
            {poll.open && !done && (
                <>
                    <div role="radiogroup" aria-label={pickText(poll, 'question', lang)} className="mt-4 grid gap-2">
                        {poll.options.map((o, i) => (
                            <button key={i} type="button" role="radio" aria-checked={choice === i} onClick={() => setChoice(i)}
                                className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-2 text-left font-semibold transition ${choice === i ? 'border-brand bg-brand/5 text-brand' : 'border-navy/10 hover:border-brand/40 hover:bg-mist/50'}`}>
                                <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${choice === i ? 'border-brand' : 'border-navy/30'}`}>
                                    {choice === i && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
                                </span>
                                {pickText(o, 'text', lang)}
                            </button>
                        ))}
                    </div>
                    {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">⚠️ {say(t, error)}</p>}
                    <button type="button" onClick={vote} disabled={busy} className="btn mt-4 w-full bg-brand text-white hover:brightness-110 sm:w-auto">
                        {busy ? t('poll.sending', { defaultValue: 'Sending…' }) : t('poll.submit', { defaultValue: 'Submit my answer' })}
                    </button>
                </>
            )}
        </article>
    )
}

// Polls: members answer questions from the team
export default function Polls() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [polls, setPolls] = useState(null)
    const [failed, setFailed] = useState(false)
    const [details, setDetails] = useState(loadSaved)
    const [remember, setRemember] = useState(true)

    useEffect(() => { api.get('/polls').then(setPolls).catch(() => { setPolls([]); setFailed(true) }) }, [])

    const me = {
        ...details,
        save: () => {
            try {
                if (remember) localStorage.setItem(SAVED, JSON.stringify({ memberNo: details.memberNo.trim(), phone: details.phone.trim() }))
                else localStorage.removeItem(SAVED)
            } catch { /* storage blocked */ }
        },
    }
    const open = (polls || []).filter((p) => p.open)
    const past = (polls || []).filter((p) => !p.open && p.results)

    return (
        <div className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
            {polls === null && <Loading />}
            {failed && <p role="alert" className="mb-4 text-red-700">⚠️ {t('poll.failed', { defaultValue: 'Could not load the polls. Please try again.' })}</p>}

            {open.length > 0 && (
                <section className="mb-6 rounded-2xl border border-gold/60 bg-gold/10 p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
                        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand"><BoxIcon name="idCard" size={19} /></span>
                        {t('poll.yourDetails', { defaultValue: 'Your membership' })}
                    </h2>
                    <p className="mb-3 text-sm text-navy/70">{t('poll.detailsHint', { defaultValue: 'Only members can answer. Enter your member number and the mobile number you joined with.' })}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm font-semibold">{t('poll.memberNo', { defaultValue: 'Member number' })}
                            <input value={details.memberNo} onChange={(e) => setDetails({ ...details, memberNo: e.target.value })} placeholder="BBP-00012" autoComplete="off" className="input uppercase" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm font-semibold">{t('poll.mobile', { defaultValue: 'Mobile number' })}
                            <input value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} inputMode="numeric" placeholder="98765 43210" autoComplete="tel" className="input" />
                        </label>
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand" />
                        {t('poll.remember', { defaultValue: 'Remember on this phone' })}
                    </label>
                    <p className="mt-2 text-xs text-navy/65">
                        {t('poll.notMember', { defaultValue: 'Not a member yet?' })} <Link to="/join" className="font-semibold text-brand underline">{t('poll.join', { defaultValue: 'Join now' })}</Link>
                        {' · '}<Link to="/membership/status" className="font-semibold text-brand underline">{t('poll.forgot', { defaultValue: 'Forgot your member number?' })}</Link>
                    </p>
                </section>
            )}

            {polls && open.length === 0 && !failed && (
                <div className="mb-8 rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-10 text-center text-navy/65">
                    <p className="text-3xl" aria-hidden="true">🗳️</p>
                    <p className="mt-2">{t('poll.none', { defaultValue: 'There are no polls right now. Please check again later.' })}</p>
                </div>
            )}

            <div className="flex flex-col gap-5">
                {open.map((p) => <PollCard key={p._id} poll={p} me={me} lang={lang} t={t} />)}
            </div>

            {past.length > 0 && (
                <>
                    <h2 className="mt-10 mb-4 text-xl font-extrabold">{t('poll.recent', { defaultValue: 'Results of recent polls' })}</h2>
                    <div className="flex flex-col gap-5">
                        {past.map((p) => <PollCard key={p._id} poll={p} me={me} lang={lang} t={t} />)}
                    </div>
                </>
            )}
        </div>
    )
}
