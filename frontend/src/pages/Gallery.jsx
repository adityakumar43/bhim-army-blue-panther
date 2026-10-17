import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import { pickText } from '../lib/text.js'

export default function Gallery() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/gallery').then(setItems).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="px-5 py-16 text-center text-red-700">{error}</p>
  if (!items) return <p className="px-5 py-16 text-center">{t('loading')}</p>

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-16">
      <h1 className="mb-8 text-4xl font-extrabold">{t('nav.gallery')}</h1>
      {items.length === 0 && <p className="text-navy/70">{t('empty')}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <figure key={it._id}>
            <img src={it.image.url} alt={pickText(it, 'title', i18n.language)} loading="lazy"
              className="aspect-4/3 w-full object-cover" />
            {(it.titleHi || it.titleEn) && (
              <figcaption className="mt-2 text-sm">{pickText(it, 'title', i18n.language)}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  )
}
