import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { ORG_HI } from '../data/certificates.js'

// Sizes are in "cqw" (1/100 of the paper's width), so the receipt looks the same on a phone, a laptop and paper
const cq = (n) => `${n}cqw`
const NAVY = '#0a1a3f', BRAND = '#0b3c9d', GOLD = '#f2b705', GREEN = '#15803d'
const HEAD_FONT = "'Yatra One', Mukta, sans-serif"

// Printing: just the receipt, one A4 page, no page margins so the browser adds no link or date
const PRINT = `.receipt-print{display:none}
@media print{
  @page{size:A4 portrait;margin:0}
  html,body{background:#fff !important}
  #root{display:none !important}
  .receipt-print{display:block}
  .receipt-print .paper{width:210mm;height:297mm;box-shadow:none}
}`

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

// 2500 → "Two Thousand Five Hundred", using the Indian system (thousand, lakh, crore)
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function below100(n) { return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}` }
function below1000(n) { return n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${below100(n % 100)}` : ''}` : below100(n) }
function inWords(num) {
  let n = Math.floor(Number(num) || 0)
  if (!n) return 'Zero'
  const parts = []
  for (const [size, name] of [[1e7, 'Crore'], [1e5, 'Lakh'], [1e3, 'Thousand']]) {
    if (n >= size) { parts.push(`${below1000(Math.floor(n / size))} ${name}`); n %= size }
  }
  if (n) parts.push(below1000(n))
  return parts.join(' ')
}

function Paper({ d }) {
  const rows = [
    ['दानकर्ता', 'Received from', d.name || 'अज्ञात दानदाता · Anonymous donor'],
    ['रसीद संख्या', 'Receipt no.', d.receiptNo],
    ['दिनांक', 'Date', when(d.paidAt)],
    ['भुगतान का तरीका', 'Payment mode', 'ऑनलाइन · Online (Razorpay)'],
    ['भुगतान आईडी', 'Payment ID', d.paymentId],
  ]
  return (
    <div className="paper relative overflow-hidden bg-white text-[#0a1a3f] [-webkit-print-color-adjust:exact] [print-color-adjust:exact]"
      style={{ containerType: 'inline-size', aspectRatio: '210 / 297', fontFamily: 'Mukta, sans-serif' }}>
      {/* Faint logo in the middle of the page */}
      <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 opacity-[0.05]" style={{ width: cq(62), top: cq(58) }} />

      <div className="absolute inset-0 flex flex-col">
        {/* Letterhead */}
        <div className="relative shrink-0 text-white" style={{ background: `linear-gradient(100deg, ${NAVY} 0%, ${BRAND} 100%)`, height: cq(25) }}>
          <img src="/logo.png" alt="" className="absolute" style={{ left: cq(3.5), top: cq(2.5), width: cq(20) }} />
          <img src="/ambedkar-letterhead.webp" alt="" className="absolute bottom-0" style={{ right: cq(1.5), height: cq(23.5) }} />
          <div className="absolute flex flex-col items-center justify-center text-center" style={{ left: cq(26), right: cq(23), top: 0, bottom: 0 }}>
            <div className="whitespace-nowrap leading-none" style={{ fontFamily: HEAD_FONT, fontSize: cq(6.4), color: GOLD }}>
              {ORG_HI}
              {d.org?.regNo && <span style={{ fontSize: cq(2.4), marginLeft: cq(1), fontFamily: 'Mukta, sans-serif', fontWeight: 800 }}>रजि.</span>}
            </div>
            <div className="font-extrabold tracking-[0.12em] uppercase" style={{ fontSize: cq(2.5), marginTop: cq(1.2) }}>{d.org?.name || 'Bhim Army Blue Panther'}</div>
            {d.org?.address && <div style={{ fontSize: cq(1.75), marginTop: cq(0.8), color: 'rgba(255,255,255,.82)' }}>{d.org.address}</div>}
            {d.org?.regNo && <div style={{ fontSize: cq(1.6), marginTop: cq(0.4), color: 'rgba(255,255,255,.75)' }}>Reg. No. {d.org.regNo}</div>}
          </div>
        </div>
        <div className="shrink-0" style={{ height: cq(1), background: GOLD }} />

        <div className="relative flex min-h-0 flex-1 flex-col" style={{ padding: `${cq(3.5)} ${cq(7)} ${cq(2.5)}` }}>
          {/* Title and PAID stamp */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-extrabold leading-none" style={{ fontSize: cq(4.6), color: BRAND }}>दान रसीद</div>
              <div className="font-extrabold tracking-[0.2em] uppercase" style={{ fontSize: cq(2.3), marginTop: cq(1), color: '#64748b' }}>Donation receipt</div>
            </div>
            <div className="-rotate-6 text-center font-extrabold uppercase" style={{ color: GREEN, border: `${cq(0.6)} solid ${GREEN}`, borderRadius: cq(1.5), padding: `${cq(0.8)} ${cq(2.6)}`, fontSize: cq(3.4), letterSpacing: cq(0.3), lineHeight: 1.05 }}>
              ✓ Paid
              <div style={{ fontSize: cq(1.7), letterSpacing: cq(0.1) }}>भुगतान प्राप्त</div>
            </div>
          </div>

          {/* The amount, big, and in words */}
          <div className="text-center" style={{ marginTop: cq(3), border: `${cq(0.35)} solid ${BRAND}`, borderRadius: cq(2), background: '#f3f7fd', padding: `${cq(2.6)} ${cq(3)}` }}>
            <div className="font-bold" style={{ fontSize: cq(1.9), color: '#64748b' }}>प्राप्त राशि · Amount received</div>
            <div className="font-extrabold leading-none" style={{ fontSize: cq(8.5), color: NAVY, marginTop: cq(1) }}>{rupees(d.amount)}</div>
            <div className="font-semibold" style={{ fontSize: cq(2.1), marginTop: cq(1.6), color: BRAND }}>Rupees {inWords(d.amount)} Only</div>
          </div>

          {/* Details */}
          <dl style={{ marginTop: cq(2.5), fontSize: cq(2.1) }}>
            {rows.map(([hi, en, v]) => (
              <div key={en} className="grid grid-cols-[38%_1fr] items-baseline" style={{ padding: `${cq(0.85)} 0`, borderBottom: `${cq(0.15)} dashed #cbd5e1`, columnGap: cq(2) }}>
                <dt className="font-bold leading-tight"><span>{hi}</span><span className="block font-semibold" style={{ fontSize: cq(1.65), color: '#64748b' }}>{en}</span></dt>
                <dd className="font-semibold [overflow-wrap:anywhere]">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Thank you */}
          <div style={{ marginTop: cq(3), borderLeft: `${cq(0.8)} solid ${GOLD}`, paddingLeft: cq(2.5), fontSize: cq(2.05) }}>
            <p className="font-bold">आपके सहयोग के लिए हार्दिक धन्यवाद। जय भीम!</p>
            <p style={{ color: '#475569', marginTop: cq(0.6) }}>Thank you for supporting our work for justice, education and equality. Jai Bhim!</p>
            {d.org?.note && <p style={{ color: '#475569', marginTop: cq(0.6) }}>{d.org.note}</p>}
          </div>

          {/* QR to check it, and the signature */}
          <div className="mt-auto flex items-end justify-between" style={{ gap: cq(4), paddingTop: cq(2) }}>
            <div className="flex items-end" style={{ gap: cq(2) }}>
              {d.qr && <img src={d.qr} alt="QR code to check this receipt" style={{ width: cq(13), height: cq(13), padding: cq(0.6), borderRadius: cq(1) }} className="bg-white ring-1 ring-slate-200" />}
              <div style={{ fontSize: cq(1.6), color: '#64748b', maxWidth: cq(26) }}>
                <b className="block" style={{ color: NAVY }}>रसीद की जाँच करें</b>
                Scan to check this receipt online.
              </div>
            </div>
            <div className="text-center" style={{ minWidth: cq(30) }}>
              {d.org?.signature
                ? <img src={d.org.signature} alt="" className="mx-auto object-contain" style={{ height: cq(7), maxWidth: cq(30) }} />
                : <div style={{ height: cq(7) }} />}
              <div style={{ borderTop: `${cq(0.2)} solid ${NAVY}`, paddingTop: cq(0.8), fontSize: cq(1.8) }} className="font-bold">
                अधिकृत हस्ताक्षरकर्ता
                <span className="block font-semibold" style={{ fontSize: cq(1.6), color: '#64748b' }}>Authorised signatory</span>
              </div>
            </div>
          </div>
          <p className="text-center" style={{ fontSize: cq(1.5), color: '#94a3b8', marginTop: cq(1.8) }}>
            यह कंप्यूटर द्वारा बनाई गई रसीद है। · This is a computer-generated receipt.
          </p>
        </div>

        {/* Bottom strip */}
        <div className="shrink-0 text-center font-bold text-white" style={{ background: NAVY, fontSize: cq(2), padding: `${cq(1.4)} 0`, letterSpacing: cq(0.1) }}>
          <span style={{ color: GOLD }}>जय भीम</span> · शिक्षित बनो · संगठित रहो · संघर्ष करो
        </div>
      </div>
    </div>
  )
}

