import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'
import Icon from '../../components/Icon.jsx'
import BoxIcon from '../../components/BoxIcon.jsx'
import AdminSearch, { SearchButton } from './AdminSearch.jsx'
import { stateByCode } from '../../data/states.js'
import { removeItem } from '../../lib/storage.js'


const NAV = [
  { to: '/admin', label: 'Overview', icon: 'grid', end: true },
  { to: '/admin/news', group: 'content', label: 'News', icon: 'news', perm: 'content' },
  { to: '/admin/events', group: 'content', label: 'Events', icon: 'calendar', perm: 'content' },
  { to: '/admin/checkin', group: 'content', label: 'Event Check-in', icon: 'ticket', perm: ['members', 'content', 'district', 'checkin'] },
  { to: '/admin/gallery', group: 'content', label: 'Gallery', icon: 'image', perm: 'content' },
  { to: '/admin/slides', group: 'content', label: 'Home Slider', icon: 'layers', perm: 'content' },
  { to: '/admin/leaders', group: 'content', label: 'Leadership', icon: 'award', perm: 'leaders' },
  { to: '/admin/videos', group: 'content', label: 'Videos', icon: 'video', perm: 'content' },
  { to: '/admin/downloads', group: 'content', label: 'Downloads', icon: 'download', perm: 'content' },
  { to: '/admin/updates', group: 'content', label: 'Home Updates', icon: 'bell', perm: 'content' },
  { to: '/admin/notifications', group: 'content', label: 'Phone Notifications', icon: 'phone', perm: 'content' },
  { to: '/admin/visitors', group: 'content', label: 'Visitors', icon: 'eye', perm: ['content', 'members'] },
  { to: '/admin/members', group: 'members', label: 'Members', icon: 'userPlus', perm: ['members', 'district'], badge: 'members' },
  { to: '/admin/growth', group: 'members', label: 'Member Growth', icon: 'trend', perm: 'members' },
  { to: '/admin/volunteers', group: 'members', label: 'Volunteers', icon: 'hand', perm: ['members', 'district'], badge: 'volunteers' },
  { to: '/admin/mailouts', group: 'members', label: 'Email Members', icon: 'mail', perm: 'members' },
  { to: '/admin/polls', group: 'members', label: 'Polls', icon: 'poll', perm: 'members' },
  { to: '/admin/certificates', group: 'members', label: 'Certificates', icon: 'award', perm: 'members' },
  { to: '/admin/messages', group: 'inbox', label: 'Messages', icon: 'chat', perm: 'messages', badge: 'messages' },
  { to: '/admin/helpdesk', group: 'inbox', label: 'Help Desk', icon: 'help', perm: ['helpdesk', 'district'], badge: 'helpdesk' },
  { to: '/admin/donations', group: 'inbox', label: 'Donations', icon: 'heart', perm: 'donations', badge: 'donations' },
  { to: '/admin/team', group: 'admin', label: 'Team & Roles', icon: 'users', perm: 'team' },
  { to: '/admin/activity', group: 'admin', label: 'Activity Log', icon: 'activity', perm: 'admins' },
  { to: '/admin/backup', group: 'admin', label: 'Backup', icon: 'download', perm: 'admins' },
  { to: '/admin/guide', group: 'admin', label: 'Guide', icon: 'book' },
  { to: '/admin/security', group: 'admin', label: 'Security', icon: 'shield' },
]

// The menu's groups, in this order. Pages without a group (Overview) are shown first.
const GROUPS = [['inbox', 'Inbox'], ['members', 'Members'], ['content', 'Website'], ['admin', 'Team & settings']]
const OPEN_KEY = 'adminMenuOpen' // the groups a person left open, on this device

