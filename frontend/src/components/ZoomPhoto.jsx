import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickText } from '../lib/text.js'
import { cdn } from '../lib/img.js'
import Lightbox from './Lightbox.jsx'
import ZoomBadge from './ZoomBadge.jsx'

// A news or event picture that opens in the full-screen viewer when clicked
export default function ZoomPhoto({ item, width = 1000, className = '', buttonClassName = '' }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [broken, setBroken] = useState(false)
  const button = useRef(null)
  const wasOpen = useRef(false)

  // When the viewer closes, keyboard focus goes back to the picture
  useEffect(() => {
    if (open) wasOpen.current = true
    else if (wasOpen.current) {
      wasOpen.current = false
      button.current?.focus()
    }
  }, [open])

  if (broken) return null // a picture that cannot load leaves no empty button behind

  return (
    <>
      <button type="button" ref={button} onClick={() => setOpen(true)}
        aria-label={`${t('gallery.viewLarger')}: ${pickText(item, 'title', i18n.language)}`}
        className={`group relative block w-full cursor-zoom-in ${buttonClassName}`}>
        <img src={cdn(item.image.url, width)} alt="" loading="lazy" onError={() => setBroken(true)}
          className={`${className} motion-safe:transition group-hover:brightness-90`} />
        <ZoomBadge />
      </button>
      {open && <Lightbox items={[item]} index={0} onIndex={() => { }} onClose={() => setOpen(false)} />}
    </>
  )
}