import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/text.js'
import Chakra from '../components/Chakra.jsx'

export default function Card() {
  const { token } = useParams()
  const { t, i18n } = useTranslation()
  const [card, setCard] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.get(`/members/card/${token}`).then(setCard).catch(() => setFailed(true))
  }, [token])

  if (failed) return <p role="alert" className="px-5 py-16 text-center text-lg">{t('card.invalid')}</p>
  if (!card) return <p className="px-5 py-16 text-center">{t('loading')}</p>

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      {/* The two print-color lines make the blue and white print even when "background graphics" is off */}
      <article className="relative flex min-h-60 flex-col justify-between overflow-hidden bg-brand p-5 text-white [-webkit-print-color-adjust:exact] [print-color-adjust:exact] sm:aspect-[1.586/1]">
        <Chakra className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 text-white/10" />
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-gold">{t('card.title')}</p>
          <p className="text-lg font-extrabold">{t('org')}</p>
        </div>
        <p className="relative my-3 text-2xl font-extrabold break-words">{card.name}</p>
        <div className="relative flex items-end justify-between gap-3">
          <dl className="text-sm">
            <dt className="text-white/75">{t('card.no')}</dt>
            <dd className="mb-2 text-lg font-extrabold tracking-wide">{card.memberNo}</dd>
            <dt className="text-white/75">{t('card.since')}</dt>
            <dd className="font-semibold">{formatDate(card.since, i18n.language)}</dd>
          </dl>
          <img src={card.qr} alt={t('card.scan')} className="h-20 w-20 shrink-0 bg-white p-1" />
        </div>
      </article>
      <p className="mt-3 text-center text-sm text-navy/70">{t('card.scan')}</p>
      <div className="mt-6 print:hidden">
        <button onClick={() => window.print()} className="btn w-full bg-brand text-white">{t('card.print')}</button>
      </div>
    </div>
  )
}