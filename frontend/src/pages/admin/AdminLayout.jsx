import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/news', label: 'News', perm: 'content' },
  { to: '/admin/events', label: 'Events', perm: 'content' },
  { to: '/admin/gallery', label: 'Gallery', perm: 'content' },
  { to: '/admin/slides', label: 'Home slider', perm: 'content' },
  { to: '/admin/members', label: 'Members', perm: 'members', badge: 'members' },
  { to: '/admin/messages', label: 'Messages', perm: 'messages', badge: 'messages' },
  { to: '/admin/donations', label: 'Donations', perm: 'donations', badge: 'donations' },
  { to: '/admin/team', label: 'Team & roles', perm: 'admins' },
  { to: '/admin/security', label: 'Security' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [me, setMe] = useState(null)
  const [summary, setSummary] = useState({ members: 0, messages: 0, donations: 0 })

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

  // Opening the Donations page counts as seeing them
  useEffect(() => {
    if (me?.permissions.includes('donations') && pathname === '/admin/donations') {
      api.post('/admin/seen/donations').then(refresh).catch(() => { })
    }
  }, [pathname, me])

  const total = summary.members + summary.messages + summary.donations
  useEffect(() => {
    document.title = total > 0 ? `(${total}) Admin Panel` : 'Admin Panel'
    return () => { document.title = 'Bhim Army Blue Panther' }
  }, [total])

  function logout() {
    localStorage.removeItem('token')
    navigate('/admin/login')
  }

  if (!me) return <p className="px-5 py-20 text-center">Loading...</p>
  const items = NAV.filter((n) => (locked ? n.to === '/admin/security' : !n.perm || me.permissions.includes(n.perm)))

  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <strong className="truncate">Bhim Army Blue Panther</strong>
          <span className="hidden bg-gold px-2 py-0.5 text-xs font-extrabold text-navy sm:inline">ADMIN</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="hidden max-w-60 truncate sm:block">{me.name} · {ROLE_INFO[me.role]?.label}</span>
          <Link to="/" className="underline">View site</Link>
          <button onClick={logout} className="border border-white/60 px-3 py-1.5 font-semibold">Log out</button>
        </div>
      </header>

      <div className="mx-auto flex max-w-350 flex-col lg:flex-row">
        <nav aria-label="Admin" className="border-b border-brand/15 bg-white lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
          <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
            {items.map((n) => {
              const count = n.badge ? summary[n.badge] : 0
              return (
                <li key={n.to} className="shrink-0">
                  <NavLink to={n.to} end={n.end}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center justify-between gap-3 px-4 font-semibold whitespace-nowrap ${isActive ? 'bg-brand text-white' : 'hover:bg-mist'}`}>
                    {n.label}
                    {count > 0 && (
                      <span className="rounded-full bg-gold px-2 text-sm font-extrabold text-navy">{count}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {(!locked || pathname === '/admin/security') && <Outlet context={{ me, summary, refresh, refreshMe }} />}
        </main>
      </div>
    </div>
  )
}
