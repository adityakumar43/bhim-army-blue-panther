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
                <div className="font-semibold text-brand">
                    {formatDate(date, lang)}{item.time ? `, ${timeText(item.time, lang)}` : ''}{item.location ? `, ${item.location}` : ''}
                </div>
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
        </article>
    )
}