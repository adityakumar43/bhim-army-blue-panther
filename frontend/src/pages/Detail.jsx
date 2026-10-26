import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText, formatDate } from '../lib/text.js'
import ZoomPhoto from '../components/ZoomPhoto.jsx'
import EventRsvp from '../components/EventRsvp.jsx'

// One news item or one event on its own page. kind is "news" or "events".
export default function Detail({ kind }) {
    const { id } = useParams()
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [item, setItem] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        setItem(null)
        setFailed(false)
        api.get(`/${kind}/${id}`).then(setItem).catch(() => setFailed(true))
    }, [kind, id])

    if (failed) {
        return (
            <div className="px-5 py-16 text-center">
                <p role="alert" className="mb-4 text-lg">{t('detail.notFound')}</p>
                <Link to="/news" className="font-semibold text-brand underline">{t('detail.back')}</Link>
            </div>
        )
    }
    if (!item) return <p className="px-5 py-16 text-center">{t('loading')}</p>

    const date = kind === 'events' ? item.date : item.createdAt
    return (
        <article className="mx-auto max-w-3xl px-5 py-12 lg:px-16">
            <Link to="/news" className="font-semibold text-brand">← {t('detail.back')}</Link>
            {item.image?.url && <ZoomPhoto item={item} width={1200} buttonClassName="mt-6" className="max-h-112 w-full object-cover" />}
            <div className="mt-6 font-semibold text-brand">
                {formatDate(date, lang)}{item.location ? `, ${item.location}` : ''}
            </div>
            <h1 className="my-2 text-3xl font-extrabold">{pickText(item, 'title', lang)}</h1>
            <p className="text-lg whitespace-pre-line">{pickText(item, 'body', lang)}</p>
            {kind === 'events' && <EventRsvp eventId={item._id} />}
            <a
                href={`https://wa.me/?text=${encodeURIComponent(`${pickText(item, 'title', lang)}\n${window.location.href}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="btn mt-8 border-2 border-brand text-brand"
            >
                {t('detail.share')}
            </a>
        </article>
    )
}