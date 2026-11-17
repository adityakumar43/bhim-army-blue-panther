import { inspirations } from '../data/inspirations.js'
import InspirationCard from '../components/InspirationCard.jsx'

// All inspirational leaders, at /inspirations. The title band comes from PageBand.
export default function Inspirations() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16 lg:py-14">
      {/* Phones: two small cards per row (photo, name, title); the full text is on each leader's page */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {inspirations.map((p) => <InspirationCard key={p.slug} person={p} level={2} compact />)}
      </div>
    </div>
  )
}
