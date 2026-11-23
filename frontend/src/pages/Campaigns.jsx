import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon.jsx'
import { campaigns } from '../data/compaigns.js'
import { pickText } from '../lib/text.js'

const dots = { backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }

// One campaign: a coloured strip with its icon, the text (long text folds to 4 lines), and a way to help
function Campaign({ c }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const body = pickText(c, 'body', i18n.language)
  const long = body.length > 220
  return (
    <article id={`campaign-${c.id}`} className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      <div className={`relative flex h-28 items-center gap-4 bg-linear-to-br px-6 text-white sm:h-32 ${c.tone || 'from-navy to-brand'}`}>
        <div className="pointer-events-none absolute inset-0" style={dots} aria-hidden="true" />
        {c.icon && <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-gold ring-1 ring-white/25" aria-hidden="true"><Icon name={c.icon} size={34} /></span>}
        <h2 className="relative text-2xl leading-snug font-extrabold text-balance">{pickText(c, 'title', i18n.language)}</h2>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p id={`campaign-${c.id}-text`} className={`text-lg ${long && !open ? 'line-clamp-4' : ''}`}>{body}</p>
        {long && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`campaign-${c.id}-text`}
            className="mt-2 inline-flex min-h-10 items-center self-start font-bold text-brand underline-offset-4 hover:underline">
            {open ? t('campaigns.less', { defaultValue: 'Show less' }) : t('campaigns.more', { defaultValue: 'Read more' })}
          </button>
        )}
        <div className="flex-1" />
        {/* Give time to this work: the Volunteer form opens with this campaign's kind of help already ticked */}
        <Link to={c.skill ? `/volunteer?skill=${c.skill}` : '/volunteer'} className="mt-5 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg border-2 border-brand px-4 font-bold text-brand hover:bg-brand hover:text-white">
          <Icon name="hand" size={18} />{t('campaigns.volunteer', { defaultValue: 'Volunteer for this campaign' })} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default function Campaigns() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-10">
      {/* 2 across from tablets up, so 4 campaigns make an even 2 x 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns.map((c) => <Campaign key={c.id} c={c} />)}
      </div>
    </div>
  )
}
