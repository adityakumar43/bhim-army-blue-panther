import { socialLinks } from '../lib/orgInfo.js'

const NAMES = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', x: 'X (Twitter)', whatsapp: 'WhatsApp', linkedin: 'LinkedIn' }
// Small line drawings, in the same style as the other icons of the site
const ICONS = {
  facebook: ['M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z'],
  instagram: ['M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M17.5 6.5h.01'],
  youtube: ['M6 5h12a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z', 'M10 9l5 3-5 3z'],
  x: ['M4 4l16 16', 'M20 4L4 20'],
  whatsapp: ['M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z', 'M9 9.5c0 3 2.5 5.5 5.5 5.5'],
  linkedin: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 11v6M8 7.5v.01M12 17v-3.5a2 2 0 0 1 4 0V17M12 11v6'],
}

// Buttons to the organisation's social media pages (the links are in lib/orgInfo.js).
// dark: for the dark footer. With no link filled in, nothing is shown.
export default function SocialLinks({ dark = false }) {
  const links = socialLinks()
  if (links.length === 0) return null
  const look = dark ? 'border-white/20 text-white/85 hover:border-gold hover:text-gold' : 'border-navy/15 bg-white text-navy hover:border-brand hover:text-brand'
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Social media">
      {links.map(([key, url]) => (
        <li key={key}>
          <a href={url} target="_blank" rel="noopener noreferrer me" className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${look}`}>
            {ICONS[key] && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[key].map((d) => <path key={d} d={d} />)}
              </svg>
            )}
            {NAMES[key] || key}
          </a>
        </li>
      ))}
    </ul>
  )
}
