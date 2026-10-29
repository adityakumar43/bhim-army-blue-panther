import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { certType, RELATION_HI, ORG_HI, day } from '../data/certificates.js'
import Loading from '../components/Loading.jsx'

// /certificate/<token>: an appointment letter, certificate or general letter, ready to print or save as PDF.
// The same link (and the QR code printed on it) shows anyone whether it is genuine or cancelled.

const NAVY = '#0a1a3f', BRAND = '#0b3c9d', GOLD = '#f2b705', GOLD_DARK = '#a87a00'

// Sizes are in "cqw" (1/100 of the paper's width), so the page looks the same on a phone, a laptop and paper.
const cq = (n) => `${n}cqw`

const isCertificate = (c) => c.type === 'appreciation' || c.type === 'participation'

function printCss(c) {
    const landscape = isCertificate(c)
    // A general letter can be longer than one page, so its height is not fixed
    const size = landscape ? 'width:297mm;height:210mm' : c.type === 'letter' ? 'width:210mm' : 'width:210mm;height:297mm'
    // No page margins, so the browser has no room to print its own header/footer (the page link, date and page number).
    // A long letter still gets space at the top and bottom of its later pages from .page-gap (see GeneralLetter).
    const pages = '@page{margin:0}.page-gap{height:14mm}.page-gap-pull{margin-top:-14mm;margin-bottom:-14mm}'
        // Each printed page of a letter gets the faint logo in its exact centre: the picture is one A4 page tall
        // and repeats down the letter, so it lines up with every page however long the letter is.
        + '.wm-screen{display:none}.cert-print .letter-paper{background:#fff url(/letter-watermark.webp) repeat-y 0 0/210mm 297mm}'
    return `.cert-print{display:none}
@media print{
  @page{size:A4 ${landscape ? 'landscape' : 'portrait'}}
  ${pages}
  html,body{background:#fff !important}
  #root{display:none !important}
  .cert-print{display:block}
  .cert-print .paper{${size};box-shadow:none}
}`
}

const fromLine = (c) => {
    const who = c.relation && c.guardian ? `${RELATION_HI[c.relation]} / ${c.relation} ${c.guardian}` : ''
    const where = [c.district, c.state].filter(Boolean).join(', ')
    return [who, where].filter(Boolean).join(' · ')
}

function Paper({ c }) {
    const landscape = isCertificate(c)
    const letter = c.type === 'letter'
    return (
        <div className={`paper relative bg-white text-[#0a1a3f] [-webkit-print-color-adjust:exact] [print-color-adjust:exact] ${letter ? 'letter-paper' : 'overflow-hidden'}`}
            style={{ containerType: 'inline-size', aspectRatio: letter ? undefined : landscape ? '297 / 210' : '210 / 297', fontFamily: 'Mukta, sans-serif' }}>
            {landscape ? <CertificateBody c={c} /> : letter ? <GeneralLetter c={c} /> : <LetterBody c={c} />}
            {c.status === 'revoked' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span style={{ fontSize: cq(6.5), whiteSpace: 'nowrap', transform: 'rotate(-24deg)', color: 'rgba(220,38,38,.28)', border: `${cq(0.8)} solid rgba(220,38,38,.28)`, padding: `0 ${cq(3)}` }}
                        className="font-extrabold tracking-widest">निरस्त · CANCELLED</span>
                </div>
            )}
        </div>
    )
}

