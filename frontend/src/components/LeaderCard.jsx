import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { large } from '../lib/img.js'

// First letters of the name, shown when there is no photo
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// hideArea: inside a district's own section the district name is already the heading
// wide: the photo sits on the left and the text on the right (for a small state team)
export default function LeaderCard({ leader, hideArea = false, wide = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [broken, setBroken] = useState(false)
  const name = pickText(leader, 'name', lang)
  const role = pickText(leader, 'role', lang)
  const area = pickText(leader, 'area', lang)

  return (
    // h-full + flex: cards in a row are the same height and the text starts at the same place in each
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm ${wide ? 'flex-row items-center' : ''}`}>
      {leader.photo && !broken
        // Leader photos are often posters with the name printed at the bottom, so they are never cropped:
        // the whole picture is shown (Cloudinary c_limit) in a frame of the posters' usual shape (7:8)
        ? <img src={large(leader.photo, 500)} alt={name} loading="lazy" onError={() => setBroken(true)}
          className={`aspect-7/8 bg-white object-contain ${wide ? 'w-32 shrink-0 sm:w-44' : 'w-full'}`} />
        : <div aria-hidden="true" className={`flex aspect-7/8 items-center justify-center bg-navy text-4xl font-extrabold text-white/80 ${wide ? 'w-32 shrink-0 sm:w-44' : 'w-full'}`}>{initials(name)}</div>}
      <div className={`flex-1 p-4 text-center ${wide ? 'flex-none text-left sm:p-6' : ''}`}>
        <h4 className={`font-extrabold ${wide ? 'text-lg sm:text-2xl' : ''}`}>{name}</h4>
        {role && <p className={`text-sm font-semibold text-brand ${wide ? 'sm:mt-1 sm:text-base' : ''}`}>{role}</p>}
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