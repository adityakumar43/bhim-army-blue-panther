import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isSamvidhanTime } from '../data/samvidhanDates.js'

// Shown at the top of the Home page only on 25 and 26 November (Indian time), every year, by itself.
// Add ?samvidhan=1 to the address to see it on any other day.
export default function SamvidhanBanner() {
    const { t } = useTranslation()
    if (!isSamvidhanTime()) return null
    return (
        <section className="relative overflow-hidden bg-linear-to-r from-navy via-[#0d2a6b] to-brand text-white">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gold" />
            {/* Phones: one slim row (small photo, title, one button). Computers: the full banner with the text and both buttons. */}
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-5 lg:px-16">
                <img src="/inspirations/ambedkar-round.jpg" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gold/60 sm:h-16 sm:w-16 sm:ring-4" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-extrabold text-gold sm:text-xl">📜 {t('samvidhan.bannerTitle')}</p>
                    <p className="mt-0.5 hidden text-white/85 sm:block">{t('samvidhan.bannerText')}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <Link to="/samvidhan#pledge" className="inline-flex min-h-10 items-center rounded-lg bg-gold px-3 text-sm font-extrabold whitespace-nowrap text-navy hover:brightness-95 sm:min-h-11 sm:rounded-xl sm:px-5 sm:text-base">✋ {t('samvidhan.bannerBtn')}</Link>
                    <Link to="/samvidhan#quiz" className="hidden min-h-11 items-center rounded-xl border-2 border-white/40 px-4 font-bold hover:bg-white/10 sm:inline-flex">🧠 {t('samvidhan.quizTitle')}</Link>
                </div>
            </div>
        </section>
    )
}