// k scales it up on the portrait letter, which is narrower
function Signature({ c, align = 'center', k = 1 }) {
    return (
        <div style={{ textAlign: align, width: cq(24 * k) }}>
            {c.signatureUrl || c.org.signature
                ? <img src={c.signatureUrl || c.org.signature} alt="" style={{ height: cq(6 * k), margin: align === 'center' ? '0 auto' : '0 0 0 auto', objectFit: 'contain' }} />
                : <div style={{ height: cq(6 * k) }} />}
            <div style={{ borderTop: `${cq(0.15 * k)} solid ${NAVY}`, paddingTop: cq(0.6 * k) }}>
                <div className="font-extrabold" style={{ fontSize: cq(1.5 * k) }}>{c.signatoryName || ' '}</div>
                <div style={{ fontSize: cq(1.2 * k), color: '#4b5563', whiteSpace: 'pre-line' }}>{c.signatoryTitle || 'अधिकृत हस्ताक्षरकर्ता / Authorised signatory'}</div>
                <div style={{ fontSize: cq(1.2 * k), color: BRAND }} className="font-semibold">{ORG_HI}</div>
            </div>
        </div>
    )
}

// Landscape certificate (appreciation / participation)
function CertificateBody({ c }) {
    const t = certType(c.type)
    const appreciation = c.type === 'appreciation'
    return (
        <div className="absolute inset-0">
            <div className="absolute" style={{ inset: cq(1.4), border: `${cq(0.9)} solid ${NAVY}` }} />
            <div className="absolute" style={{ inset: cq(3), border: `${cq(0.22)} solid ${GOLD}` }} />
            {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
                <span key={v + h} className="absolute rotate-45" style={{ [v]: cq(2.35), [h]: cq(2.35), width: cq(1.5), height: cq(1.5), background: GOLD }} />
            ))}
            <img src="/logo.png" alt="" className="pointer-events-none absolute left-1/2 top-[54%] w-[40%] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />

            <div className="relative flex h-full flex-col items-center text-center" style={{ padding: `${cq(4.2)} ${cq(9)} 0` }}>
                <img src="/logo.png" alt="" style={{ height: cq(8.5) }} />
                <div className="font-extrabold leading-tight" style={{ fontSize: cq(2.3), marginTop: cq(0.4) }}>{ORG_HI}</div>
                <div className="font-semibold uppercase" style={{ fontSize: cq(1.15), letterSpacing: cq(0.35), color: BRAND }}>{c.org.name}</div>

                <div className="font-extrabold leading-none" style={{ fontSize: cq(4.6), color: BRAND, marginTop: cq(1.6) }}>{t.hi}</div>
                <div className="font-extrabold uppercase" style={{ fontSize: cq(1.6), letterSpacing: cq(0.45), color: GOLD_DARK, marginTop: cq(0.5) }}>{t.titleEn}</div>

                <div style={{ fontSize: cq(1.4), color: '#4b5563', marginTop: cq(1.8) }}>यह प्रमाणित किया जाता है कि / This is to certify that</div>
                <div className="font-extrabold leading-tight" style={{ fontSize: cq(3.8), marginTop: cq(0.4), borderBottom: `${cq(0.2)} solid ${GOLD}`, padding: `0 ${cq(4)} ${cq(0.3)}` }}>{c.name}</div>
                {fromLine(c) && <div style={{ fontSize: cq(1.3), color: '#4b5563', marginTop: cq(0.6) }}>{fromLine(c)}</div>}

                <p style={{ fontSize: cq(1.55), lineHeight: 1.55, marginTop: cq(1.4), maxWidth: cq(72) }}>
                    {appreciation
                        ? <>ने <b>{c.reason}</b> में सराहनीय योगदान दिया है। संगठन आपके समर्पण एवं सेवा भाव की सराहना करता है तथा आपके उज्ज्वल भविष्य की कामना करता है।</>
                        : <>ने <b>{c.reason}</b> में सक्रिय भागीदारी की है। संगठन आपके सहयोग के लिए हृदय से आभार व्यक्त करता है।</>}
                </p>
                <p style={{ fontSize: cq(1.25), lineHeight: 1.5, color: '#4b5563', marginTop: cq(0.5), maxWidth: cq(72) }}>
                    {appreciation
                        ? <>has made a commendable contribution to <b>{c.reason}</b>. The organisation appreciates your dedication and service, and wishes you a bright future.</>
                        : <>has actively participated in <b>{c.reason}</b>. The organisation sincerely thanks you for your support.</>}
                </p>
            </div>

            <div className="absolute flex items-end justify-between" style={{ left: cq(7), right: cq(7), bottom: cq(5) }}>
                <div className="flex items-end text-left" style={{ gap: cq(1.2), width: cq(24) }}>
                    <img src={c.qr} alt="" style={{ width: cq(7.5), height: cq(7.5) }} />
                    <div style={{ fontSize: cq(1.1), lineHeight: 1.45 }}>
                        <div><b>Ref:</b> {c.refNo}</div>
                        <div><b>दिनांक / Date:</b> {day(c.issueDate)}</div>
                        <div style={{ color: '#6b7280' }}>QR स्कैन करके जाँचें / Scan to verify</div>
                    </div>
                </div>
                <div className="font-extrabold" style={{ fontSize: cq(1.5), color: BRAND, paddingBottom: cq(1) }}>जय भीम · जय संविधान</div>
                <Signature c={c} />
            </div>
        </div>
    )
}

