import { Link, useOutletContext } from 'react-router-dom'
import { ROLE_INFO } from '../../lib/roles.js'
import Icon from '../../components/Icon.jsx'
import Stats from './Stats.jsx'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const { me, summary } = useOutletContext()
  const can = (p) => me.permissions.includes(p)
  const role = ROLE_INFO[me.role]
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // [permission, link, label, count, emoji, tile colour]
  const alerts = [
    ['members', '/admin/members', 'Membership applications waiting', summary.members, '📝', 'bg-blue-100'],
    ['messages', '/admin/messages', 'Unread messages', summary.messages, '✉️', 'bg-amber-100'],
    ['donations', '/admin/donations', 'New donations', summary.donations, '💝', 'bg-rose-100'],
  ].filter(([perm]) => can(perm))

  // [permission, link, label, icon]
  const actions = [
    ['content', '/admin/news', 'Publish news', 'news'],
    ['content', '/admin/events', 'Add an event', 'calendar'],
    ['content', '/admin/gallery', 'Upload photos', 'image'],
    ['content', '/admin/slides', 'Home slider', 'layers'],
    ['content', '/admin/updates', 'Home updates', 'bell'],
    ['admins', '/admin/team', 'Team & roles', 'users'],
  ].filter(([perm]) => can(perm))

  return (
    <>
      {/* Welcome banner */}
      <section className="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-navy to-brand px-5 py-4 text-white shadow-lg sm:px-6">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-extrabold sm:text-2xl">{greeting()}, {me.name} 👋</h1>
          <p className="text-sm text-white/70">📅 {today}</p>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-navy">{role?.label}</span>
          {role?.desc}
        </p>
      </section>

      {!me.twoFactorEnabled && (
        <Link to="/admin/security" className="mb-5 flex items-center gap-3 rounded-2xl border border-gold bg-gold/15 px-4 py-3 font-semibold hover:bg-gold/25">
          <span className="text-xl" aria-hidden="true">🔐</span>
          <span className="flex-1">Your account is protected by a password only. Turn on two-step login</span>
          <Icon name="arrow" size={18} className="shrink-0" />
        </Link>
      )}

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map(([perm, to, label, n, emoji, tile]) => (
            <Link key={perm} to={to} className="group flex items-center gap-4 rounded-2xl border border-brand/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md">
              <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${tile}`}>{emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`text-3xl leading-none font-extrabold ${n > 0 ? 'text-brand' : 'text-navy/35'}`}>{n}</span>
                  {n > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">New</span>}
                </span>
                <span className="mt-1 block text-sm leading-snug font-semibold text-navy/75">{label}</span>
              </span>
              <Icon name="arrow" size={18} className="shrink-0 text-brand opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-extrabold">⚡ Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {actions.map(([perm, to, label, icon]) => (
              <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-brand/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon name={icon} size={20} />
                </span>
                <span className="text-sm leading-tight font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      <Stats />
    </>
  )
}
