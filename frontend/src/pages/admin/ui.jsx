import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'


const PAGE_ICON = {
  '/admin/news': 'news', '/admin/events': 'calendar', '/admin/gallery': 'image', '/admin/slides': 'layers',
  '/admin/leaders': 'award', '/admin/updates': 'bell', '/admin/members': 'userPlus', '/admin/messages': 'chat',
  '/admin/donations': 'heart', '/admin/team': 'users', '/admin/security': 'shield', '/admin/activity': 'activity', '/admin/backup': 'download',
}

// Page title card. The icon is picked from the page address, so pages don't need to pass one.
export function PageHeader({ title, subtitle, children }) {
  const { pathname } = useLocation()
  const icon = PAGE_ICON[pathname]
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/10 bg-white px-4 py-3 shadow-sm sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
            <Icon name={icon} size={22} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-navy/65">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null
  const error = kind === 'error'
  return (
    <p role={error ? 'alert' : 'status'}
      className={`mb-4 flex items-start gap-2 rounded-xl border p-3 ${error ? 'border-red-200 bg-red-50 text-red-900' : 'border-green-200 bg-green-50 text-green-900'}`}>
      <span aria-hidden="true">{error ? '⚠️' : '✅'}</span>
      <span>{children}</span>
    </p>
  )
}

const TONES = {
  blue: 'bg-mist text-brand',
  gold: 'bg-gold/30 text-navy',
  green: 'bg-green-100 text-green-900',
  red: 'bg-red-100 text-red-900',
  gray: 'bg-navy/10 text-navy',
}

export function Pill({ tone = 'blue', children }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>
}
