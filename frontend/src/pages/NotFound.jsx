import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSeo } from '../components/Seo.jsx'
import BoxIcon from '../components/BoxIcon.jsx'

// Shown for any address the website does not have (a typo, or an old link)
export default function NotFound() {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    useSeo({ title: t('notFound.title', { defaultValue: 'Page not found' }) })

    // Ask search engines not to list this address
    useEffect(() => {
        const meta = document.createElement('meta')
        meta.name = 'robots'
        meta.content = 'noindex'
        document.head.appendChild(meta)
        return () => meta.remove()
    }, [])

    // Places people usually look for
    const links = [
        ['/join', 'userPlus', t('nav.join')],
        ['/news', 'news', t('nav.news')],
        ['/events', 'calendar', t('cal.link')],
        ['/help', 'help', t('help.link')],
        ['/membership/status', 'idCard', t('notFound.status', { defaultValue: 'Membership status' })],
        ['/contact', 'mail', t('nav.contact')],
    ]

    return (
        <section className="bg-[#F3F6FC] px-5 py-14 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
                <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand/10" />
                    <img src="/logo.png" alt="" className="relative h-24 w-24 object-contain opacity-90" />
                </div>
                <p className="text-6xl leading-none font-extrabold text-brand/20 sm:text-7xl" aria-hidden="true">404</p>
                <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{t('notFound.title', { defaultValue: 'Page not found' })}</h1>
                <p className="mt-3 text-lg text-navy/70">{t('notFound.body', { defaultValue: 'The page you are looking for does not exist or has moved. Check the address, or choose a page below.' })}</p>
                <p className="mx-auto mt-3 max-w-full truncate rounded-lg bg-white px-3 py-1.5 font-mono text-sm text-navy/50 shadow-sm sm:inline-block" title={pathname}>{pathname}</p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/" className="btn bg-brand text-white hover:brightness-110">🏠 {t('notFound.home', { defaultValue: 'Go to the home page' })}</Link>
                    <button type="button" onClick={() => window.history.back()} className="btn border-2 border-brand text-brand">← {t('notFound.back', { defaultValue: 'Go back' })}</button>
                </div>

                <ul className="mt-10 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
                    {links.map(([to, icon, label]) => (
                        <li key={to}>
                            <Link to={to} className="flex h-full items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3 font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
                                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand"><BoxIcon name={icon} size={20} /></span>
                                <span className="min-w-0 leading-snug">{label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

// The same idea inside the admin panel
export function AdminNotFound() {
    return (
        <div className="card mx-auto max-w-lg text-center">
            <p className="text-5xl font-extrabold text-brand/20" aria-hidden="true">404</p>
            <h1 className="mt-2 text-xl font-extrabold">This admin page does not exist</h1>
            <p className="mt-2 text-navy/70">Check the address, or use the menu or the search box at the top.</p>
            <Link to="/admin" className="abtn-primary mt-5 inline-flex">← Back to Overview</Link>
        </div>
    )
}
