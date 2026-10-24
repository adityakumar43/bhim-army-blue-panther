import { inspirations } from '../data/inspirations.js'
import InspirationCard from '../components/InspirationCard.jsx'

// All inspirational leaders, at /inspirations. The title band comes from PageBand.
export default function Inspirations() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-16 lg:py-14">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {inspirations.map((p) => <InspirationCard key={p.slug} person={p} />)}
      </div>
    </div>
  )
}
