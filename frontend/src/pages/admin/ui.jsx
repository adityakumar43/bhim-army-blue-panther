import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'


const PAGE_ICON = {
  '/admin/news': 'news', '/admin/events': 'calendar', '/admin/gallery': 'image', '/admin/slides': 'layers',
  '/admin/leaders': 'award', '/admin/updates': 'bell', '/admin/members': 'userPlus', '/admin/messages': 'chat',
  '/admin/donations': 'heart', '/admin/team': 'users', '/admin/security': 'shield', '/admin/activity': 'activity', '/admin/backup': 'download', '/admin/helpdesk': 'help', '/admin/volunteers': 'hand', '/admin/downloads': 'download', '/admin/videos': 'video', '/admin/certificates': 'award', '/admin/mailouts': 'mail', '/admin/growth': 'trend', '/admin/notifications': 'phone', '/admin/visitors': 'eye', '/admin/print-cards': 'userPlus', '/admin/checkin': 'ticket',
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
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
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


// Grey boxes in the shape of a list while it loads, so the page does not look empty
export function ListLoading({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-4">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden="true" className="card flex animate-pulse items-start gap-4 p-4 motion-reduce:animate-none sm:p-5">
          <span className="h-12 w-12 shrink-0 rounded-xl bg-navy/[0.07]" />
          <span className="flex flex-1 flex-col gap-2.5 pt-1">
            <span className="h-4 w-2/5 rounded bg-navy/[0.08]" />
            <span className="h-3 w-4/5 rounded bg-navy/[0.06]" />
            <span className="h-3 w-3/5 rounded bg-navy/[0.06]" />
          </span>
        </div>
      ))}
    </div>
  )
}
