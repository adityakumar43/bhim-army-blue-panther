import Chakra from './Chakra.jsx'

// Shown in place of a photo on a news or event card that has none: the day in big figures and the month,
// like a calendar page. Every card then looks a little different, instead of a row of the same blue box.
// className sets the size, shape and position (the same classes the photo would have, plus `relative` or
// `absolute`, which the big date and the wheel in the corner need); big = the larger featured card.
export default function DateTile({ date, lang, big = false, className = '' }) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return <span aria-hidden="true" className={`bg-linear-to-br from-navy to-brand ${className}`} />
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const part = (o) => d.toLocaleDateString(locale, { timeZone: 'Asia/Kolkata', ...o })
  return (
    <span aria-hidden="true" className={`flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-navy to-brand text-white ${className}`}>
      <Chakra className={`pointer-events-none absolute text-white/10 ${big ? '-right-10 -bottom-14 h-56 w-56' : '-right-8 -bottom-12 h-36 w-36 max-sm:hidden'}`} />
      <span className={`relative leading-none font-extrabold ${big ? 'text-7xl sm:text-8xl' : 'text-3xl sm:text-6xl'}`}>{part({ day: 'numeric' })}</span>
      <span className={`relative mt-1 font-bold text-gold ${big ? 'text-xl sm:text-2xl' : 'text-xs sm:text-lg'}`}>{part({ month: 'long' })}</span>
      <span className={`relative text-white/75 ${big ? 'text-base' : 'text-[11px] sm:text-sm'}`}>{part({ year: 'numeric' })}</span>
    </span>
  )
}
