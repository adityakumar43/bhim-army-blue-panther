import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api.js'
import { IdCard } from '../Card.jsx'
import { PageHeader, Notice, ListLoading } from './ui.jsx'

export const PRINT_KEY = 'printCards' // the Members page leaves the chosen members here
const PER_PAGE = 10 // 2 across and 5 down fit on A4 at the real size of an ID card

// Only the sheets are printed; everything else on the screen is hidden
const PRINT = `.cards-print{display:none}
@media print{
  @page{size:A4 portrait;margin:8mm 10mm}
  html,body{background:#fff !important}
  #root{display:none !important}
  .cards-print{display:block}
  .cards-sheet{break-after:page}
  .cards-sheet:last-child{break-after:auto}
}`

// One A4 sheet: up to 10 cards at 85.6 × 54 mm, with a thin grey line to cut along
function Sheet({ cards, t, lang }) {
    return (
        <div className="cards-sheet grid grid-cols-[85.6mm_85.6mm] content-start justify-center gap-x-[4mm] gap-y-[2mm]">
            {cards.map((c) => (
                <div key={c._id} style={{ width: '85.6mm', outline: '0.2mm dashed #cbd5e1', outlineOffset: '0.6mm' }}
                    className="[&_.id-card]:rounded-none [&_.id-card]:shadow-none">
                    <IdCard card={c} t={t} lang={lang} />
                </div>
            ))}
        </div>
    )
}

// Printing many membership cards at once, for members without a smartphone
export default function PrintCards() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const [cards, setCards] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let ids = []
        try { ids = JSON.parse(sessionStorage.getItem(PRINT_KEY) || '[]') } catch { /* nothing chosen */ }
        if (!ids.length) { setCards([]); return }
        api.post('/members/cards', { ids }).then(setCards).catch((e) => { setError(e.message); setCards([]) })
    }, [])

    const sheets = []
    for (let i = 0; i < (cards || []).length; i += PER_PAGE) sheets.push(cards.slice(i, i + PER_PAGE))

    return (
        <>
            <style>{PRINT}</style>
            <PageHeader title="Print Membership Cards" subtitle="10 cards on each A4 sheet, at the real size of an ID card. Cut along the dotted lines and laminate.">
                {cards?.length > 0 && <button onClick={() => window.print()} className="abtn-primary">🖨️ Print {cards.length} {cards.length === 1 ? 'card' : 'cards'}</button>}
            </PageHeader>
            <Notice>{error}</Notice>
            {!cards && <ListLoading />}
            {cards?.length === 0 && !error && (
                <div className="card text-center text-navy/70">
                    <p>📭 No cards chosen.</p>
                    <p className="mt-1 text-sm">On the <Link to="/admin/members" className="font-semibold text-brand underline">Members</Link> page, open the <b>Approved</b> tab, tick the members (or use the filters), then press <b>Print cards</b>.</p>
                </div>
            )}

            {cards?.length > 0 && (
                <>
                    <div className="mb-5 grid gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-4 text-sm sm:grid-cols-3">
                        <p>📄 <b>{sheets.length}</b> A4 {sheets.length === 1 ? 'sheet' : 'sheets'}. Thicker paper (card sheet, 200–300 gsm) gives the best cards.</p>
                        <p>⚙️ In the print box choose <b>Scale: 100%</b> (or "Actual size") and turn on <b>Background graphics</b>, or the colours will be missing.</p>
                        <p>✂️ Cut along the dotted lines. Laminating makes the card last for years, and the QR code still scans.</p>
                    </div>

                    {/* What will be printed, page by page */}
                    <div className="flex flex-col items-center gap-6 overflow-x-auto pb-4">
                        {sheets.map((group, i) => (
                            <div key={i} className="shrink-0 bg-white p-[8mm] shadow-lg ring-1 ring-navy/10" style={{ width: '210mm', minHeight: '297mm' }}>
                                <p className="mb-2 text-right text-xs text-navy/40">Sheet {i + 1} of {sheets.length}</p>
                                <Sheet cards={group} t={t} lang={lang} />
                            </div>
                        ))}
                    </div>

                    {createPortal(<div className="cards-print">{sheets.map((group, i) => <Sheet key={i} cards={group} t={t} lang={lang} />)}</div>, document.body)}
                </>
            )}
        </>
    )
}
