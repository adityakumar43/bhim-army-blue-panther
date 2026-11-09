import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { makeCertificate } from '../lib/pledgeCertificate.js'
import { makeScoreCard } from '../lib/scoreCard.js'
import { STATES, stateName } from '../data/states.js'
import { PREAMBLE, SPEECH, QUIZ_SIZE, pickQuiz, newQuizSeed, isQuizSeed, SEASON, isSamvidhanSeason } from '../data/samvidhan.js'
import DistrictSelect from '../components/DistrictSelect.jsx'
import { ListenButton } from '../components/ShareListen.jsx'
import { msg, say, fromError } from '../lib/msg.js'

// Shared links go through the backend's /share/samvidhan page: WhatsApp then shows the Samvidhan picture
// with a personal title ("Ravi scored 8/10…"), and the friend lands on this page with the same greeting.
const SHARE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '' // only the first name goes into links
function shareUrl({ by, score, seed, lang }) {
    const q = new URLSearchParams()
    if (by) q.set('by', firstName(by))
    if (score !== undefined && score !== null) q.set('score', String(score))
    if (seed) q.set('q', String(seed)) // the friend gets the same 10 questions
    q.set('lang', lang === 'en' ? 'en' : 'hi')
    return `${SHARE_BASE}/share/samvidhan?${q}`
}
const starText = (score, total) => { const n = Math.round((score / total) * 5); return '⭐'.repeat(n) + '☆'.repeat(5 - n) }
const canShareFiles = () => typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })

// Share a picture with a message (phones: the share menu, with WhatsApp in it).
// Where pictures cannot be shared (most computers), it is downloaded instead and false is returned.
async function sharePicture(blob, fileName, text) {
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text }) } catch { /* the person closed the share menu */ }
        return true
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    return false
}
// WhatsApp's Windows/Mac app garbles emojis that arrive through a link (they show as �), so on computers the
// message goes without them: ⭐ becomes ★ and the other emojis are left out. Phones keep every emoji.
const isPhone = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const plainText = (text) => text
    .replace(/⭐/g, '★')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // flag letters (🇮🇳)
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/ {2,}/g, ' ').trim()
const whatsappLink = (text) => `https://wa.me/?text=${encodeURIComponent(isPhone() ? text : plainText(text))}`
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
    const { t, i18n } = useTranslation()
    const fileName = `samvidhan-pledge-${cert.certNo}.png`
    const [note, setNote] = useState('')
    // The message that goes with the picture: who took the pledge, the four values, and a link that invites others
    const message = t('samvidhan.shareCert', { link: shareUrl({ by: name, lang: i18n.language }) })

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
        const shared = await sharePicture(cert.blob, fileName, message)
        if (!shared) setNote(msg('poster.saved', { defaultValue: 'Saved. Open WhatsApp, tap the 📎 (attach) button and choose this picture.' }))
        trackEvent('share', { method: 'whatsapp', content_type: 'pledge_certificate' })
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t('samvidhan.certReady')}>
            <button type="button" aria-label={t('poster.close', { defaultValue: 'Close' })} onClick={onClose} className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
            <div className="relative flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:max-w-4xl sm:rounded-3xl sm:p-6">
                <img src={cert.url} alt={`${t('samvidhan.cert.title')}: ${name}`} className="w-full rounded-xl shadow-md" />
                <p className="text-lg font-extrabold">{t('samvidhan.certReady')}</p>
                <p className="-mt-3 text-sm text-navy/65">{t('samvidhan.certHint')}</p>
                {note && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{say(t, note)}</p>}
                <div className="grid gap-2 sm:grid-cols-3">
                    {/* Phones: the picture with the message. Computers: it is saved, to attach in WhatsApp. */}
                    <button type="button" onClick={share} className="btn gap-2 bg-[#25D366] text-white hover:brightness-95">
                        📸 {canShareFiles() ? t('poster.share', { defaultValue: 'Share' }) : t('poster.forWhatsapp', { defaultValue: 'Save for WhatsApp' })}
                    </button>
                    {/* The invitation as a message (the link shows a Samvidhan picture and "<name> took the pledge" on WhatsApp) */}
                    <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('share', { method: 'whatsapp', content_type: 'pledge_link' })}
                        className="btn gap-2 border-2 border-[#25D366] text-[#128c4a] hover:bg-green-50">💬 {t('samvidhan.sendLink')}</a>
                    <button type="button" onClick={download} className="btn border-2 border-brand text-brand">⬇️ {t('poster.download', { defaultValue: 'Download' })}</button>
                </div>
                <button type="button" onClick={onClose} className="-mt-1 self-center py-1 text-sm font-semibold text-navy/65 underline">{t('poster.close', { defaultValue: 'Close' })}</button>
            </div>
        </div>,
        document.body,
    )
}

