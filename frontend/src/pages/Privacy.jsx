import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PRIVACY, PRIVACY_UPDATED, GRIEVANCE } from '../data/privacy.js'

// The Privacy Policy, in the visitor's language (the text is in data/privacy.js)
export default function Privacy() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language === 'hi' ? 'hi' : 'en'
    const sections = PRIVACY[lang]
    const updated = new Date(`${PRIVACY_UPDATED}T00:00:00Z`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'long', timeZone: 'UTC' })

    return (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:py-12">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-sm font-semibold text-brand">
                📅 {t('privacy.updated', { defaultValue: 'Last updated' })}: {updated}
            </p>

            {/* Contents */}
            <nav aria-label={t('privacy.contents', { defaultValue: 'Contents' })} className="mb-8 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-extrabold">📑 {t('privacy.contents', { defaultValue: 'Contents' })}</h2>
                <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    {sections.map((s, i) => (
                        <li key={s.id}><a href={`#${s.id}`} className="text-brand hover:underline">{i + 1}. {s.title}</a></li>
                    ))}
                </ol>
            </nav>

            <div className="flex flex-col gap-5">
                {sections.map((s, i) => (
                    <section key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-7">
                        <h2 className="mb-3 flex items-center gap-3 text-xl font-extrabold">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm text-white">{i + 1}</span>
                            {s.title}
                        </h2>
                        {s.body?.map((p, k) => <p key={k} className="mb-3 leading-relaxed text-navy/85 last:mb-0">{p}</p>)}
                        {s.list && (
                            <ul className="flex flex-col gap-2.5">
                                {s.list.map(([head, text]) => (
                                    <li key={head} className="rounded-xl bg-mist/50 px-4 py-3 leading-relaxed">
                                        <b className="text-brand">{head}:</b> <span className="text-navy/85">{text}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {s.after?.map((p, k) => <p key={k} className="mt-3 font-semibold text-navy/90">{p}</p>)}
                        {s.grievance && (
                            <div className="mt-3 rounded-xl border-l-4 border-gold bg-gold/10 px-4 py-3">
                                {GRIEVANCE.email ? (
                                    <>
                                        {GRIEVANCE.name && <p className="font-bold">{GRIEVANCE.name}</p>}
                                        {GRIEVANCE.title && <p className="text-sm text-navy/70">{GRIEVANCE.title}</p>}
                                        <p className="mt-1">✉️ <a href={`mailto:${GRIEVANCE.email}`} className="font-semibold text-brand underline">{GRIEVANCE.email}</a></p>
                                        {GRIEVANCE.phone && <p>📞 <a href={`tel:${GRIEVANCE.phone.replace(/\s/g, '')}`} className="font-semibold text-brand underline">{GRIEVANCE.phone}</a></p>}
                                    </>
                                ) : (
                                    <p>✉️ <Link to="/contact" className="font-semibold text-brand underline">{t('privacy.useContact', { defaultValue: 'Use our Contact page' })}</Link></p>
                                )}
                                <p className="mt-2 text-sm text-navy/70">{t('privacy.reply', { defaultValue: 'We will reply as soon as we can.' })}</p>
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    )
}
