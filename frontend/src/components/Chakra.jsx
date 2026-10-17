// 24-spoke wheel, drawn as a faint background motif.
export default function Chakra({ className = '' }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180
    return (
      <line key={i}
        x1={50 + Math.cos(a) * 9} y1={50 + Math.sin(a) * 9}
        x2={50 + Math.cos(a) * 46} y2={50 + Math.sin(a) * 46} />
    )
  })
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2"
      className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="9" />
      {spokes}
    </svg>
  )
}
