import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/text.js'
import { portrait } from '../lib/img.js'
import Loading from '../components/Loading.jsx'



// Sizes are in "cqw" (1/100 of the card's width), so the card looks the same on a phone, a laptop and paper
const cq = (n) => `${n}cqw`
const NAVY = '#0a1a3f', BRAND = '#0b3c9d', GOLD = '#f2b705'

// Printing: just the card, at the real size of an ID card (85.6 × 54 mm), ready to cut out and laminate
const PRINT = `.card-print{display:none}
@media print{
  @page{size:A4 portrait;margin:15mm}
  html,body{background:#fff !important}
  #root{display:none !important}
  .card-print{display:flex;flex-direction:column;align-items:center;gap:6mm}
  .card-print .id-card{width:85.6mm;box-shadow:none;border:0.2mm solid #cbd5e1}
}`

function IdCard({ card, t, lang, ended }) {
  return (
    <article className="id-card relative w-full overflow-hidden rounded-[3.5cqw] bg-white text-[#0a1a3f] shadow-xl [-webkit-print-color-adjust:exact] [print-color-adjust:exact]"
      style={{ containerType: 'inline-size', aspectRatio: '85.6 / 54' }}>
      {/* A membership that has ended: the card turns grey with a red stamp over the QR */}
      {ended && (
        <div className="absolute z-10 flex items-center justify-center" style={{ right: cq(2.5), top: cq(22), width: cq(22), height: cq(22) }}>
          <div className="-rotate-12 text-center leading-none font-extrabold whitespace-nowrap text-red-600 uppercase" style={{ border: `${cq(0.8)} solid currentColor`, borderRadius: cq(1.5), padding: `${cq(1.2)} ${cq(2)}`, fontSize: cq(3.8), letterSpacing: cq(0.3), background: 'rgba(255,255,255,.92)' }}>
            {t('card.stamp', { defaultValue: 'Not valid' })}
          </div>
        </div>
      )}
      <div className={`absolute inset-0 flex flex-col ${ended ? 'grayscale' : ''}`}>
        {/* Top band: logo and name */}
        <div className="relative flex items-center text-white" style={{ background: `linear-gradient(100deg, ${NAVY} 0%, ${BRAND} 100%)`, padding: `${cq(2)} ${cq(4)}`, gap: cq(3) }}>
          <img src="/logo.png" alt="" style={{ width: cq(11.5), height: cq(11.5) }} className="shrink-0 object-contain" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="font-extrabold" style={{ fontSize: cq(5) }}>भीम आर्मी ब्लू पैंथर</div>
            <div className="font-bold tracking-wider uppercase" style={{ fontSize: cq(2.6), color: 'rgba(255,255,255,.8)' }}>Bhim Army Blue Panther</div>
          </div>
          <div className="shrink-0 rounded-full font-extrabold uppercase" style={{ background: GOLD, color: NAVY, fontSize: cq(2.4), padding: `${cq(0.8)} ${cq(2.4)}`, letterSpacing: cq(0.2) }}>
            {t('card.title')}
          </div>
        </div>
        <div style={{ height: cq(0.9), background: GOLD }} />

        {/* Body: photo, name, numbers, QR */}
        <div className="relative flex min-h-0 flex-1 items-center" style={{ padding: `${cq(2.4)} ${cq(4)}`, gap: cq(3.5) }}>
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute opacity-[0.06]" style={{ width: cq(42), left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="relative shrink-0 overflow-hidden bg-[#eef3fb]" style={{ width: cq(22), height: cq(28), borderRadius: cq(2), border: `${cq(0.7)} solid ${BRAND}` }}>
            {card.photo
              ? <img src={portrait(card.photo, 300)} alt="" className="h-full w-full object-cover" />
              : <span className="flex h-full items-center justify-center font-extrabold" style={{ fontSize: cq(10), color: BRAND }}>{card.name?.[0]}</span>}
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="line-clamp-2 font-extrabold leading-[1.15]" style={{ fontSize: cq(5) }}>{card.name}</div>
            {card.state && <div className="truncate font-semibold" style={{ fontSize: cq(2.6), color: BRAND, marginTop: cq(0.6) }}>📍 {card.state}</div>}
            <div className="grid grid-cols-[auto_auto] justify-start" style={{ marginTop: cq(2.2), columnGap: cq(4) }}>
              <div>
                <div style={{ fontSize: cq(2.3), color: '#64748b' }}>{t('card.no')}</div>
                <div className="font-extrabold tracking-wider whitespace-nowrap" style={{ fontSize: cq(3.8), color: BRAND }}>{card.memberNo}</div>
              </div>
              <div>
                <div style={{ fontSize: cq(2.3), color: '#64748b' }}>{t('card.since')}</div>
                <div className="font-bold whitespace-nowrap" style={{ fontSize: cq(3), lineHeight: cq(5.2) }}>{formatDate(card.since, lang)}</div>
              </div>
            </div>
          </div>
          <div className="relative flex shrink-0 flex-col items-center" style={{ width: cq(18) }}>
            <img src={card.qr} alt={t('card.scan')} style={{ width: cq(17), height: cq(17), padding: cq(0.7), borderRadius: cq(1.5) }} className="bg-white ring-1 ring-slate-200" />
            <span className="text-center leading-tight" style={{ fontSize: cq(1.9), color: '#64748b', marginTop: cq(0.8) }}>{t('card.scan')}</span>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="text-center font-bold text-white" style={{ background: NAVY, fontSize: cq(2.5), padding: `${cq(1.3)} 0`, letterSpacing: cq(0.15) }}>
          <span style={{ color: GOLD }}>जय भीम</span> · शिक्षित बनो · संगठित रहो · संघर्ष करो
        </div>
      </div>
    </article>
  )
}

export default function Card() {
  const { token } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [card, setCard] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.get(`/members/card/${token}`).then(setCard).catch(() => { }).finally(() => setDone(true))
  }, [token])

  if (!done) return <Loading page />
  if (!card) return <p role="alert" className="px-5 py-16 text-center text-lg">{t('card.invalid')}</p>

  // The person is no longer a member (left, or removed by the team): say so clearly, no print or share
  if (card.valid === false) {
    return (
      <div className="mx-auto max-w-lg px-5 py-10">
        <div role="alert" className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-center text-red-900">
          <p className="text-lg font-extrabold">❌ {t('card.ended', { defaultValue: 'This membership is no longer valid' })}</p>
          <p className="mt-1 text-sm">
            {t('card.endedBody', { defaultValue: 'This person is not a member of Bhim Army Blue Panther now.' })}
            {card.endedAt && <> {t('card.endedOn', { defaultValue: 'Ended on' })} <b>{formatDate(card.endedAt, lang)}</b>.</>}
          </p>
        </div>
        <IdCard card={card} t={t} lang={lang} ended />
      </div>
    )
  }

  const share = `https://wa.me/?text=${encodeURIComponent(`${t('card.title')} – ${card.name} (${card.memberNo})\n${window.location.href}`)}`

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <style>{PRINT}</style>
      <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-800">
        ✅ {t('card.valid', { defaultValue: 'Valid membership card' })}
      </div>
      <IdCard card={card} t={t} lang={lang} />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => window.print()} className="btn gap-2 bg-brand text-white shadow-md hover:bg-navy">🖨️ {t('card.print')}</button>
        <a href={share} target="_blank" rel="noopener noreferrer" className="btn gap-2 border-2 border-brand bg-white text-brand hover:bg-mist">💬 {t('card.share', { defaultValue: 'Share on WhatsApp' })}</a>
      </div>
      <p className="mt-3 text-center text-sm text-navy/60">✂️ {t('card.printHint', { defaultValue: 'Prints at the real size of an ID card, ready to cut out and laminate.' })}</p>

      {/* The copy that is printed */}
      {createPortal(<div className="card-print"><IdCard card={card} t={t} lang={lang} /></div>, document.body)}
    </div>
  )
}
