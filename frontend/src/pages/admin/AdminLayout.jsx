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
  { to: '/admin/slides', label: 'Home Slider', icon: 'layers', perm: 'content' },
  { to: '/admin/leaders', label: 'Leadership', icon: 'award', perm: 'leaders' },
  { to: '/admin/videos', label: 'Videos', icon: 'video', perm: 'content' },
  { to: '/admin/downloads', label: 'Downloads', icon: 'download', perm: 'content' },
  { to: '/admin/updates', label: 'Home Updates', icon: 'bell', perm: 'content' },
  { to: '/admin/notifications', label: 'Phone Notifications', icon: 'phone', perm: 'content' },
  { to: '/admin/members', label: 'Members', icon: 'userPlus', perm: ['members', 'district'], badge: 'members' },
  { to: '/admin/growth', label: 'Member Growth', icon: 'trend', perm: 'members' },
  { to: '/admin/visitors', label: 'Visitors', icon: 'eye', perm: ['content', 'members'] },
  { to: '/admin/volunteers', label: 'Volunteers', icon: 'hand', perm: ['members', 'district'], badge: 'volunteers' },
  { to: '/admin/mailouts', label: 'Email Members', icon: 'mail', perm: 'members' },
  { to: '/admin/certificates', label: 'Certificates', icon: 'award', perm: 'members' },
  { to: '/admin/messages', label: 'Messages', icon: 'chat', perm: 'messages', badge: 'messages' },
  { to: '/admin/helpdesk', label: 'Help Desk', icon: 'help', perm: ['helpdesk', 'district'], badge: 'helpdesk' },
  { to: '/admin/donations', label: 'Donations', icon: 'heart', perm: 'donations', badge: 'donations' },
  { to: '/admin/team', label: 'Team & Roles', icon: 'users', perm: 'team' },
  { to: '/admin/activity', label: 'Activity Log', icon: 'activity', perm: 'admins' },
  { to: '/admin/backup', label: 'Backup', icon: 'download', perm: 'admins' },
  { to: '/admin/security', label: 'Security', icon: 'shield' },
]

// On phones these sit in the bar at the bottom (the first 4 a person can open); the rest are under "More"
const PHONE_TABS = ['/admin', '/admin/members', '/admin/helpdesk', '/admin/events', '/admin/messages', '/admin/news', '/admin/team', '/admin/security']
const SHORT = { '/admin': 'Home', '/admin/helpdesk': 'Help Desk', '/admin/members': 'Members', '/admin/team': 'Team' }

// The bar at the bottom of the screen on phones, like an app
function PhoneTabs({ tabs, more, summary, moreOpen, setMoreOpen }) {
  const moreCount = more.reduce((s, n) => s + (n.badge ? summary[n.badge] || 0 : 0), 0)
  const tab = 'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition'
  const dot = (n) => n > 0 && <span className="absolute top-1.5 left-1/2 ml-1.5 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] leading-5 text-white ring-2 ring-white">{n > 99 ? '99+' : n}</span>
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(11,31,77,0.08)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl">
        {tabs.map((n) => (
          <li key={n.to} className="flex flex-1">
            <NavLink to={n.to} end={n.end} onClick={() => setMoreOpen(false)}
              className={({ isActive }) => `${tab} ${isActive && !moreOpen ? 'text-brand' : 'text-navy/55'}`}>
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive && !moreOpen ? 'bg-brand/12' : ''}`}><Icon name={n.icon} size={20} /></span>
                  <span className="max-w-full truncate px-0.5">{SHORT[n.to] || n.label}</span>
                  {dot(n.badge ? summary[n.badge] : 0)}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className={`${tab} ${moreOpen ? 'text-brand' : 'text-navy/55'}`}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${moreOpen ? 'bg-brand/12' : ''}`}><Icon name={moreOpen ? 'close' : 'menu'} size={20} /></span>
            <span>More</span>
            {!moreOpen && dot(moreCount)}
          </button>
        </li>
      </ul>
    </nav>
  )
}

