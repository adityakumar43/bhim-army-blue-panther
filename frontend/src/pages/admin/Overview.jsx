import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ROLE_INFO } from '../../lib/roles.js'
import Icon from '../../components/Icon.jsx'
import BoxIcon from '../../components/BoxIcon.jsx'
import Stats from './Stats.jsx'
import Birthdays from './Birthdays.jsx'

// [words, emoji] for the time of day; late at night it is not "Good Morning" yet
const greeting = () => {
  const h = new Date().getHours()
  if (h < 4) return ['Working Late', '🌙']
  return [h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening', '👋']
}

// The two-step login reminder can be hidden for a week on this device
const TIP_KEY = 'hide2faTip'
const tipHidden = () => { try { return Number(localStorage.getItem(TIP_KEY) || 0) > Date.now() } catch { return false } }

export default function Overview() {
  const { me, summary } = useOutletContext()
  const can = (p) => [].concat(p).some((x) => me.permissions.includes(x)) // any one of the permissions
  const role = ROLE_INFO[me.role]
  const [hello, wave] = greeting()
  const [hideTip, setHideTip] = useState(tipHidden)
  const closeTip = () => { try { localStorage.setItem(TIP_KEY, String(Date.now() + 7 * 864e5)) } catch { /* storage blocked */ } setHideTip(true) }
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // [permission, link, label, count, icon, tile colours]
  const alerts = [
    [['members', 'district'], '/admin/members', 'Membership applications waiting', summary.members, 'userPlus', 'bg-blue-100 text-blue-700'],
    ['messages', '/admin/messages', 'Unread messages', summary.messages, 'chat', 'bg-amber-100 text-amber-700'],
    ['donations', '/admin/donations', 'New donations', summary.donations, 'heart', 'bg-rose-100 text-rose-700'],
    [['helpdesk', 'district'], '/admin/helpdesk', 'New help desk cases', summary.helpdesk || 0, 'help', 'bg-red-100 text-red-700'],
    [['members', 'district'], '/admin/volunteers', 'New volunteers', summary.volunteers || 0, 'hand', 'bg-green-100 text-green-700'],
  ].filter(([perm]) => can(perm))
    .sort((a, b) => (b[3] > 0) - (a[3] > 0)) // the ones with something new come first

  // [permission, link, label, icon]
  const actions = [
    ['content', '/admin/news', 'Publish News', 'news'],
    ['content', '/admin/events', 'Add an Event', 'calendar'],
    ['content', '/admin/gallery', 'Upload Photos', 'image'],
    ['content', '/admin/slides', 'Home Slider', 'layers'],
    ['content', '/admin/updates', 'Home Updates', 'bell'],
    ['leaders', '/admin/leaders', 'Leadership', 'award'],
    ['team', '/admin/team', 'Team & Roles', 'users'],
  ].filter(([perm, to]) => can(perm) && !(to === '/admin/leaders' && can('content'))) // content editors reach Leadership from the sidebar

  return (
    <>
      {/* Welcome banner */}
      <section className="relative mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-navy to-brand px-4 py-3.5 text-white shadow-lg sm:mb-5 sm:px-6 sm:py-4">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h1 className="min-w-0 truncate text-lg font-extrabold sm:text-2xl">{hello}, {me.name} {wave}</h1>
          <p className="text-xs text-white/70 sm:text-sm">📅 {today}</p>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-extrabold text-navy">{role?.label}</span>
          <span className="hidden sm:inline">{role?.desc}</span>
        </p>
      </section>

      {!me.twoFactorEnabled && !hideTip && (
        <div className="mb-4 flex items-center rounded-2xl border border-gold bg-gold/15 sm:mb-5">
          <Link to="/admin/security" className="flex min-w-0 flex-1 items-center gap-3 rounded-l-2xl px-4 py-2.5 text-sm font-semibold hover:bg-gold/25 sm:py-3 sm:text-base">
            <span className="text-lg sm:text-xl" aria-hidden="true">🔐</span>
            <span className="min-w-0 flex-1">
              <span className="sm:hidden">Turn on two-step login</span>
              <span className="hidden sm:inline">Your account is protected by a password only. Turn on two-step login</span>
            </span>
            <Icon name="arrow" size={18} className="shrink-0" />
          </Link>
          <button type="button" onClick={closeTip} title="Hide for a week" aria-label="Hide this reminder for a week"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-2xl border-l border-gold/60 text-navy/60 hover:bg-gold/25 hover:text-navy">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* What needs attention: 2 across on phones, the ones with something new first */}
      {alerts.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
          {alerts.map(([perm, to, label, n, icon, tile]) => (
            <Link key={to} to={to}
              className={`group flex flex-col gap-2 rounded-2xl border p-3 shadow-sm max-md:last:odd:col-span-2 transition hover:-translate-y-0.5 hover:shadow-md md:flex-row md:items-center md:gap-4 md:p-4
                ${n > 0 ? 'border-brand/15 bg-white hover:border-brand/30' : 'border-navy/5 bg-white/60 hover:bg-white'}`}>
              <span className="flex items-center justify-between gap-2 md:contents">
                <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-12 md:w-12 ${tile} ${n > 0 ? '' : 'opacity-60 grayscale'}`}><BoxIcon name={icon} size={22} className="md:h-7 md:w-7" /></span>
                {n > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white md:hidden">New</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`text-2xl leading-none font-extrabold md:text-3xl ${n > 0 ? 'text-brand' : 'text-navy/35'}`}>{n}</span>
                  {n > 0 && <span className="hidden rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white md:inline">New</span>}
                </span>
                <span className={`mt-1 block text-[13px] leading-snug font-semibold md:text-sm ${n > 0 ? 'text-navy/75' : 'text-navy/50'}`}>{label}</span>
              </span>
              <Icon name="arrow" size={18} className="hidden shrink-0 text-brand opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100 md:block" />
            </Link>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-extrabold">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {actions.map(([perm, to, label, icon]) => (
              <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-brand/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand transition group-hover:bg-brand group-hover:text-white">
                  <BoxIcon name={icon} size={20} />
                </span>
                <span className="text-sm leading-tight font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {can('members') && <Birthdays />}
      {!can('district') && <Stats />}
    </>
  )
}
