import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'
import Icon from '../../components/Icon.jsx'
import { stateByCode } from '../../data/states.js'


const NAV = [
  { to: '/admin', label: 'Overview', icon: 'grid', end: true },
  { to: '/admin/news', label: 'News', icon: 'news', perm: 'content' },
  { to: '/admin/events', label: 'Events', icon: 'calendar', perm: 'content' },
  { to: '/admin/gallery', label: 'Gallery', icon: 'image', perm: 'content' },
  { to: '/admin/slides', label: 'Home slider', icon: 'layers', perm: 'content' },
  { to: '/admin/leaders', label: 'Leadership', icon: 'award', perm: 'leaders' },
  { to: '/admin/videos', label: 'Videos', icon: 'video', perm: 'content' },
  { to: '/admin/downloads', label: 'Downloads', icon: 'download', perm: 'content' },
  { to: '/admin/updates', label: 'Home updates', icon: 'bell', perm: 'content' },
  { to: '/admin/members', label: 'Members', icon: 'userPlus', perm: 'members', badge: 'members' },
  { to: '/admin/growth', label: 'Member growth', icon: 'trend', perm: 'members' },
  { to: '/admin/volunteers', label: 'Volunteers', icon: 'hand', perm: 'members', badge: 'volunteers' },
  { to: '/admin/mailouts', label: 'Email members', icon: 'mail', perm: 'members' },
  { to: '/admin/certificates', label: 'Certificates', icon: 'award', perm: 'members' },
  { to: '/admin/messages', label: 'Messages', icon: 'chat', perm: 'messages', badge: 'messages' },
  { to: '/admin/helpdesk', label: 'Help desk', icon: 'help', perm: 'helpdesk', badge: 'helpdesk' },
  { to: '/admin/donations', label: 'Donations', icon: 'heart', perm: 'donations', badge: 'donations' },
  { to: '/admin/team', label: 'Team & roles', icon: 'users', perm: 'admins' },
  { to: '/admin/activity', label: 'Activity log', icon: 'activity', perm: 'admins' },
  { to: '/admin/backup', label: 'Backup', icon: 'download', perm: 'admins' },
  { to: '/admin/security', label: 'Security', icon: 'shield' },
]