export default function Receipt() {
  const { token } = useParams()
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    let timer
    let tries = 0
    async function load() {
      try {
        const r = await api.get(`/donations/receipt/${token}`)
        if (cancelled) return
        setData(r)
        // Right after paying, the payment can take a few seconds to be confirmed
        if (r.pending && tries++ < 10) timer = setTimeout(load, 3000)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [token])

  // The heading font, loaded only on this page
  useEffect(() => {
    if (document.getElementById('yatra-font')) return
    const link = document.createElement('link')
    link.id = 'yatra-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Yatra+One&display=swap'
    document.head.appendChild(link)
  }, [])

  const print = () => (document.fonts?.ready || Promise.resolve()).then(() => window.print())

  if (error) return <p role="alert" className="px-5 py-16 text-center text-red-700">{error}</p>
  if (!data) return <p className="px-5 py-16 text-center">{t('loading')}</p>
  if (data.pending) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center" role="status">
        <p className="text-5xl" aria-hidden="true">⏳</p>
        <p className="mt-3 text-lg">{t('receipt.pending')}</p>
      </div>
    )
  }

  return (
    <>
      <style>{PRINT}</style>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center font-semibold text-green-800">
          🙏 {t('receipt.thanks')}
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <button onClick={print} className="btn gap-2 bg-brand text-white shadow-md hover:bg-navy">🖨️ {t('receipt.print')}</button>
          <Link to="/" className="btn gap-2 border-2 border-brand bg-white text-brand hover:bg-mist">🏠 {t('receipt.home')}</Link>
        </div>
        <p className="mb-4 text-center text-sm text-navy/60">💡 {t('receipt.pdfHint', { defaultValue: 'For a PDF, choose "Save as PDF" as the printer.' })}</p>
        <div className="overflow-hidden rounded-lg shadow-xl ring-1 ring-navy/10">
          <Paper d={data} />
        </div>
      </div>
      {/* The copy that is printed */}
      {createPortal(<div className="receipt-print"><Paper d={data} /></div>, document.body)}
    </>
  )
}
