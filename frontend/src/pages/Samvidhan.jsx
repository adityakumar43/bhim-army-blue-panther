import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { makeCertificate } from '../lib/pledgeCertificate.js'
import { STATES, stateName } from '../data/states.js'
import { PREAMBLE, SPEECH, QUIZ } from '../data/samvidhan.js'
import DistrictSelect from '../components/DistrictSelect.jsx'
import { ListenButton } from '../components/ShareListen.jsx'

const PAGE = 'https://bhimarmybluepanther.org/samvidhan'
const num = (n, lang) => Number(n || 0).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')
const section = 'rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-8'

// ---------- The Preamble ----------
function Preamble() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'en' ? 'en' : 'hi'
    // For the Listen button: the title and the whole text, in both languages
    const item = { titleEn: 'The Preamble', titleHi: 'उद्देशिका', bodyEn: PREAMBLE.en.join(' '), bodyHi: PREAMBLE.hi.join(' ') }
    return (
        <section id="preamble" className={`${section} scroll-mt-28 border-t-4 border-t-gold`}>
            <h2 className="text-2xl font-extrabold sm:text-3xl">📜 {t('samvidhan.preambleTitle')}</h2>
            <p className="mt-1 text-navy/70">{t('samvidhan.preambleIntro')}</p>
            <ListenButton item={item} kind="samvidhan" small className="mt-4" />
            <blockquote className="mt-6 rounded-xl bg-[#fffaf0] px-5 py-6 text-center text-lg leading-relaxed text-navy sm:px-10 sm:text-xl">
                {PREAMBLE[lang].map((line, i) => <p key={i} className={i === 0 || i === PREAMBLE[lang].length - 1 ? 'my-2' : 'my-1 font-semibold'}>{line}</p>)}
            </blockquote>
        </section>
    )
}

// ---------- The certificate window (like "Share as a poster") ----------
function CertificateWindow({ cert, name, onClose }) {
    const { t } = useTranslation()
    const fileName = `samvidhan-pledge-${cert.certNo}.png`
    const [note, setNote] = useState('')
    const canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })

    useEffect(() => {
        const key = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', key)
        return () => document.removeEventListener('keydown', key)
    }, [onClose])

    function download() {
        const a = document.createElement('a')
        a.href = cert.url
        a.download = fileName
        a.click()
    }
    async function share() {
        const file = new File([cert.blob], fileName, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
            try { await navigator.share({ files: [file], text: t('samvidhan.shareText', { link: PAGE }) }) } catch { /* closed the share menu */ }
        } else {
            download()
            setNote(t('poster.saved', { defaultValue: 'Saved. Open WhatsApp, tap the 📎 (attach) button and choose this picture.' }))
        }
        trackEvent('share', { method: 'whatsapp', content_type: 'pledge_certificate' })
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t('samvidhan.certReady')}>
            <button type="button" aria-label={t('poster.close', { defaultValue: 'Close' })} onClick={onClose} className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
            <div className="relative flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-4xl sm:rounded-3xl sm:p-6">
                <img src={cert.url} alt={`${t('samvidhan.cert.title')}: ${name}`} className="w-full rounded-xl shadow-md" />
                <p className="text-lg font-extrabold">{t('samvidhan.certReady')}</p>
                <p className="-mt-3 text-sm text-navy/65">{t('samvidhan.certHint')}</p>
                {note && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{note}</p>}
                <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={share} className="btn gap-2 bg-[#25D366] text-white hover:brightness-95">
                        {canShareFiles ? t('poster.share', { defaultValue: 'Share' }) : t('poster.forWhatsapp', { defaultValue: 'Save for WhatsApp' })}
                    </button>
                    <button type="button" onClick={download} className="btn border-2 border-brand text-brand">{t('poster.download', { defaultValue: 'Download' })}</button>
                    <button type="button" onClick={onClose} className="btn text-navy/70 underline">{t('poster.close', { defaultValue: 'Close' })}</button>
                </div>
            </div>
        </div>,
        document.body,
    )
}

