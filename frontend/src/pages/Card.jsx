import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/text.js'
import { portrait } from '../lib/img.js'
import Chakra from '../components/Chakra.jsx'

// Birth dates are saved as plain dates, so show them without any time-zone shift
const birthDate = (d, lang) =>
  new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export default function Card() {
  const { token } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const loggedIn = !!localStorage.getItem('token')
  const [card, setCard] = useState(null) // what anyone with the link sees
  const [staff, setStaff] = useState(null) // every detail, only for a logged-in admin who may see members
  const [done, setDone] = useState({ card: false, staff: !loggedIn })

  useEffect(() => {
    api.get(`/members/card/${token}`).then(setCard).catch(() => { }).finally(() => setDone((d) => ({ ...d, card: true })))
    // An admin who scans the card while logged in also sees every detail
    if (loggedIn) api.get(`/members/verify/${token}`).then(setStaff).catch(() => { }).finally(() => setDone((d) => ({ ...d, staff: true })))
  }, [token])

  if (!done.card || !done.staff) return <p className="px-5 py-16 text-center">{t('loading')}</p>
  if (!card && !staff) return <p role="alert" className="px-5 py-16 text-center text-lg">{t('card.invalid')}</p>

  const rows = staff && [
    [t('card.status'), staff.status],
    [t('card.no'), staff.memberNo || '-'],
    [t('card.phone'), staff.phone],
    [t('card.email'), staff.email || '-'],
    [t('card.dob'), staff.dob ? birthDate(staff.dob, lang) : '-'],
    [t('card.address'), [staff.city, staff.district, staff.state].filter(Boolean).join(', ') || '-'],
    [t('card.assembly'), staff.assemblyNo ?? '-'],
    [t('card.lokSabha'), staff.lokSabhaNo ?? '-'],
    [t('card.applied'), formatDate(staff.appliedAt, lang)],
    ...(staff.reviewedAt ? [[t('card.decided'), `${staff.reviewedByName || '-'}, ${formatDate(staff.reviewedAt, lang)}`]] : []),
  ]

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      {staff && staff.status !== 'approved' && (
        <p role="alert" className="mb-4 bg-red-100 p-3 font-extrabold text-red-900">{t('card.notValid', { status: staff.status })}</p>
      )}

      {card && (
        <>
          {/* The two print-color lines make the blue and white print even when "background graphics" is off */}
          <article className="relative overflow-hidden bg-brand p-5 text-white [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
            <Chakra className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 text-white/10" />
            <div className="relative">
              <p className="text-sm font-semibold tracking-wide text-gold">{t('card.title')}</p>
              <p className="text-lg font-extrabold">{t('org')}</p>
            </div>
            <div className="relative mt-4 flex gap-4">
              {card.photo && <img src={portrait(card.photo, 240)} alt="" className="h-36 w-28 shrink-0 bg-white/10 object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-extrabold break-words">{card.name}</p>
                <dl className="mt-3 text-sm">
                  <dt className="text-white/75">{t('card.no')}</dt>
                  <dd className="mb-2 text-lg font-extrabold tracking-wide">{card.memberNo}</dd>
                  <dt className="text-white/75">{t('card.since')}</dt>
                  <dd className="font-semibold">{formatDate(card.since, lang)}</dd>
                </dl>
              </div>
            </div>
            <img src={card.qr} alt={t('card.scan')} className="relative mt-3 ml-auto h-20 w-20 bg-white p-1" />
          </article>
          <p className="mt-3 text-center text-sm text-navy/70">{t('card.scan')}</p>
          <div className="mt-6 print:hidden">
            <button onClick={() => window.print()} className="btn w-full bg-brand text-white">{t('card.print')}</button>
          </div>
        </>
      )}

      {staff && (
        <section className="mt-8 border-2 border-navy p-4 print:hidden">
          <h2 className="mb-3 text-lg font-extrabold">{t('card.staffTitle')}</h2>
          {!card && staff.photo && <img src={portrait(staff.photo, 240)} alt="" className="mb-3 h-36 w-28 object-cover" />}
          <p className="mb-3 text-xl font-extrabold">{staff.name}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-navy/70">{k}</dt>
                <dd className="[overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {!staff && (
        <p className="mt-8 text-center text-sm print:hidden">
          <Link to="/admin/login" className="text-brand underline">{t('card.staffLogin')}</Link>
        </p>
      )}
    </div>
  )
}