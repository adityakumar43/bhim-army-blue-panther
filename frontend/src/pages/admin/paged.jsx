// "Load older ..." under a long admin list (the rows come from usePaged.js)
export function LoadMore({ more, busy, onClick, count, noun }) {
  if (!more) return null
  return (
    <div className="mt-5 flex flex-col items-center gap-1.5 text-center">
      <button onClick={onClick} disabled={busy} className="abtn min-h-10 px-5">{busy ? 'Loading…' : `⬇️ Load older ${noun}`}</button>
      <p className="text-xs text-navy/65">{count} {noun} loaded. Search, filters, counts and downloads cover only the loaded ones.</p>
    </div>
  )
}