// ---------- The pledge form ----------
function Pledge({ onPledged }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [form, setForm] = useState({ name: '', stateCode: '', district: '', website: '' })
    const [agree, setAgree] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(null) // what the server sent back
    const [cert, setCert] = useState(null) // { blob, url } of the picture
    const [open, setOpen] = useState(false)
    const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])

    useEffect(() => () => { if (cert) URL.revokeObjectURL(cert.url) }, [cert])

    // The picture is drawn in the page language, again if the language changes
    useEffect(() => {
        if (!done) return
        let gone = false
        makeCertificate({ pledge: done, lang, t }).then((blob) => {
            if (gone) return
            setCert({ blob, url: URL.createObjectURL(blob) })
        }).catch(() => setError(t('poster.failed', { defaultValue: 'Could not make the picture. Please try again.' })))
        return () => { gone = true }
    }, [done, lang])

    async function submit(e) {
        e.preventDefault()
        setError('')
        if (form.name.trim().length < 2) return setError(t('samvidhan.needName'))
        if (!form.stateCode) return setError(t('samvidhan.needState'))
        if (!agree) return setError(t('samvidhan.needAgree'))
        setBusy(true)
        try {
            const r = await api.post('/pledge', form)
            if (!r.certNo) return // the hidden bot field was filled
            setDone(r)
            setOpen(true)
            onPledged(r.total)
            trackEvent('pledge_taken', { state: form.stateCode })
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    function another() {
        setDone(null); setCert(null); setOpen(false); setAgree(false)
        setForm({ name: '', stateCode: form.stateCode, district: '', website: '' }) // same state is likely
    }

    return (
        <section id="pledge" className={`${section} scroll-mt-28 border-t-4 border-t-brand`}>
            <h2 className="text-2xl font-extrabold sm:text-3xl">✋ {t('samvidhan.pledgeTitle')}</h2>
            <p className="mt-1 text-navy/70">{t('samvidhan.pledgeIntro')}</p>

            {done ? (
                <div className="mt-6 rounded-2xl bg-green-50 p-5 text-center">
                    <p className="text-3xl" aria-hidden="true">🎉</p>
                    <p role="status" className="mt-2 text-lg font-extrabold text-green-900">{t('samvidhan.done', { name: done.name })}</p>
                    <p className="mt-1 font-mono text-sm text-green-900/70">{done.certNo}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button type="button" onClick={() => setOpen(true)} disabled={!cert} className="btn gap-2 bg-brand text-white hover:bg-navy disabled:opacity-60">
                            {cert ? `🏅 ${t('samvidhan.viewCert')}` : t('samvidhan.making')}
                        </button>
                        <button type="button" onClick={another} className="btn border-2 border-brand text-brand">{t('samvidhan.another')}</button>
                    </div>
                    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                </div>
            ) : (
                <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                    <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('samvidhan.name')}
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength="60" autoComplete="name"
                            placeholder={t('samvidhan.namePh')} className="input" />
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">{t('samvidhan.state')}
                        <select value={form.stateCode} onChange={(e) => setForm({ ...form, stateCode: e.target.value, district: '' })} className="input">
                            <option value="">{t('samvidhan.choose')}</option>
                            {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 font-semibold">{t('samvidhan.district')}
                        <DistrictSelect stateCode={form.stateCode} value={form.district} onChange={(d) => setForm((f) => ({ ...f, district: d }))} />
                    </label>
                    {/* Hidden from people; bots fill it in */}
                    <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                        tabIndex="-1" autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                    <label className="flex items-start gap-3 rounded-xl bg-mist/60 p-4 sm:col-span-2">
                        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-brand" />
                        <span className="font-semibold">{t('samvidhan.agree')}</span>
                    </label>
                    {error && <p role="alert" className="text-red-700 sm:col-span-2">{error}</p>}
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={busy} className="btn w-full bg-brand text-white hover:bg-navy disabled:opacity-60 sm:w-auto">
                            ✋ {busy ? t('samvidhan.busy') : t('samvidhan.submit')}
                        </button>
                        <p className="mt-3 text-xs text-navy/55">{t('samvidhan.privacy')}</p>
                    </div>
                </form>
            )}
            {open && cert && done && <CertificateWindow cert={cert} name={done.name} onClose={() => setOpen(false)} />}
        </section>
    )
}

// ---------- 25 November 1949 ----------
function Speech() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'en' ? 'en' : 'hi'
    const pick = (q, f) => (lang === 'hi' ? q[`${f}Hi`] : q[`${f}En`])
    return (
        <section id="speech" className={`${section} scroll-mt-28`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <img src="/inspirations/ambedkar-round.jpg" alt="" className="h-24 w-24 shrink-0 rounded-full object-cover object-top shadow-md ring-4 ring-gold/40" />
                <div>
                    <h2 className="text-2xl font-extrabold sm:text-3xl">{t('samvidhan.speechTitle')}</h2>
                    <p className="mt-1 text-navy/70">{t('samvidhan.speechIntro')}</p>
                </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {SPEECH.map((q, i) => (
                    <figure key={i} className="flex flex-col rounded-xl border-l-4 border-gold bg-[#fffaf0] p-5">
                        <figcaption className="text-sm font-extrabold tracking-wide text-brand uppercase">{pick(q, 'title')}</figcaption>
                        {q.contextEn && <p className="mt-2 text-sm text-navy/60 italic">{pick(q, 'context')}</p>}
                        <blockquote className="mt-2 flex-1 text-lg leading-relaxed text-navy">“{pick(q, 'body')}”</blockquote>
                        <ListenButton item={q} kind="samvidhan" small className="mt-4 self-start" />
                    </figure>
                ))}
            </div>
            {t('samvidhan.translated') && <p className="mt-4 text-xs text-navy/55">{t('samvidhan.translated')}</p>}
        </section>
    )
}

// ---------- The quiz ----------
function Quiz() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'en' ? 'en' : 'hi'
    const [step, setStep] = useState(-1) // -1 = not started; QUIZ.length = finished
    const [picked, setPicked] = useState(null)
    const [score, setScore] = useState(0)
    const total = QUIZ.length
    const q = QUIZ[step]

    function choose(i) {
        if (picked !== null) return
        setPicked(i)
        if (i === q.answer) setScore((s) => s + 1)
    }
    function next() {
        setPicked(null)
        setStep((s) => s + 1)
        if (step + 1 === total) trackEvent('quiz_done', { score: score, total })
    }
    function restart() { setScore(0); setPicked(null); setStep(0) }

    const shareText = t('samvidhan.scoreText', { score, total, link: PAGE })
    const verdict = score >= 8 ? t('samvidhan.great') : score >= 5 ? t('samvidhan.good') : t('samvidhan.tryMore')

    return (
        <section id="quiz" className={`${section} scroll-mt-28 border-t-4 border-t-gold`}>
            <h2 className="text-2xl font-extrabold sm:text-3xl">🧠 {t('samvidhan.quizTitle')}</h2>
            <p className="mt-1 text-navy/70">{t('samvidhan.quizIntro')}</p>

            {step === -1 && <button type="button" onClick={() => setStep(0)} className="btn mt-5 bg-brand text-white hover:bg-navy">{t('samvidhan.start')} →</button>}

            {q && (
                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-navy/60">
                        <span>{t('samvidhan.qOf', { n: step + 1, total })}</span>
                        <span aria-hidden="true">⭐ {score}</span>
                    </div>
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
                        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(step / total) * 100}%` }} />
                    </div>
                    <p className="text-xl font-extrabold">{lang === 'hi' ? q.qHi : q.qEn}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {q.options.map((o, i) => {
                            const isRight = picked !== null && i === q.answer
                            const isWrong = picked === i && i !== q.answer
                            return (
                                <button key={i} type="button" onClick={() => choose(i)} disabled={picked !== null}
                                    className={`min-h-12 rounded-xl border-2 px-4 py-3 text-left font-semibold transition
                                        ${isRight ? 'border-green-600 bg-green-50 text-green-900' : isWrong ? 'border-red-500 bg-red-50 text-red-900' : 'border-navy/10 bg-white hover:border-brand'}
                                        ${picked !== null && !isRight && !isWrong ? 'opacity-60' : ''}`}>
                                    {isRight ? '✅ ' : isWrong ? '❌ ' : ''}{o[lang === 'hi' ? 1 : 0]}
                                </button>
                            )
                        })}
                    </div>
                    {picked !== null && (
                        <div aria-live="polite" className={`mt-4 rounded-xl p-4 ${picked === q.answer ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
                            <b>{picked === q.answer ? t('samvidhan.right') : t('samvidhan.wrong')}</b> {lang === 'hi' ? q.whyHi : q.whyEn}
                        </div>
                    )}
                    {picked !== null && (
                        <button type="button" onClick={next} className="btn mt-4 bg-brand text-white hover:bg-navy">
                            {step + 1 === total ? t('samvidhan.finish') : t('samvidhan.next')} →
                        </button>
                    )}
                </div>
            )}

            {step === total && (
                <div className="mt-6 rounded-2xl bg-mist/60 p-6 text-center">
                    <p className="text-5xl font-extrabold text-brand">{score}<span className="text-2xl text-navy/50">/{total}</span></p>
                    <p role="status" className="mt-2 text-lg font-extrabold">{t('samvidhan.score', { score, total })}</p>
                    <p className="mt-1 text-navy/70">{verdict}</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                            onClick={() => trackEvent('share', { method: 'whatsapp', content_type: 'quiz_score' })}
                            className="btn gap-2 bg-[#25d366] text-white hover:bg-[#1da851]">{t('samvidhan.shareScore')}</a>
                        <button type="button" onClick={restart} className="btn border-2 border-brand text-brand">🔄 {t('samvidhan.again')}</button>
                    </div>
                </div>
            )}
        </section>
    )
}