// "11-01" -> "1 November" / "1 नवंबर"
const dayMonth = (md, lang) => { const [m, d] = md.split('-').map(Number); return new Date(2000, m - 1, d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long' }) }

// ---------- The pledge form ----------
// status = the server's /pledge/count answer. The server decides whether the pledge is open;
// until its answer arrives, the page guesses from today's date.
function Pledge({ onPledged, status }) {
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
        }).catch(() => setError(msg('poster.failed', { defaultValue: 'Could not make the picture. Please try again.' })))
        return () => { gone = true }
    }, [done, lang, t])

    async function submit(e) {
        e.preventDefault()
        setError('')
        if (form.name.trim().length < 2) return setError(msg('samvidhan.needName'))
        if (!form.stateCode) return setError(msg('samvidhan.needState'))
        if (!agree) return setError(msg('samvidhan.needAgree'))
        setBusy(true)
        try {
            const r = await api.post('/pledge', form)
            if (!r.certNo) return // the hidden bot field was filled
            setDone(r)
            setOpen(true)
            onPledged(r)
            trackEvent('pledge_taken', { state: form.stateCode })
        } catch (err) {
            setError(err.data?.code === 'closed' ? msg('samvidhan.closedTitle', (lng) => ({ date: dayMonth(err.data.opensOn || SEASON.from, lng) })) : fromError(err))
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

            {!done && (status ? status.open === false : !isSamvidhanSeason()) ? (
                <div className="mt-6 rounded-2xl bg-mist/60 p-5 text-center sm:p-6">
                    <p className="text-4xl" aria-hidden="true">🗓️</p>
                    <p className="mt-2 text-lg font-extrabold">{t('samvidhan.closedTitle', { date: dayMonth(status?.opensOn || SEASON.from, lang) })}</p>
                    <p className="mx-auto mt-1 max-w-xl text-navy/70">{t('samvidhan.closedText')}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <a href="#preamble" className="btn border-2 border-brand text-brand hover:bg-brand hover:text-white">📜 {t('samvidhan.preambleTitle')}</a>
                        <a href="#quiz" className="btn bg-brand text-white hover:bg-navy">🧠 {t('samvidhan.quizTitle')}</a>
                    </div>
                </div>
            ) : done ? (
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
                    {error && <p role="alert" className="mt-3 text-sm text-red-700">{say(t, error)}</p>}
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
                    {error && <p role="alert" className="text-red-700 sm:col-span-2">{say(t, error)}</p>}
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={busy} className="btn w-full bg-brand text-white hover:bg-navy disabled:opacity-60 sm:w-auto">
                            ✋ {busy ? t('samvidhan.busy') : t('samvidhan.submit')}
                        </button>
                        <p className="mt-3 text-xs text-navy/65">{t('samvidhan.privacy')}</p>
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
                        {q.contextEn && <p className="mt-2 text-sm text-navy/65 italic">{pick(q, 'context')}</p>}
                        <blockquote className="mt-2 flex-1 text-lg leading-relaxed text-navy">“{pick(q, 'body')}”</blockquote>
                        <ListenButton item={q} kind="samvidhan" small className="mt-4 self-start" />
                    </figure>
                ))}
            </div>
            {t('samvidhan.translated') && <p className="mt-4 text-xs text-navy/65">{t('samvidhan.translated')}</p>}
        </section>
    )
}