// The page you are on, and its group. /admin/checkin/123 belongs to /admin/checkin.
const activeItem = (items, pathname) => items
  .filter((n) => (n.end ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`)))
  .sort((a, b) => b.to.length - a.to.length)[0]

function readOpen() {
  try {
    const saved = JSON.parse(localStorage.getItem(OPEN_KEY) || 'null')
    if (Array.isArray(saved)) return new Set(saved)
  } catch { /* storage blocked or broken */ }
  return new Set(['inbox'])
}

// Menu icons: thin when not chosen, two-tone for the page you are on
const NavIcon = ({ name, on, size }) => (on ? <BoxIcon name={name} size={size - 1} className="shrink-0" /> : <Icon name={name} size={size} className="shrink-0" />)

// On phones these sit in the bar at the bottom (the first 4 a person can open); the rest are under "More"
const PHONE_TABS = ['/admin', '/admin/members', '/admin/helpdesk', '/admin/events', '/admin/checkin', '/admin/messages', '/admin/news', '/admin/team', '/admin/security']
const SHORT = { '/admin': 'Home', '/admin/helpdesk': 'Help Desk', '/admin/members': 'Members', '/admin/team': 'Team', '/admin/checkin': 'Check-in' }

// The menu on computers: Overview, then the groups. A group opens and closes with its heading;
// the group of the page you are on is always opened, and a closed group shows how many new items it has.
function SideNav({ items, summary }) {
  const { pathname } = useLocation()
  const here = activeItem(items, pathname)?.group
  const [open, setOpen] = useState(() => { const s = readOpen(); if (here) s.add(here); return s })
  // Going to a page in a closed group opens that group (worked out while drawing, not in an effect)
  const [seen, setSeen] = useState(pathname)
  if (seen !== pathname) {
    setSeen(pathname)
    if (here && !open.has(here)) setOpen(new Set([...open, here]))
  }
  function toggle(key) {
    const next = new Set(open)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setOpen(next)
    try { localStorage.setItem(OPEN_KEY, JSON.stringify([...next])) } catch { /* storage blocked */ }
  }
  const count = (n) => (n.badge ? summary[n.badge] || 0 : 0)
  const link = (n) => (
    <li key={n.to}>
      <NavLink to={n.to} end={n.end}
        className={({ isActive }) =>
          `group flex min-h-9 items-center gap-3 rounded-xl px-3 text-[14.5px] font-semibold whitespace-nowrap transition ${isActive ? 'bg-brand text-white shadow-md shadow-brand/25' : 'text-navy/75 hover:bg-mist hover:text-brand'}`}>
        {({ isActive }) => (
          <>
            <NavIcon name={n.icon} on={isActive} size={18} />
            <span className="flex-1">{n.label}</span>
            {count(n) > 0 && <span className="min-w-6 rounded-full bg-gold px-1.5 text-center text-xs leading-6 font-extrabold text-navy">{count(n)}</span>}
          </>
        )}
      </NavLink>
    </li>
  )
  return (
    <nav aria-label="Admin pages" className="hidden border-r border-brand/15 bg-white lg:block lg:min-h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0">
      <div className="admin-nav sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain p-3">
        <ul className="flex flex-col gap-0.5">{items.filter((n) => !n.group).map(link)}</ul>
        {GROUPS.map(([key, label]) => {
          const list = items.filter((n) => n.group === key)
          if (!list.length) return null
          const isOpen = open.has(key)
          const waiting = list.reduce((s, n) => s + count(n), 0)
          return (
            <div key={key} className="mt-3 border-t border-navy/8 pt-2">
              <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen} aria-controls={`menu-${key}`}
                className="flex min-h-8 w-full items-center gap-2 rounded-lg px-3 text-xs font-extrabold tracking-wider text-navy/65 uppercase hover:bg-mist hover:text-brand">
                <span className="flex-1 text-left">{label}</span>
                {!isOpen && waiting > 0 && <span className="min-w-6 rounded-full bg-red-600 px-1.5 text-center text-[11px] leading-5 font-extrabold text-white normal-case">{waiting}</span>}
                <Icon name="chevronDown" size={16} className={`shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <ul id={`menu-${key}`} className="mt-0.5 flex flex-col gap-0.5">{list.map(link)}</ul>}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

// The bar at the bottom of the screen on phones, like an app
function PhoneTabs({ tabs, more, summary, moreOpen, setMoreOpen }) {
  const moreCount = more.reduce((s, n) => s + (n.badge ? summary[n.badge] || 0 : 0), 0)
  const tab = 'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition'
  const dot = (n) => n > 0 && <span className="absolute top-1.5 left-1/2 ml-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] leading-5 text-white ring-2 ring-white">{n > 99 ? '99+' : n}</span>
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(11,31,77,0.08)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl">
        {tabs.map((n) => (
          <li key={n.to} className="flex flex-1">
            <NavLink to={n.to} end={n.end} onClick={() => setMoreOpen(false)}
              className={({ isActive }) => `${tab} ${isActive && !moreOpen ? 'text-brand' : 'text-navy/65'}`}>
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive && !moreOpen ? 'bg-brand/12' : ''}`}><NavIcon name={n.icon} on={isActive && !moreOpen} size={20} /></span>
                  <span className="max-w-full truncate px-0.5">{SHORT[n.to] || n.label}</span>
                  {dot(n.badge ? summary[n.badge] : 0)}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className={`${tab} ${moreOpen ? 'text-brand' : 'text-navy/65'}`}>
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
  const close = useEffectEvent(() => onClose())
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && close()
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
            <span className="block truncate text-xs text-navy/65">{ROLE_INFO[me.role]?.label}{me.district ? ` · ${me.district}` : ''}{me.state ? ` · ${stateByCode(me.state)?.en}` : ''}</span>
          </span>
          <button onClick={logout} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50">
            <Icon name="logout" size={16} />Log out
          </button>
        </div>
        {[[null, ''], ...GROUPS].map(([key, label]) => {
          const list = items.filter((n) => (n.group || null) === key)
          if (!list.length) return null
          return (
            <section key={key || 'main'} className="mb-4">
              {label && <h2 className="mb-2 px-1 text-xs font-extrabold tracking-wider text-navy/65 uppercase">{label}</h2>}
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {list.map((n) => {
            const count = n.badge ? summary[n.badge] : 0
            return (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} onClick={onClose}
                  className={({ isActive }) => `relative flex h-full min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center text-xs leading-tight font-bold shadow-sm transition ${isActive ? 'bg-brand text-white' : 'bg-white text-navy/80 active:bg-mist'}`}>
                  {({ isActive }) => (
                    <>
                      <NavIcon name={n.icon} on={isActive} size={22} />
                      <span>{n.label}</span>
                      {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] leading-5 text-white">{count}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
              </ul>
            </section>
          )
        })}
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
          <img src="/logo-160.webp" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
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
  // The phone "More" sheet belongs to the page it was opened on, so it closes by itself after choosing a page
  const [moreOn, setMoreOn] = useState(null)
  const moreOpen = moreOn === pathname
  const setMoreOpen = (on) => setMoreOn(on ? pathname : null)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => { setMoreOn(null); setSearchOpen(true) }, [])
  const [summary, setSummary] = useState({ members: 0, messages: 0, donations: 0, helpdesk: 0, volunteers: 0 })

  const refresh = () => api.get('/admin/summary').then(setSummary).catch(() => { })

  const refreshMe = () => api.get('/auth/me').then((r) => setMe(r.admin)).catch(() => { })
  useEffect(() => { refreshMe() }, [])

  // Roles that must use two-step login can only open the Security page until they have set it up
  const locked = !!me && me.twoFactorRequired && !me.twoFactorEnabled
  useEffect(() => {
    if (locked && pathname !== '/admin/security') navigate('/admin/security', { replace: true })
  }, [locked, pathname, navigate])

  // Check for new items now, then every 30 seconds while the panel is open
  useEffect(() => {
    if (!me || locked) return
    refresh()
    const id = setInterval(() => { if (!document.hidden) refresh() }, 30000)
    return () => clearInterval(id)
  }, [me, locked])


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
    // End the session on the server too, so the login cannot be used again; leave even if the server does not answer
    api.post('/auth/logout').catch(() => { }).finally(() => {
      removeItem('token')
      navigate('/admin/login')
    })
  }

  if (!me) return <AdminLoading />
  const items = NAV.filter((n) => (locked ? n.to === '/admin/security' : !n.perm || [].concat(n.perm).some((p) => me.permissions.includes(p))))
  // Phones: up to 4 main pages in the bottom bar; the rest, and Log out, are under "More"
  const tabs = items.length <= 4 ? items : PHONE_TABS.map((to) => items.find((n) => n.to === to)).filter(Boolean).slice(0, 4)
  const more = items.filter((n) => !tabs.includes(n))

  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-white shadow-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:flex-1">
          <img src="/logo-160.webp" alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          {/* Phones: the role in small gold letters under the name; bigger screens: a gold badge beside it */}
          <div className="min-w-0 leading-tight sm:flex sm:items-center sm:gap-3">
            <strong className="block truncate">Bhim Army Blue Panther</strong>
            <span className="block truncate text-xs font-bold text-gold sm:shrink-0 sm:rounded-md sm:bg-gold sm:px-2 sm:py-0.5 sm:font-extrabold sm:text-navy">{ROLE_INFO[me.role]?.label || 'Admin'}</span>
          </div>
        </div>
        {/* Search: in the middle on computers, an icon at the right on phones */}
        {!locked && me.role !== 'gate' && <div className="ml-auto shrink-0 lg:ml-0"><SearchButton onOpen={openSearch} /></div>}
        <div className="flex shrink-0 items-center justify-end gap-2 text-sm lg:flex-1">
          <div className="hidden items-center gap-2 xl:flex">
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
        <SideNav items={items} summary={summary} />

        <main className="admin-main min-w-0 flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-6">
          {(!locked || pathname === '/admin/security') && <Outlet context={{ me, summary, refresh, refreshMe }} />}
        </main>
      </div>
      {searchOpen && <AdminSearch pages={items} onClose={() => setSearchOpen(false)} />}
      {moreOpen && <MoreSheet me={me} items={more} summary={summary} onClose={() => setMoreOpen(false)} logout={logout} />}
      <PhoneTabs tabs={tabs} more={more} summary={summary} moreOpen={moreOpen} setMoreOpen={setMoreOpen} />
    </div>
  )
}