// Portrait appointment letter, laid out like the organisation's printed letter
const ddmmyyyy = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : '')
const HEAD_FONT = "'Yatra One', Mukta, sans-serif"

// The letterhead used on every letter: logo on the left, name in the middle, Babasaheb on the right
// (turned towards the letter), the leaders' names in the blue band and the office address below.
function Letterhead({ c }) {
    const leaders = c.letterhead?.leaders || []
    const office = c.letterhead?.office
    return (
        <div className="relative" style={{ padding: `${cq(2.6)} ${cq(3.2)} 0` }}>
            <div className="relative" style={{ height: cq(24) }}>
                <div className="absolute flex items-end justify-center whitespace-nowrap leading-none"
                    style={{ left: cq(24), right: cq(21), top: 0, height: cq(10.6), fontFamily: HEAD_FONT, fontSize: cq(6), color: BRAND, WebkitTextStroke: `${cq(0.22)} ${BRAND}`, paintOrder: 'stroke fill' }}>
                    {ORG_HI}
                    {c.org.regNo && <span style={{ fontSize: cq(2.5), marginLeft: cq(1), paddingBottom: cq(0.6), fontFamily: 'Mukta, sans-serif', fontWeight: 800, WebkitTextStroke: 0 }}>रजि.</span>}
                </div>
                <div className="absolute grid items-center text-center text-white"
                    style={{ left: 0, right: 0, bottom: 0, height: cq(12), background: BRAND, borderRadius: cq(0.5), padding: `0 ${cq(26)} 0 ${cq(23)}`, gap: cq(1.2), gridTemplateColumns: `repeat(${Math.max(leaders.length, 1)}, auto)`, justifyContent: 'space-evenly' }}>
                    {leaders.map((l, i) => (
                        <div key={i} className="leading-tight">
                            <div className="whitespace-nowrap font-extrabold" style={{ color: '#ffd23f', fontSize: cq(2.05) }}>{l.name}</div>
                            <div className="whitespace-nowrap font-bold" style={{ color: '#ffd23f', fontSize: cq(1.75) }}>{l.title}</div>
                            <div className="font-extrabold tracking-wide" style={{ fontSize: cq(1.95), marginTop: cq(0.3) }}>{l.phone}</div>
                        </div>
                    ))}
                </div>
                <img src="/logo.png" alt="" className="absolute z-10" style={{ left: cq(0.5), bottom: cq(-1), width: cq(21.5) }} />
                <img src="/ambedkar-letterhead.webp" alt="" className="absolute z-10" style={{ right: 0, bottom: 0, height: cq(22.5) }} />
            </div>
            {office && (
                <div className="text-center font-extrabold text-white" style={{ background: BRAND, fontSize: cq(1.95), padding: `${cq(0.7)} ${cq(2)}`, marginTop: cq(0.6), borderRadius: cq(0.4) }}>{office}</div>
            )}
        </div>
    )
}