// ---------- The quiz ----------
function Quiz({ myName = '' }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'en' ? 'en' : 'hi'
    const [params] = useSearchParams()
    // Which 10 questions: the seed from a challenge link (?q=1234), or a new random one
    const [seed, setSeed] = useState(() => (isQuizSeed(params.get('q')) ? Number(params.get('q')) : newQuizSeed()))
    const questions = useMemo(() => pickQuiz(seed), [seed])
    const [name, setName] = useState(myName) // optional, printed on the score card
    const [card, setCard] = useState(null) // { blob, url } of the score card picture
    const [note, setNote] = useState('')
    const [step, setStep] = useState(-1) // -1 = not started; total = finished
    const [picked, setPicked] = useState(null)
    const [score, setScore] = useState(0)
    const total = questions.length
    const q = questions[step]

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
    function restart() { setSeed(newQuizSeed()); setScore(0); setPicked(null); setStep(0) } // new questions each time

    // Their name from the pledge is offered here once it arrives (if they have not typed one already)
    const [seenName, setSeenName] = useState(myName)
    if (myName && myName !== seenName) {
        setSeenName(myName)
        if (!name) setName(myName)
    }

    // The score card is drawn when the quiz ends, and again if the name or language changes
    useEffect(() => {
        if (step !== total) return
        let gone = false
        const timer = setTimeout(() => {
            makeScoreCard({ score, total, name: firstName(name), t }).then((blob) => {
                if (gone) return
                setCard((old) => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) } })
            }).catch(() => {})
        }, 300) // wait until they stop typing their name
        return () => { gone = true; clearTimeout(timer) }
    }, [step, name, lang, score, total, t])

    // The challenge message: the score with stars, and a link that shows "<name> scored 8/10" on WhatsApp
    const shareText = t('samvidhan.scoreText', { score, total, stars: starText(score, total), link: shareUrl({ by: name, score, seed, lang }) })
    async function shareCard() {
        if (!card) return
        const shared = await sharePicture(card.blob, `samvidhan-quiz-${score}-of-${total}.png`, shareText)
        setNote(shared ? '' : msg('poster.saved', { defaultValue: 'Saved. Open WhatsApp, tap the 📎 (attach) button and choose this picture.' }))
        trackEvent('share', { method: 'whatsapp', content_type: 'quiz_card' })
    }
    const verdict = score >= 8 ? t('samvidhan.great') : score >= 5 ? t('samvidhan.good') : t('samvidhan.tryMore')

    return (
        <section id="quiz" className={`${section} scroll-mt-28 border-t-4 border-t-gold`}>
            <h2 className="text-2xl font-extrabold sm:text-3xl">🧠 {t('samvidhan.quizTitle')}</h2>
            <p className="mt-1 text-navy/70">{t('samvidhan.quizIntro')}</p>

            {step === -1 && <button type="button" onClick={() => setStep(0)} className="btn mt-5 bg-brand text-white hover:bg-navy">{t('samvidhan.start')} →</button>}

            {q && (
                <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-navy/65">
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
                <div className="mt-6 grid items-start gap-6 rounded-2xl bg-mist/60 p-5 sm:p-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
                    {/* The score card picture people share */}
                    <div className="mx-auto w-full max-w-xs lg:max-w-none">
                        {card
                            ? <img src={card.url} alt={t('samvidhan.score', { score, total })} className="w-full rounded-2xl shadow-lg" />
                            : <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-navy text-white/70">{t('samvidhan.makingCard')}</div>}
                    </div>
                    <div className="text-center lg:text-left">
                        <p className="text-5xl font-extrabold text-brand">{score}<span className="text-2xl text-navy/65">/{total}</span></p>
                        <p role="status" className="mt-2 text-lg font-extrabold">{t('samvidhan.score', { score, total })}</p>
                        <p className="mt-1 text-navy/70">{verdict}</p>
                        <label className="mt-5 flex flex-col gap-1 text-left text-sm font-semibold">{t('samvidhan.cardName')}
                            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} maxLength="40" autoComplete="given-name"
                                placeholder={t('samvidhan.namePh')} className="input bg-white" />
                        </label>
                        {note && <p role="status" className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-left text-sm text-green-800">{say(t, note)}</p>}
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button type="button" onClick={shareCard} disabled={!card} className="btn gap-2 bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-60">
                                📸 {t('samvidhan.shareCard')}
                            </button>
                            <a href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer"
                                onClick={() => trackEvent('share', { method: 'whatsapp', content_type: 'quiz_challenge' })}
                                className="btn gap-2 border-2 border-[#25D366] text-[#128c4a] hover:bg-green-50">💬 {t('samvidhan.challenge')}</a>
                        </div>
                        <button type="button" onClick={restart} className="mt-3 text-sm font-semibold text-brand underline">🔄 {t('samvidhan.again')}</button>
                    </div>
                </div>
            )}
        </section>
    )
}

