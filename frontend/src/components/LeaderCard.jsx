import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { portrait } from '../lib/img.js'

// First letters of the name, shown when there is no photo
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// hideArea: inside a district's own section the district name is already the heading
export default function LeaderCard({ leader, hideArea = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [broken, setBroken] = useState(false)
  const name = pickText(leader, 'name', lang)
  const role = pickText(leader, 'role', lang)
  const area = pickText(leader, 'area', lang)

  return (
    <article className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      {leader.photo && !broken
        ? <img src={portrait(leader.photo, 400)} alt={name} loading="lazy" onError={() => setBroken(true)}
          className="aspect-3/4 w-full bg-mist object-cover object-top" />
        : <div aria-hidden="true" className="flex aspect-3/4 w-full items-center justify-center bg-navy text-4xl font-extrabold text-white/80">{initials(name)}</div>}
      <div className="p-4 text-center">
        <h4 className="font-extrabold">{name}</h4>
        {role && <p className="text-sm font-semibold text-brand">{role}</p>}
        {area && !hideArea && <p className="text-sm text-navy/70">{area}</p>}
        {leader.phone && (
          <a href={`tel:${leader.phone.replace(/[\s-]/g, '')}`} className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-brand underline">
            {leader.phone}
          </a>
        )}
      </div>
    </article>
  )
}