// A general letter (पत्र): सेवा में, subject, the letter itself and the signature. It can run onto a second page.
function GeneralLetter({ c }) {
    const toLines = (c.to || '').split('\n').map((l) => l.trim()).filter(Boolean)
    const paras = (c.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    const copies = (c.copies || '').split('\n').map((l) => l.trim()).filter(Boolean)
    return (
        <div className="relative flex flex-col" style={{ minHeight: cq(141.42), fontSize: cq(1.95) }}>
            <img src="/logo.png" alt="" className="wm-screen pointer-events-none absolute left-1/2 -translate-x-1/2 opacity-[0.06]" style={{ width: cq(62), top: cq(48) }} />
            <Letterhead c={c} />

            <div className="relative flex flex-1 flex-col" style={{ padding: `${cq(2.6)} ${cq(8)} ${cq(5)}` }}>
                <div className="flex justify-between font-semibold" style={{ fontSize: cq(2) }}>
                    <span>पत्रांक सं० - {c.refNo}</span>
                    <span>दिनांक - {ddmmyyyy(c.issueDate)}</span>
                </div>

                <div style={{ marginTop: cq(4), lineHeight: 1.6 }}>
                    <div>सेवा में,</div>
                    <div style={{ paddingLeft: cq(4) }}>{toLines.map((l, i) => <div key={i}>{l}</div>)}</div>
                </div>

                {c.subject && <p className="font-bold" style={{ marginTop: cq(2.6) }}>विषय: {c.subject}</p>}
                {c.salutation && <p style={{ marginTop: cq(2.6) }}>{c.salutation}</p>}

                {/* When printed, the empty header and footer rows repeat on every page, leaving a margin at the top and
            bottom of a second page. The negative margin cancels them on the first page. */}
                <div style={{ marginTop: cq(1.8), lineHeight: 1.7 }}>
                    <table className="page-gap-pull w-full border-collapse">
                        <thead><tr><td><div className="page-gap" /></td></tr></thead>
                        <tfoot><tr><td><div className="page-gap" /></td></tr></tfoot>
                        <tbody><tr><td>
                            {paras.map((p, i) => <p key={i} className="whitespace-pre-line text-justify" style={{ marginBottom: cq(1.6) }}>{p}</p>)}
                        </td></tr></tbody>
                    </table>
                </div>

                <div className="mt-auto flex items-end justify-between" style={{ gap: cq(3), paddingTop: cq(4) }}>
                    <div style={{ fontSize: cq(1.75), lineHeight: 1.5 }}>
                        {copies.length > 0 && (
                            <div style={{ marginBottom: cq(2) }}>
                                <div className="font-bold">प्रति लिपि:</div>
                                {copies.map((l, i) => <div key={i}>{l}</div>)}
                            </div>
                        )}
                        <div className="flex items-end" style={{ gap: cq(1.2) }}>
                            <img src={c.qr} alt="" style={{ width: cq(9), height: cq(9) }} />
                            <span style={{ fontSize: cq(1.15), color: '#6b7280', maxWidth: cq(14) }}>इस पत्र की जाँच हेतु QR स्कैन करें</span>
                        </div>
                    </div>
                    <div className="shrink-0 text-center" style={{ width: cq(30) }}>
                        {c.signatureUrl || c.org.signature
                            ? <img src={c.signatureUrl || c.org.signature} alt="" className="mx-auto object-contain" style={{ height: cq(8), maxWidth: cq(26) }} />
                            : <div style={{ height: cq(8) }} />}
                        {c.signOff && <div style={{ fontSize: cq(2) }}>{c.signOff}</div>}
                        <div className="font-extrabold" style={{ fontSize: cq(2.2), marginTop: cq(0.8) }}>{c.signatoryName}</div>
                        {c.signatoryTitle && <div className="whitespace-pre-line font-bold" style={{ fontSize: cq(1.9), lineHeight: 1.35 }}>{c.signatoryTitle}</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

function LetterBody({ c }) {
    const copies = (c.copies || '').split('\n').map((l) => l.trim()).filter(Boolean)
    const place = c.address || [c.district, c.state].filter(Boolean).join(', ')
    const rows = [
        c.relation && c.guardian && [RELATION_HI[c.relation] || c.relation, c.guardian],
        ['पद', `${c.post}${c.area ? ` (${c.area})` : ''}`],
        c.phone && ['फोन न.', c.phone],
        ['दिनांक', ddmmyyyy(c.issueDate)],
        place && ['पता', place],
    ].filter(Boolean)

    return (
        <div className="absolute inset-0 flex flex-col" style={{ fontSize: cq(1.95) }}>
            {/* Faint logo behind the text */}
            <img src="/logo.png" alt="" className="pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" style={{ width: cq(62) }} />

            <Letterhead c={c} />

            <div className="relative flex flex-1 flex-col" style={{ padding: `${cq(2.4)} ${cq(8)} 0` }}>
                <div className="flex justify-between font-bold" style={{ fontSize: cq(2) }}>
                    <span>Sr.No. <span className="font-semibold">{c.refNo}</span></span>
                    <span>Date: <span className="font-semibold">{ddmmyyyy(c.issueDate)}</span></span>
                </div>

                <h2 className="text-center font-extrabold" style={{ fontSize: cq(3.1), marginTop: cq(3) }}>नियुक्ति पत्र</h2>

                {c.preamble && <p className="text-justify" style={{ lineHeight: 1.6, marginTop: cq(2.6) }}>{c.preamble}</p>}

                <table style={{ marginTop: cq(2.6), lineHeight: 1.55 }}>
                    <tbody>
                        <tr><td colSpan="2" className="font-bold" style={{ fontSize: cq(2.15) }}>{c.name}</td></tr>
                        {rows.map(([k, v]) => (
                            <tr key={k}><td className="whitespace-nowrap align-top" style={{ paddingRight: cq(1.2) }}>{k}:</td><td className="font-semibold">{v}</td></tr>
                        ))}
                    </tbody>
                </table>

                <div className="whitespace-pre-line text-justify" style={{ lineHeight: 1.6, marginTop: cq(2.6), textIndent: cq(6) }}>{c.closing}</div>
                {c.validUntil && <p className="font-semibold" style={{ marginTop: cq(1) }}>यह नियुक्ति {day(c.validUntil, 'hi')} तक मान्य है।</p>}

                <div className="mt-auto flex items-end justify-between" style={{ gap: cq(3), paddingBottom: cq(5) }}>
                    <div style={{ fontSize: cq(1.75), lineHeight: 1.5 }}>
                        {copies.length > 0 && (
                            <>
                                <div className="font-bold">प्रति लिपि:</div>
                                {copies.map((l, i) => <div key={i}>{l}</div>)}
                            </>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center" style={{ width: cq(12) }}>
                        <img src={c.qr} alt="" style={{ width: cq(10), height: cq(10) }} />
                        <span className="text-center leading-tight" style={{ fontSize: cq(1.1), color: '#6b7280', marginTop: cq(0.4) }}>जाँच हेतु QR स्कैन करें</span>
                    </div>
                    <div className="shrink-0 text-center" style={{ width: cq(30) }}>
                        {c.signatureUrl || c.org.signature
                            ? <img src={c.signatureUrl || c.org.signature} alt="" className="mx-auto object-contain" style={{ height: cq(8), maxWidth: cq(26) }} />
                            : <div style={{ height: cq(8) }} />}
                        <div className="font-extrabold" style={{ fontSize: cq(2.3) }}>{c.signatoryName}</div>
                        <div className="whitespace-pre-line font-bold" style={{ fontSize: cq(1.95), lineHeight: 1.35 }}>{c.signatoryTitle}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Status({ c }) {
    const t = certType(c.type)
    if (c.status === 'revoked') {
        return (
            <div role="alert" className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
                <p className="text-lg font-extrabold">❌ यह {t.hi} निरस्त कर दिया गया है / This {t.en.toLowerCase()} has been cancelled</p>
                {c.revokeReason && <p className="mt-1">{c.revokeReason}</p>}
                <p className="mt-1 text-sm">Ref: {c.refNo}</p>
            </div>
        )
    }
    if (c.expired) {
        return (
            <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                <p className="text-lg font-extrabold">⏳ यह नियुक्ति {day(c.validUntil, 'hi')} को समाप्त हो चुकी है / This appointment ended on {day(c.validUntil)}</p>
                <p className="mt-1 text-sm">Ref: {c.refNo} · {c.name}</p>
            </div>
        )
    }
    return (
        <div className="mb-4 rounded-2xl border border-green-300 bg-green-50 p-4 text-green-900">
            <p className="text-lg font-extrabold">✅ असली और मान्य / Genuine and valid</p>
            {c.type === 'letter' ? (
                <p className="mt-1">यह पत्र {ORG_HI} द्वारा {day(c.issueDate, 'hi')} को जारी किया गया। · This letter was issued by {c.org.name} on {day(c.issueDate)}.</p>
            ) : <p className="mt-1">
                {c.name} का {t.hi} {ORG_HI} द्वारा {day(c.issueDate, 'hi')} को जारी किया गया। · {t.en} issued to {c.name} by {c.org.name} on {day(c.issueDate)}.
            </p>}
            <p className="mt-1 text-sm">Ref: {c.refNo}</p>
        </div>
    )
}

export default function Certificate() {
    const { token } = useParams()
    const [c, setC] = useState(null)
    const [missing, setMissing] = useState(false)

    useEffect(() => {
        api.get(`/certificates/public/${token}`).then(setC).catch(() => setMissing(true))
    }, [token])

    // The letter's heading font, loaded only on this page
    useEffect(() => {
        if (document.getElementById('yatra-font')) return
        const link = document.createElement('link')
        link.id = 'yatra-font'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Yatra+One&display=swap'
        document.head.appendChild(link)
    }, [])

    const print = () => (document.fonts?.ready || Promise.resolve()).then(() => window.print())

    if (missing) {
        return (
            <div className="mx-auto max-w-xl px-5 py-16 text-center">
                <p className="text-5xl" aria-hidden="true">⚠️</p>
                <p role="alert" className="mt-3 text-xl font-extrabold">यह प्रमाण पत्र नहीं मिला / Certificate not found</p>
                <p className="mt-2 text-navy/70">The link may be wrong, or the document may not have been issued by us.</p>
            </div>
        )
    }
    if (!c) return <Loading page />

    const landscape = isCertificate(c)
    return (
        <>
            <style>{printCss(c)}</style>
            <div className={`mx-auto px-4 py-8 ${landscape ? 'max-w-5xl' : 'max-w-3xl'}`}>
                <Status c={c} />
                <div className="mb-4 flex flex-wrap gap-2">
                    <button onClick={print} className="btn gap-2 bg-brand text-white">🖨️ प्रिंट / PDF सेव करें · Print or save as PDF</button>
                </div>
                <p className="mb-3 text-sm text-navy/60">
                    PDF के लिए: प्रिंट में "Save as PDF" चुनें। For a PDF, choose "Save as PDF" as the printer.
                </p>
                <div className="overflow-hidden rounded-lg shadow-xl ring-1 ring-navy/10">
                    <Paper c={c} />
                </div>
            </div>
            {createPortal(<div className="cert-print"><Paper c={c} /></div>, document.body)}
        </>
    )
}