// A friend opened a shared link (?by=Ravi or ?by=Ravi&score=8): greet them with who sent it and what to do
function Welcome() {
    const { t } = useTranslation()
    const [params] = useSearchParams()
    const by = firstName(String(params.get('by') || '').replace(/[^\p{L}\p{M} .'-]/gu, '')).slice(0, 40)
    const raw = params.get('score')
    const score = /^(10|[0-9])$/.test(raw || '') ? Number(raw) : null
    if (!by && score === null) return null
    const name = by || t('samvidhan.aFriend')
    const quiz = score !== null
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-gold bg-[#fffaf0] p-5 text-center shadow-sm sm:flex-row sm:text-left">
            <span className="text-5xl" aria-hidden="true">{quiz ? '🏆' : '🙏'}</span>
            <p className="flex-1 text-lg font-extrabold text-navy">
                {quiz ? t('samvidhan.welcomeQuiz', { name, score, total: QUIZ_SIZE }) : t('samvidhan.welcomePledge', { name })}
            </p>
            <a href={quiz ? '#quiz' : '#pledge'} className="btn shrink-0 bg-brand text-white hover:bg-navy">
                {quiz ? `🧠 ${t('samvidhan.acceptQuiz')}` : `✋ ${t('samvidhan.acceptPledge')}`}
            </a>
        </div>
    )
}

// Samvidhan Divas page, /samvidhan: the Preamble, the pledge with a certificate, the 25 November 1949 speech and a quiz
export default function Samvidhan() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [count, setCount] = useState(null)
    const [myName, setMyName] = useState('') // after the pledge, their name is offered for the quiz score card

    useEffect(() => { api.get('/pledge/count').then(setCount).catch(() => {}) }, [])

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:py-12">
            <Welcome />
            {/* How many have pledged, and quick links to each part */}
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-navy px-5 py-5 text-center text-white sm:flex-row sm:justify-between sm:text-left">
                <p className="text-lg font-extrabold">
                    {/* This season's pledges first, the all-time total beside it. Before this season's first pledge, just the total. */}
                    ✋ {count?.thisYear
                        ? <>{t('samvidhan.season', { count: count.thisYear, n: num(count.thisYear, lang) })}{(count.total > count.thisYear || count.states > 1) && <span className="font-semibold text-white/75"> · {count.total > count.thisYear ? t('samvidhan.since', { n: num(count.total, lang), year: count.since }) : t('samvidhan.states', { count: count.states })}</span>}</>
                        : count?.total
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
            <Pledge status={count} onPledged={(r) => { setCount((c) => ({ ...(c || { states: 1 }), total: r.total, thisYear: r.thisYear, since: c?.since || new Date(r.date).getFullYear() })); setMyName(r.name) }} />
            <Speech />
            <Quiz myName={myName} />

            <div className="rounded-2xl bg-linear-to-br from-navy via-[#0d2a6b] to-brand p-8 text-center text-white">
                <p className="text-2xl font-extrabold text-gold">{t('samvidhan.cta')}</p>
                <p className="mt-2 text-white/80">{t('samvidhan.cert.slogan')}</p>
                <Link to="/join" className="btn mt-5 bg-gold text-navy hover:brightness-95">{t('nav.join', { defaultValue: 'Join Us' })}</Link>
            </div>
        </div>
    )
}
