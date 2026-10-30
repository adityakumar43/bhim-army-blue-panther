import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { shrinkImage } from '../lib/shrinkImage.js'
import { STATES, stateName } from '../data/states.js'
import DistrictSelect from '../components/DistrictSelect.jsx'
import Icon from '../components/Icon.jsx'

const PHONE_OK = /^[6-9]\d{9}$/
const EMAIL_OK = /^\S+@\S+\.\S+$/
const pad = (n) => String(n).padStart(2, '0')
const onlyPhone = (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)

// A step of the page: a white box with an emoji and a title
function Box({ icon, title, children }) {
    return (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-5 flex items-center gap-3 text-lg font-extrabold">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name={icon} size={20} /></span>
                {title}
            </h2>
            {children}
        </section>
    )
}

const Problem = ({ children }) => children
    ? <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{children}</p>
    : null

// "Update my details": mobile number and date of birth, then a code from their email, then the changes
export default function UpdateDetails() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const from = useLocation().state || {} // came from the status page: number and date already known
    const [step, setStep] = useState('find') // find, code, edit, done
    const [who, setWho] = useState(() => {
        const [year = '', month = '', day = ''] = String(from.dob || '').split('-')
        return { phone: from.phone || '', day: day ? String(Number(day)) : '', month: month ? String(Number(month)) : '', year }
    })
    const [sentTo, setSentTo] = useState('')
    const [code, setCode] = useState('')
    const [pass, setPass] = useState('')
    const [form, setForm] = useState({})
    const [photo, setPhoto] = useState(null)
    const [preview, setPreview] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const dob = who.day && who.month && who.year ? `${who.year}-${pad(who.month)}-${pad(who.day)}` : ''
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) =>
        new Date(Date.UTC(2000, i, 1)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', timeZone: 'UTC' })), [lang])
    const thisYear = new Date().getFullYear()
    const years = Array.from({ length: thisYear - 1920 }, (_, i) => thisYear - 1 - i)
    const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])
    const setWhoField = (f, clean = (v) => v) => (e) => setWho((old) => ({ ...old, [f]: clean(e.target.value) }))
    const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))

    useEffect(() => {
        if (!photo) return setPreview('')
        const url = URL.createObjectURL(photo)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [photo])

    async function run(job) {
        setError('')
        setBusy(true)
        try { await job() } catch (err) { setError(err.message) } finally { setBusy(false) }
    }

    // Step 1: send the code
    const sendCode = (e) => {
        e?.preventDefault()
        if (!PHONE_OK.test(who.phone)) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
        if (!dob) return setError(t('join.badDate', { defaultValue: 'Please choose your date of birth' }))
        run(async () => {
            const r = await api.post('/member-update/start', { phone: who.phone, dob })
            setSentTo(r.email)
            setCode('')
            setStep('code')
        })
    }

    // Step 2: check the code
    const checkCode = (e) => {
        e.preventDefault()
        run(async () => {
            const r = await api.post('/member-update/verify', { phone: who.phone, code })
            setPass(r.pass)
            setForm(r.details)
            setStep('edit')
        })
    }

    // Step 3: save
    const save = (e) => {
        e.preventDefault()
        if (!PHONE_OK.test(form.phone)) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
        if (!EMAIL_OK.test(form.email || '')) return setError(t('join.emailHint', { defaultValue: 'Please check the email address' }))
        run(async () => {
            const data = new FormData()
            data.append('pass', pass)
            for (const k of ['phone', 'email', 'stateCode', 'district', 'city', 'assemblyNo', 'lokSabhaNo']) data.append(k, form[k] ?? '')
            if (photo) data.append('photo', await shrinkImage(photo), 'photo.jpg')
            setResult(await api.put('/member-update', data))
            setStep('done')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }

    const select = 'input px-2'
    const phoneBox = (value, onChange, id) => (
        <span className="relative block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
            <input id={id} type="tel" inputMode="numeric" required autoComplete="tel-national" maxLength="15" placeholder="98765 43210" value={value}
                onChange={onChange} className="input pl-14 tracking-wide" />
        </span>
    )

    return (
        <div className="mx-auto max-w-xl px-5 py-10 sm:py-12">
            <h1 className="mb-2 text-2xl font-extrabold text-brand sm:text-3xl">✏️ {t('upd.title', { defaultValue: 'Update my details' })}</h1>
            <p className="mb-6 text-navy/75">{t('upd.intro', { defaultValue: 'Change your mobile number, email, address or photo. We send a code to your email to make sure it is you.' })}</p>

            {step === 'find' && (
                <form onSubmit={sendCode}>
                    <Box icon="search" title={t('upd.findTitle', { defaultValue: 'Find your membership' })}>
                        <label className="flex flex-col gap-1.5 font-semibold">{t('status.phone')}
                            {phoneBox(who.phone, setWhoField('phone', onlyPhone))}
                        </label>
                        <div className="mt-4 flex flex-col gap-1.5 font-semibold" role="group" aria-labelledby="upd-dob">
                            <span id="upd-dob">{t('status.dob')}</span>
                            <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
                                <select required aria-label={t('join.day', { defaultValue: 'Day' })} value={who.day} onChange={setWhoField('day')} className={select}>
                                    <option value="">{t('join.day', { defaultValue: 'Day' })}</option>
                                    {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                                </select>
                                <select required aria-label={t('join.month', { defaultValue: 'Month' })} value={who.month} onChange={setWhoField('month')} className={select}>
                                    <option value="">{t('join.month', { defaultValue: 'Month' })}</option>
                                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                                <select required aria-label={t('join.year', { defaultValue: 'Year' })} value={who.year} onChange={setWhoField('year')} className={select}>
                                    <option value="">{t('join.year', { defaultValue: 'Year' })}</option>
                                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <Problem>{error}</Problem>
                        <button disabled={busy} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">
                            📧 {busy ? '…' : t('upd.sendCode', { defaultValue: 'Send me a code' })}
                        </button>
                        <p className="mt-4 text-center text-xs text-navy/55">🔒 {t('upd.codeNote', { defaultValue: 'The code goes to the email address on your membership.' })}</p>
                    </Box>
                </form>
            )}

            {step === 'code' && (
                <form onSubmit={checkCode}>
                    <Box icon="mail" title={t('upd.codeTitle', { defaultValue: 'Type the code from your email' })}>
                        <p className="text-navy/80">{t('upd.codeSent', { email: sentTo, defaultValue: 'We sent a 6-digit code to {{email}}. Check your inbox (and the spam folder).' })}</p>
                        <input inputMode="numeric" autoComplete="one-time-code" required maxLength="6" pattern="[0-9]{6}" value={code} autoFocus
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label={t('upd.codeTitle', { defaultValue: 'Type the code from your email' })}
                            placeholder="••••••" className="input mt-4 text-center text-2xl font-bold tracking-[0.5em]" />
                        <Problem>{error}</Problem>
                        <button disabled={busy || code.length !== 6} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">
                            ✅ {busy ? '…' : t('upd.checkCode', { defaultValue: 'Continue' })}
                        </button>
                        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
                            <button type="button" onClick={() => sendCode()} disabled={busy} className="font-semibold text-brand underline">{t('upd.resend', { defaultValue: 'Send a new code' })}</button>
                            <button type="button" onClick={() => { setStep('find'); setError('') }} className="font-semibold text-navy/60 underline">{t('upd.back', { defaultValue: 'Back' })}</button>
                        </div>
                    </Box>
                </form>
            )}

            {step === 'edit' && (
                <form onSubmit={save} className="flex flex-col gap-5">
                    <Box icon="user" title={form.name}>
                        {form.memberNo && <p className="-mt-3 mb-4 text-sm font-semibold text-navy/60">🪪 {form.memberNo}</p>}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5 font-semibold">{t('join.phone')}
                                {phoneBox(form.phone, set('phone', onlyPhone))}
                            </label>
                            <label className="flex flex-col gap-1.5 font-semibold">{t('upd.email', { defaultValue: 'Email' })}
                                <input type="email" required autoComplete="email" value={form.email} onChange={set('email', (v) => v.trim())} className="input" />
                            </label>
                            <label className="flex flex-col gap-1.5 font-semibold">{t('join.state')}
                                <select required value={form.stateCode} onChange={set('stateCode')} className="input">
                                    <option value="" disabled>—</option>
                                    {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5 font-semibold">{t('join.district')}
                                <DistrictSelect required stateCode={form.stateCode} value={form.district} onChange={(v) => setForm((old) => ({ ...old, district: v }))} />
                            </label>
                            <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">{t('join.city')}
                                <input maxLength="100" autoComplete="address-level3" value={form.city} onChange={set('city')} className="input" />
                            </label>
                            {[['assemblyNo', 'join.assemblyNo'], ['lokSabhaNo', 'join.lokSabhaNo']].map(([f, label]) => (
                                <label key={f} className="flex flex-col gap-1.5 font-semibold">{t(label)}
                                    <input inputMode="numeric" pattern="[0-9]{1,3}" maxLength="3" value={form[f]} onChange={set(f, (v) => v.replace(/\D/g, ''))} className="input" />
                                </label>
                            ))}
                        </div>
                        <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-xs text-navy/70">ℹ️ {t('upd.nameNote', { defaultValue: 'To change your name or date of birth, please contact us.' })}</p>
                    </Box>

                    <Box icon="camera" title={t('join.photo')}>
                        <div className="flex flex-wrap items-center gap-4">
                            {(preview || form.photo) && <img src={preview || form.photo} alt="" className="h-28 w-24 rounded-xl border border-navy/10 object-cover" />}
                            <label className="btn min-h-11 cursor-pointer gap-2 border-2 border-brand bg-white px-4 text-sm text-brand focus-within:ring-4 focus-within:ring-brand/20">
                                🖼️ {t('upd.newPhoto', { defaultValue: 'Choose a new photo' })}
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(f); e.target.value = '' }} />
                            </label>
                            {photo && <button type="button" onClick={() => setPhoto(null)} className="text-sm font-semibold text-navy/60 underline">{t('upd.keepPhoto', { defaultValue: 'Keep my old photo' })}</button>}
                        </div>
                    </Box>

                    <Problem>{error}</Problem>
                    <button disabled={busy} className="btn w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">
                        💾 {busy ? t('upd.saving', { defaultValue: 'Saving…' }) : t('upd.save', { defaultValue: 'Save my details' })}
                    </button>
                </form>
            )}

            {step === 'done' && (
                <section aria-live="polite" className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true"><Icon name="check" size={32} /></div>
                    <h2 className="mb-2 text-2xl font-extrabold text-brand">{t('upd.doneTitle', { defaultValue: 'Your details are updated' })}</h2>
                    <p className="text-navy/80">{result?.changed?.length
                        ? t('upd.doneBody', { defaultValue: 'Thank you. Our team has been told about the change.' })
                        : t('upd.noChange', { defaultValue: 'Nothing was changed.' })}</p>
                    {result?.cardToken && (
                        <Link to={`/card/${result.cardToken}`} className="btn mt-6 w-full gap-2 bg-brand text-white hover:bg-navy">🪪 {t('status.openCard')}</Link>
                    )}
                    <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand underline">{t('nav.home', { defaultValue: 'Home' })}</Link>
                </section>
            )}
        </div>
    )
}