// Samvidhan Divas page, /samvidhan: the Preamble, the pledge with a certificate, the 25 November 1949 speech and a quiz
export default function Samvidhan() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [count, setCount] = useState(null)

    useEffect(() => { api.get('/pledge/count').then(setCount).catch(() => {}) }, [])

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:py-12">
            {/* How many have pledged, and quick links to each part */}
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-navy px-5 py-5 text-center text-white sm:flex-row sm:justify-between sm:text-left">
                <p className="text-lg font-extrabold">
                    ✋ {count?.total
                        ? <>{t('samvidhan.count', { count: count.total, n: num(count.total, lang) })}{count.states > 1 && <span className="font-semibold text-white/75"> · {t('samvidhan.states', { count: count.states })}</span>}</>
                        : t('samvidhan.first')}
                </p>
                <nav className="flex flex-wrap justify-center gap-2 text-sm font-bold">
                    <a href="#preamble" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">📜 {t('samvidhan.preambleTitle')}</a>
                    <a href="#pledge" className="rounded-full bg-gold px-3 py-2 text-navy hover:brightness-95">✋ {t('samvidhan.pledgeTitle')}</a>
                    <a href="#quiz" className="rounded-full bg-white/10 px-3 py-2 hover:bg-white/20">🧠 {t('samvidhan.quizTitle')}</a>
                </nav>
            </div>

            <Preamble />
            <Pledge onPledged={(total) => setCount((c) => ({ ...(c || { states: 1 }), total }))} />
            <Speech />
            <Quiz />

            <div className="rounded-2xl bg-linear-to-br from-navy via-[#0d2a6b] to-brand p-8 text-center text-white">
                <p className="text-2xl font-extrabold text-gold">{t('samvidhan.cta')}</p>
                <p className="mt-2 text-white/80">{t('samvidhan.cert.slogan')}</p>
                <Link to="/join" className="btn mt-5 bg-gold text-navy hover:brightness-95">{t('nav.join', { defaultValue: 'Join Us' })}</Link>
            </div>
        </div>
    )
}