// "More" on phones: every other page as a tile, plus who is logged in, View site and Log out
function MoreSheet({ me, items, summary, onClose, logout }) {
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = '' }
  }, [])
  return (
    <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="All admin pages">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto overscroll-contain rounded-t-3xl bg-[#F3F6FC] px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <span aria-hidden="true" className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-navy/15" />
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white ring-2 ring-gold/70">{me.name?.[0]?.toUpperCase()}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block truncate">{me.name}</b>
            <span className="block truncate text-xs text-navy/60">{ROLE_INFO[me.role]?.label}{me.district ? ` · ${me.district}` : ''}{me.state ? ` · ${stateByCode(me.state)?.en}` : ''}</span>
          </span>
          <button onClick={logout} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50">
            <Icon name="logout" size={16} />Log out
          </button>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((n) => {
            const count = n.badge ? summary[n.badge] : 0
            return (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} onClick={onClose}
                  className={({ isActive }) => `relative flex h-full min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center text-xs leading-tight font-bold shadow-sm transition ${isActive ? 'bg-brand text-white' : 'bg-white text-navy/80 active:bg-mist'}`}>
                  <Icon name={n.icon} size={22} />
                  <span>{n.label}</span>
                  {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] leading-5 text-white">{count}</span>}
                </NavLink>
              </li>
            )
          })}
          <li>
            <Link to="/" className="flex h-full min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-2 text-center text-xs font-bold text-navy/80 shadow-sm">
              <Icon name="external" size={22} /><span>View site</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

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
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => setMoreOpen(false), [pathname])
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
  const items = NAV.filter((n) => (locked ? n.to === '/admin/security' : !n.perm || [].concat(n.perm).some((p) => me.permissions.includes(p))))
  // Phones: up to 4 main pages in the bottom bar; the rest, and Log out, are under "More"
  const tabs = items.length <= 4 ? items : PHONE_TABS.map((to) => items.find((n) => n.to === to)).filter(Boolean).slice(0, 4)
  const more = items.filter((n) => !tabs.includes(n))

  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-white shadow-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          {/* Phones: the role in small gold letters under the name; bigger screens: a gold badge beside it */}
          <div className="min-w-0 leading-tight sm:flex sm:items-center sm:gap-3">
            <strong className="block truncate">Bhim Army Blue Panther</strong>
            <span className="block truncate text-xs font-bold text-gold sm:shrink-0 sm:rounded-md sm:bg-gold sm:px-2 sm:py-0.5 sm:font-extrabold sm:text-navy">{ROLE_INFO[me.role]?.label || 'Admin'}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <div className="hidden items-center gap-2 md:flex">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-extrabold text-white ring-2 ring-gold/70">
              {me.name?.[0]?.toUpperCase()}
            </span>
            <span className="max-w-48 leading-tight">
              <span className="block truncate font-semibold">{me.name}</span>
              <span className="block truncate text-xs text-white/60">{ROLE_INFO[me.role]?.label}{me.district ? ` · ${me.district}` : ''}{me.state ? ` · ${stateByCode(me.state)?.en}` : ''}</span>
            </span>
          </div>
          <Link to="/" title="View site" className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 max-lg:hidden font-semibold text-white/85 hover:bg-white/10 hover:text-white">
            <Icon name="external" size={16} /><span className="hidden sm:inline">View site</span>
          </Link>
          <button onClick={logout} title="Log out" className="hidden h-9 lg:flex items-center gap-1.5 rounded-lg border border-white/25 px-3 font-semibold hover:border-red-300 hover:bg-red-500/15">
            <Icon name="logout" size={16} /><span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-350 flex-col lg:flex-row">
        <nav aria-label="Admin pages" className="hidden border-r border-brand/15 bg-white lg:block lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0">
          <ul className="admin-nav sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain p-3">
            {items.map((n) => {
              const count = n.badge ? summary[n.badge] : 0
              return (
                <li key={n.to}>
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

        <main className="admin-main min-w-0 flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-6">
          {(!locked || pathname === '/admin/security') && <Outlet context={{ me, summary, refresh, refreshMe }} />}
        </main>
      </div>

      {moreOpen && <MoreSheet me={me} items={more} summary={summary} onClose={() => setMoreOpen(false)} logout={logout} />}
      <PhoneTabs tabs={tabs} more={more} summary={summary} moreOpen={moreOpen} setMoreOpen={setMoreOpen} />
    </div>
  )
}
