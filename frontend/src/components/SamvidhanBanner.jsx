import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isSamvidhanTime } from '../data/samvidhan.js'

// Shown at the top of the Home page only on 25 and 26 November (Indian time), every year, by itself.
// Add ?samvidhan=1 to the address to see it on any other day.
export default function SamvidhanBanner() {
    const { t } = useTranslation()
    if (!isSamvidhanTime()) return null
    return (
        <section className="relative overflow-hidden bg-linear-to-r from-navy via-[#0d2a6b] to-brand text-white">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gold" />
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-6 text-center sm:flex-row sm:text-left lg:px-16">
                <img src="/inspirations/ambedkar-round.jpg" alt="" className="h-16 w-16 shrink-0 rounded-full object-cover object-top ring-4 ring-gold/60" />
                <div className="flex-1">
                    <p className="text-xl font-extrabold text-gold">📜 {t('samvidhan.bannerTitle')}</p>
                    <p className="mt-0.5 text-white/85">{t('samvidhan.bannerText')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    <Link to="/samvidhan#pledge" className="inline-flex min-h-11 items-center rounded-xl bg-gold px-5 font-extrabold text-navy hover:brightness-95">✋ {t('samvidhan.bannerBtn')}</Link>
                    <Link to="/samvidhan#quiz" className="inline-flex min-h-11 items-center rounded-xl border-2 border-white/40 px-4 font-bold hover:bg-white/10">🧠 {t('samvidhan.quizTitle')}</Link>
                </div>
            </div>
        </section>
    )
}