// Shown while the admin panel finds out who is logged in: the panel's own shape in grey,
// so it feels like the page is already there and only the details are coming
function AdminLoading() {
  const bar = 'animate-pulse rounded-lg bg-navy/[0.07] motion-reduce:animate-none'
  return (
    <div className="min-h-screen bg-[#F3F6FC]" role="status" aria-live="polite">
      <span className="sr-only">Opening the admin panel…</span>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-white shadow-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <strong className="truncate">Bhim Army Blue Panther</strong>
          <span className="hidden rounded-md bg-gold px-2 py-0.5 text-xs font-extrabold text-navy sm:inline">ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 animate-pulse rounded-full bg-white/15 motion-reduce:animate-none" />
          <span className="hidden h-4 w-24 animate-pulse rounded bg-white/15 motion-reduce:animate-none md:block" />
        </div>
      </header>
      <div className="mx-auto flex max-w-350 flex-col lg:flex-row">
        <nav aria-hidden="true" className="hidden border-r border-brand/15 bg-white p-3 lg:block lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex min-h-10 items-center gap-3 px-3">
              <span className={`h-[18px] w-[18px] shrink-0 ${bar}`} />
              <span className={`h-3.5 ${bar}`} style={{ width: `${55 + ((i * 37) % 40)}%` }} />
            </div>
          ))}
        </nav>
        <main aria-hidden="true" className="min-w-0 flex-1 p-4 sm:p-6 lg:px-8">
          <div className="flex h-[92px] items-center gap-4 rounded-2xl bg-gradient-to-r from-navy to-brand px-6">
            <span className="h-11 w-11 shrink-0 animate-spin rounded-full border-4 border-white/20 border-t-gold motion-reduce:animate-none" />
            <span className="font-semibold text-white/85">Opening the admin panel…</span>
          </div>
          <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(14rem,1fr))]">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex h-[110px] items-center gap-4 rounded-2xl border border-brand/10 bg-white p-4 shadow-sm">
                <span className={`h-12 w-12 shrink-0 rounded-xl ${bar}`} />
                <span className="flex flex-1 flex-col gap-2">
                  <span className={`h-6 w-10 ${bar}`} />
                  <span className={`h-3.5 w-4/5 ${bar}`} />
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [me, setMe] = useState(null)
  const [summary, setSummary] = useState({ members: 0, messages: 0, donations: 0, helpdesk: 0, volunteers: 0 })

  const refresh = () => api.get('/admin/summary').then(setSummary).catch(() => { })

  const refreshMe = () => api.get('/auth/me').then((r) => setMe(r.admin)).catch(() => { })
  useEffect(() => { refreshMe() }, [])

  // Roles that must use two-step login can only open the Security page until they have set it up
  const locked = !!me && me.twoFactorRequired && !me.twoFactorEnabled
  useEffect(() => {
    if (locked && pathname !== '/admin/security') navigate('/admin/security', { replace: true })
  }, [locked, pathname])

  // Check for new items now, then every 30 seconds while the panel is open
  useEffect(() => {
    if (!me || locked) return
    refresh()
    const id = setInterval(() => { if (!document.hidden) refresh() }, 30000)
    return () => clearInterval(id)
  }, [me])


  useEffect(() => {
    if (me?.permissions.includes('donations') && pathname === '/admin/donations') {
      api.post('/admin/seen/donations').then(refresh).catch(() => { })
    }
  }, [pathname, me])

  const total = summary.members + summary.messages + summary.donations + (summary.helpdesk || 0) + (summary.volunteers || 0)
  useEffect(() => {
    document.title = total > 0 ? `(${total}) Admin Panel` : 'Admin Panel'
    return () => { document.title = 'Bhim Army Blue Panther' }
  }, [total])

  function logout() {
    localStorage.removeItem('token')
    navigate('/admin/login')
  }

  if (!me) return <AdminLoading />
  const items = NAV.filter((n) => (locked ? n.to === '/admin/security' : !n.perm || me.permissions.includes(n.perm)))

  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-white shadow-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <strong className="truncate">Bhim Army Blue Panther</strong>
          <span className="hidden rounded-md bg-gold px-2 py-0.5 text-xs font-extrabold text-navy sm:inline">ADMIN</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <div className="hidden items-center gap-2 md:flex">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-extrabold text-white ring-2 ring-gold/70">
              {me.name?.[0]?.toUpperCase()}
            </span>
            <span className="max-w-48 leading-tight">
              <span className="block truncate font-semibold">{me.name}</span>
              <span className="block truncate text-xs text-white/60">{ROLE_INFO[me.role]?.label}{me.state ? ` · ${stateByCode(me.state)?.en}` : ''}</span>
            </span>
          </div>
          <Link to="/" title="View site" className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 font-semibold text-white/85 hover:bg-white/10 hover:text-white">
            <Icon name="external" size={16} /><span className="hidden sm:inline">View site</span>
          </Link>
          <button onClick={logout} title="Log out" className="flex h-9 items-center gap-1.5 rounded-lg border border-white/25 px-3 font-semibold hover:border-red-300 hover:bg-red-500/15">
            <Icon name="logout" size={16} /><span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-350 flex-col lg:flex-row">
        <nav aria-label="Admin" className="border-b border-brand/15 bg-white lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
          <ul className="admin-nav flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:flex-col lg:gap-0.5 lg:overflow-x-visible lg:overflow-y-auto lg:overscroll-contain lg:p-3">
            {items.map((n) => {
              const count = n.badge ? summary[n.badge] : 0
              return (
                <li key={n.to} className="shrink-0">
                  <NavLink to={n.to} end={n.end}
                    className={({ isActive }) =>
                      `group flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold whitespace-nowrap transition ${isActive ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/75 hover:bg-mist hover:text-brand'}`}>
                    <Icon name={n.icon} size={18} className="shrink-0" />
                    <span className="flex-1">{n.label}</span>
                    {count > 0 && (
                      <span className="min-w-6 rounded-full bg-gold px-1.5 text-center text-xs leading-6 font-extrabold text-navy">{count}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <main className="admin-main min-w-0 flex-1 p-4 sm:p-6 lg:px-8">
          {(!locked || pathname === '/admin/security') && <Outlet context={{ me, summary, refresh, refreshMe }} />}
        </main>
      </div>
    </div>
  )
}
