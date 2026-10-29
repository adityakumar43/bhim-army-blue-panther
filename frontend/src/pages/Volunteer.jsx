import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { STATES, stateName } from '../data/states.js'
import { SKILLS, AVAILABILITY } from '../data/volunteers.js'
import Consent from '../components/Consent.jsx'
import DistrictSelect from '../components/DistrictSelect.jsx'

const EMPTY = { name: '', phone: '', email: '', stateCode: '', district: '', availability: 'anytime', message: '', skills: [], website: '' }
const PHONE_OK = /^[6-9]\d{9}$/
const AVAIL_EMOJI = { anytime: '🙌', weekends: '📅', evenings: '🌆', events: '🎉' }
const cleanPhone = (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10)

// The red star on fields that must be filled
const Req = () => <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>

// One numbered part of the form
function Part({ n, title, done, children }) {
    return (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold">
                <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition ${done ? 'bg-green-600 text-white' : 'bg-mist text-brand'}`}>
                    {done ? '✓' : n}
                </span>
                <span>{title}</span>
            </h2>
            {children}
        </section>
    )
}

// Public: offer to volunteer and say how you can help
export default function Volunteer() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'hi' ? 'hi' : 'en'
    const [form, setForm] = useState(EMPTY)
    const [done, setDone] = useState(null) // { updated } once sent
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [agree, setAgree] = useState(false) // the "I agree" tick box

    const set = (f, clean = (v) => v) => (e) => { setError(''); setForm((old) => ({ ...old, [f]: clean(e.target.value) })) }
    const toggle = (key) => { setError(''); setForm((old) => ({ ...old, skills: old.skills.includes(key) ? old.skills.filter((k) => k !== key) : [...old.skills, key] })) }
    const states = useMemo(() => [...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang)), [lang])

    const phoneOk = PHONE_OK.test(form.phone)
    const done1 = form.skills.length > 0
    const done2 = !!form.availability
    const done3 = !!form.name.trim() && phoneOk && !!form.stateCode

    async function submit(e) {
        e.preventDefault()
        setError('')
        if (!form.skills.length) return setError(t('vol.pickSkill'))
        if (!form.name.trim()) return setError(t('help.needName', { defaultValue: 'Please enter your name.' }))
        if (!phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
        if (!agree) return setError(t('privacy.needAgree', { defaultValue: 'Please tick the box to agree before sending.' }))
        if (!form.stateCode) return setError(t('help.pickState', { defaultValue: 'Please choose your state.' }))
        setBusy(true)
        try {
            const r = await api.post('/volunteers', { ...form, consent: true })
            setDone({ updated: !!r?.updated })
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    // Thank you, what happens next, and a way to bring friends along
    if (done) {
        const invite = `${t('vol.inviteText', { defaultValue: 'Volunteer with Bhim Army Blue Panther and help our community. Join here:' })} ${window.location.origin}/volunteer`
        const next = [
            ['📞', t('vol.next1', { defaultValue: 'Our team in your area will call you.' })],
            ['🤝', t('vol.next2', { defaultValue: 'We will tell you about work and events near you that match how you can help.' })],
            ['✊', t('vol.next3', { defaultValue: 'You choose when you can take part.' })],
        ]
        return (
            <div className="mx-auto max-w-xl px-5 py-12">
                <section role="status" className="rounded-2xl border border-green-300 bg-green-50 p-6 text-center shadow-sm sm:p-8">
                    <p className="text-5xl" aria-hidden="true">🙏</p>
                    <h2 className="mt-3 text-2xl font-extrabold text-green-900 sm:text-3xl">{t('vol.thanks')}</h2>
                    <p className="mt-2 text-navy/80">{done.updated ? t('vol.updated', { defaultValue: 'You had already signed up with this number. We have updated your details.' }) : t('vol.thanksBody')}</p>
                </section>
                <section className="mt-5 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="mb-3 font-extrabold">{t('vol.nextTitle', { defaultValue: 'What happens next' })}</h3>
                    <ol className="flex flex-col gap-3">
                        {next.map(([icon, text], i) => (
                            <li key={i} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-lg" aria-hidden="true">{icon}</span><span className="pt-1.5 text-navy/85">{text}</span></li>
                        ))}
                    </ol>
                </section>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" className="btn gap-2 bg-[#25d366] text-white hover:bg-[#1da851]">
                        💬 {t('vol.invite', { defaultValue: 'Invite friends on WhatsApp' })}
                    </a>
                    <Link to="/join" className="btn gap-2 border-2 border-brand bg-white text-brand hover:bg-mist">🪪 {t('vol.becomeMember', { defaultValue: 'Also become a member' })}</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                <p className="-mb-1 text-sm text-navy/60"><Req /> {t('help.requiredNote', { defaultValue: 'Required fields' })}</p>

                <Part n="1" title={<>{t('vol.skillsTitle', { defaultValue: 'How can you help?' })}<Req /></>} done={done1}>
                    <p className="-mt-2 mb-3 text-sm text-navy/60">{t('vol.skillsHint', { defaultValue: 'Choose one or more.' })}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {SKILLS.map((s) => {
                            const on = form.skills.includes(s.key)
                            return (
                                <button key={s.key} type="button" onClick={() => toggle(s.key)} aria-pressed={on}
                                    className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${on ? 'border-brand bg-brand/5 text-brand shadow-sm' : 'border-navy/10 bg-white text-navy/80 hover:border-brand/40 hover:bg-mist/50'}`}>
                                    <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                                    <span className="flex-1">{s[lang]}</span>
                                    <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs ${on ? 'border-brand bg-brand text-white' : 'border-navy/20 bg-white'}`}>{on ? '✓' : ''}</span>
                                </button>
                            )
                        })}
                    </div>
                    {form.skills.length > 0 && <p className="mt-2 text-sm font-semibold text-green-700">✓ {t('vol.chosen', { count: form.skills.length, defaultValue: '{{count}} chosen' })}</p>}
                </Part>

                <Part n="2" title={t('vol.availability')} done={done2}>
                    <div role="radiogroup" aria-label={t('vol.availability')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {AVAILABILITY.map((a) => {
                            const on = form.availability === a.key
                            return (
                                <button key={a.key} type="button" role="radio" aria-checked={on} onClick={() => setForm((o) => ({ ...o, availability: a.key }))}
                                    className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-center text-sm font-semibold transition ${on ? 'border-brand bg-brand text-white shadow-md shadow-brand/20' : 'border-navy/10 bg-white text-navy/80 hover:border-brand/40 hover:bg-mist/50'}`}>
                                    <span className="text-2xl" aria-hidden="true">{AVAIL_EMOJI[a.key] || '🕒'}</span>
                                    {a[lang]}
                                </button>
                            )
                        })}
                    </div>
                </Part>

                <Part n="3" title={t('vol.aboutTitle', { defaultValue: 'About you' })} done={done3}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 font-semibold"><span>{t('vol.name')}<Req /></span>
                            <span className="relative block">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">👤</span>
                                <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input pl-10" />
                            </span>
                        </label>
                        <label className="flex flex-col gap-1.5 font-semibold"><span>{t('vol.phone')}<Req /></span>
                            <span className="relative block">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                                <input required type="tel" inputMode="numeric" maxLength="15" placeholder="12345 67890" autoComplete="tel-national" value={form.phone}
                                    onChange={set('phone', cleanPhone)} className="input pr-9 pl-14 tracking-wide" />
                                {phoneOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
                            </span>
                        </label>
                        <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">{t('vol.email')}
                            <span className="relative block">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">📧</span>
                                <input type="email" autoComplete="email" placeholder="name@gmail.com" value={form.email} onChange={set('email', (v) => v.trim())} className="input pl-10" />
                            </span>
                        </label>
                        <label className="flex flex-col gap-1.5 font-semibold"><span>📍 {t('vol.state')}<Req /></span>
                            <select required value={form.stateCode} onChange={set('stateCode')} className="input">
                                <option value="">{t('help.choose', { defaultValue: '— Choose —' })}</option>
                                {states.map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 font-semibold">🏘️ {t('vol.district')}
                            <DistrictSelect stateCode={form.stateCode} value={form.district} onChange={(v) => setForm((old) => ({ ...old, district: v }))} />
                        </label>
                        <label className="flex flex-col gap-1.5 font-semibold sm:col-span-2">💬 {t('vol.message')}
                            <textarea rows="3" maxLength="500" value={form.message} onChange={set('message')}
                                placeholder={t('vol.messageHint', { defaultValue: 'For example your work, your experience, or a time that suits you.' })} className="input resize-y" />
                            <span className="text-right text-xs font-normal text-navy/50">{form.message.length} / 500</span>
                        </label>
                    </div>
                </Part>

                {/* Hidden trap for bots */}
                <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" />

                <Consent checked={agree} onChange={(v) => { setAgree(v); setError('') }} error={!!error && !agree}
                    text={t('privacy.agreeVol', { defaultValue: 'I agree that my details are used by the team to contact me about volunteer work, as explained in the Privacy Policy.' })} />

                {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}
                <button disabled={busy} className="btn w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">{busy ? t('vol.sending') : `🙋 ${t('vol.submit')}`}</button>
                <p className="-mt-2 text-center text-xs text-navy/60">🔒 {t('vol.privacy', { defaultValue: 'Your details are only used by our team to contact you.' })}</p>
            </form>
        </div>
    )
}
