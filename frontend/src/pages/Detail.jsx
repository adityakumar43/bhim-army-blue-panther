import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import ZoomPhoto from '../components/ZoomPhoto.jsx'
import EventRsvp from '../components/EventRsvp.jsx'
import { useSeo } from '../lib/seo.js'
import Loading from '../components/Loading.jsx'
import EventActions from '../components/EventActions.jsx'
import { timeText } from '../lib/calendar.js'
import SharePoster from '../components/SharePoster.jsx'
import useLoad from '../lib/useLoad.js'
import { WhatsAppShare, ListenButton } from '../components/ShareListen.jsx'
import { shareLink } from '../lib/share.js'
import Icon from '../components/Icon.jsx'
import { cdn } from '../lib/img.js'

// Today in India, as "2026-11-18" (the same day everyone in India sees, wherever the server is)
const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
// Whole days from today to an event's day: 0 = today, 1 = tomorrow, below 0 = it is over
const daysUntil = (date) => Math.round((Date.parse(String(date).slice(0, 10)) - Date.parse(indiaToday())) / 864e5)

// How soon an event is: "13 days left" (gold), "Tomorrow", "Today" (red), or "Held" once it is over
function WhenBadge({ days }) {
    const { t } = useTranslation()
    const [text, tone] = days < 0 ? [t('home.eventHeld'), 'bg-navy/8 text-navy/65']
        : days === 0 ? [t('detail.today'), 'bg-red-600 text-white']
            : days === 1 ? [t('detail.tomorrow'), 'bg-gold text-navy']
                : [t('detail.daysLeft', { count: days }), 'bg-gold text-navy']
    return <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${tone}`}>{text}</span>
}

// Under the post: three other news items or events, so a visitor who came from a shared link has somewhere to go next.
// Events: the coming ones first (soonest on top), then the most recent past ones, like the home page.
function MoreItems({ kind, id }) {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [items, setItems] = useState(null)
    useEffect(() => {
        let live = true
        api.get(kind === 'events' ? '/events?limit=20' : '/news?limit=4').then((all) => {
            let list = all.filter((x) => x._id !== id)
            if (kind === 'events') {
                const today = indiaToday()
                const coming = list.filter((e) => e.date.slice(0, 10) >= today).sort((a, b) => a.date.localeCompare(b.date))
                list = [...coming, ...list.filter((e) => e.date.slice(0, 10) < today)] // the past ones come newest first
            }
            if (live) setItems(list.slice(0, 3))
        }).catch(() => { if (live) setItems([]) })
        return () => { live = false }
    }, [kind, id])
    if (!items?.length) return null
    return (
        <section className="mt-10" aria-labelledby="more-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 id="more-title" className="text-2xl font-extrabold">{t(kind === 'events' ? 'detail.moreEvents' : 'detail.moreNews')}</h2>
                <Link to={kind === 'events' ? '/news?tab=events' : '/news'} className="inline-flex min-h-10 items-center gap-1 font-bold text-brand">
                    {t('viewAll')} <span aria-hidden="true">→</span>
                </Link>
            </div>
            <ul className="grid gap-3">
                {items.map((x) => (
                    <li key={x._id}>
                        <Link to={`/${kind}/${x._id}`} className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3 shadow-sm transition hover:shadow-md">
                            {x.image?.url
                                ? <img src={cdn(x.image.url, 200)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                                : <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-navy to-brand text-white/85"><Icon name={kind === 'events' ? 'calendar' : 'news'} size={24} /></span>}
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-brand">{formatDate(kind === 'events' ? x.date : x.createdAt, lang)}</span>
                                <span className="line-clamp-2 leading-snug font-extrabold">{pickText(x, 'title', lang)}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}

// One news item or one event on its own page. kind is "news" or "events".
export default function Detail({ kind }) {
    const { id } = useParams()
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const { data: item, error, reload } = useLoad(() => api.get(`/${kind}/${id}`), `${kind}/${id}`)
    const failed = error ? (error.status === 404 ? 'notFound' : 'offline') : '' // 'offline': the server could not be reached

    useSeo({
        title: item && pickText(item, 'title', lang),
        description: item && pickText(item, 'body', lang),
        image: item?.image?.url,
        type: 'article',
    })

    if (failed) {
        return (
            <div className="px-5 py-16 text-center">
                <p role="alert" className="mb-4 text-lg">{failed === 'notFound' ? t('detail.notFound') : t('errors.offline')}</p>
                {failed === 'offline' && <button onClick={reload} className="btn mb-4 bg-brand text-white hover:bg-navy">{t('errors.retry')}</button>}
                <div><Link to={kind === 'events' ? '/news?tab=events' : '/news'} className="font-semibold text-brand underline">{t('detail.back')}</Link></div>
            </div>
        )
    }
    if (!item) return <Loading page />

    const date = kind === 'events' ? item.date : item.createdAt
    return (
        <article className="mx-auto max-w-3xl px-5 py-12 lg:px-16">
            <Link to={kind === 'events' ? '/news?tab=events' : '/news'} className="font-semibold text-brand">← {t('detail.back')}</Link>
            <div className="panel mt-6">
                {item.image?.url && <ZoomPhoto item={item} width={1200} buttonClassName="mb-6" className="max-h-112 w-full object-cover" />}
                {/* When and where, each on its own with an icon (one long line with commas was hard to read on a phone) */}
                <div className="flex flex-wrap items-start gap-x-5 gap-y-1.5 font-semibold text-brand">
                    <span className="inline-flex items-center gap-1.5"><Icon name="calendar" size={18} />{formatDate(date, lang)}</span>
                    {item.time && <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={18} />{timeText(item.time, lang)}</span>}
                    {item.location && <span className="inline-flex items-start gap-1.5 text-navy/75"><Icon name="pin" size={18} className="mt-0.5 shrink-0" />{item.location}</span>}
                </div>
                {kind === 'events' && <div className="mt-3"><WhenBadge days={daysUntil(item.date)} /></div>}
                <h1 className="my-2 text-3xl font-extrabold">{pickText(item, 'title', lang)}</h1>
                <ListenButton item={item} kind={kind} small className="mb-3" />
                <p className="text-lg whitespace-pre-line">{pickText(item, 'body', lang)}</p>
                {kind === 'events' && <EventActions event={item} className="mt-5" />}
                {kind === 'events' && <EventRsvp eventId={item._id} />}
                {/* Share: as a poster picture, or as a link */}
                <div className="mt-8 flex flex-wrap items-start gap-3">
                    <WhatsAppShare item={item} kind={kind} />
                    <SharePoster item={item} kind={kind} link={shareLink(kind, item._id)} />
                </div>
            </div>
            <MoreItems kind={kind} id={item._id} />
        </article>
    )
}