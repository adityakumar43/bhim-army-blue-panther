import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { STATES, stateName } from '../data/states.js'
import { SKILLS, AVAILABILITY } from '../data/volunteers.js'

const EMPTY = { name: '', phone: '', email: '', stateCode: '', district: '', availability: 'anytime', message: '', skills: [] }

// Public: offer to volunteer and say how you can help
export default function Volunteer() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'hi' ? 'hi' : 'en'
    const [form, setForm] = useState(EMPTY)
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
    const toggle = (key) => setForm({ ...form, skills: form.skills.includes(key) ? form.skills.filter((k) => k !== key) : [...form.skills, key] })

    async function submit(e) {
        e.preventDefault()
        setError('')
        if (!form.skills.length) return setError(t('vol.pickSkill'))
        setBusy(true)
        try {
            await api.post('/volunteers', form)
            setDone(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    if (done) {
        return (
            <div className="mx-auto max-w-xl px-5 py-16 text-center">
                <p className="text-5xl" aria-hidden="true">🙏</p>
                <h2 className="mt-3 text-3xl font-extrabold text-brand">{t('vol.thanks')}</h2>
                <p className="mt-3 text-lg">{t('vol.thanksBody')}</p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl px-5 py-12">
            <form onSubmit={submit} className="panel grid gap-4 sm:grid-cols-2 sm:p-8">
                <label className="flex flex-col gap-1 font-semibold">{t('vol.name')}
                    <input required maxLength="100" autoComplete="name" value={form.name} onChange={set('name')} className="input" />
                </label>
                <label className="flex flex-col gap-1 font-semibold">{t('vol.phone')}
                    <input required type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={set('phone')} className="input" />
                </label>
                <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('vol.email')}
                    <input type="email" autoComplete="email" value={form.email} onChange={set('email')} className="input" />
                </label>
                <label className="flex flex-col gap-1 font-semibold">{t('vol.state')}
                    <select required value={form.stateCode} onChange={set('stateCode')} className="input">
                        <option value="" disabled>—</option>
                        {[...STATES].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang))
                            .map((s) => <option key={s.code} value={s.code}>{stateName(s, lang)}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 font-semibold">{t('vol.district')}
                    <input maxLength="100" value={form.district} onChange={set('district')} className="input" />
                </label>

                <fieldset className="sm:col-span-2">
                    <legend className="mb-2 font-semibold">{t('vol.skills')}</legend>
                    <div className="flex flex-wrap gap-2">
                        {SKILLS.map((s) => {
                            const on = form.skills.includes(s.key)
                            return (
                                <button key={s.key} type="button" onClick={() => toggle(s.key)} aria-pressed={on}
                                    className={`min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition ${on ? 'border-brand bg-brand text-white' : 'border-navy/15 bg-white text-navy/80 hover:border-brand'}`}>
                                    {on ? '✓ ' : ''}{s.emoji} {s[lang]}
                                </button>
                            )
                        })}
                    </div>
                </fieldset>

                <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('vol.availability')}
                    <select value={form.availability} onChange={set('availability')} className="input">
                        {AVAILABILITY.map((a) => <option key={a.key} value={a.key}>{a[lang]}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 font-semibold sm:col-span-2">{t('vol.message')}
                    <textarea rows="3" maxLength="500" value={form.message} onChange={set('message')} className="input" />
                </label>
                {/* Hidden trap for bots */}
                <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" onChange={set('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                {error && <p role="alert" className="text-red-700 sm:col-span-2">{error}</p>}
                <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60 sm:col-span-2">{busy ? t('vol.sending') : `🙋 ${t('vol.submit')}`}</button>
            </form>
        </div>
    )
}
