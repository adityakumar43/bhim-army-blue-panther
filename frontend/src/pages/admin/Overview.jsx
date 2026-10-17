import { Link, useOutletContext } from 'react-router-dom'
import { ROLE_INFO } from '../../lib/roles.js'
import { PageHeader } from './ui.jsx'

export default function Overview() {
  const { me, summary } = useOutletContext()
  const can = (p) => me.permissions.includes(p)

  const alerts = [
    ['members', '/admin/members', 'Membership applications waiting', summary.members],
    ['messages', '/admin/messages', 'Unread messages', summary.messages],
    ['donations', '/admin/donations', 'New donations', summary.donations],
  ].filter(([perm]) => can(perm))

  const actions = [
    ['content', '/admin/news', 'Publish news'],
    ['content', '/admin/events', 'Add an event'],
    ['content', '/admin/gallery', 'Upload photos'],
    ['content', '/admin/slides', 'Change the home slider'],
    ['admins', '/admin/team', 'Manage team & roles'],
  ].filter(([perm]) => can(perm))

  return (
    <>
      <PageHeader title={`Welcome, ${me.name}`} subtitle={`${ROLE_INFO[me.role]?.label}: ${ROLE_INFO[me.role]?.desc}`} />

      {!me.twoFactorEnabled && (
        <Link to="/admin/security" className="mb-6 block border border-gold bg-gold/20 p-4 font-semibold">
          Your account is protected by a password only. Turn on two-step login
        </Link>
      )}

      {alerts.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {alerts.map(([perm, to, label, n]) => (
            <Link key={perm} to={to} className="card block hover:border-brand">
              <div className={`text-4xl font-extrabold ${n > 0 ? 'text-brand' : 'text-navy/40'}`}>{n}</div>
              <div className="font-semibold">{label}</div>
            </Link>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-extrabold">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            {actions.map(([perm, to, label]) => (
              <Link key={to} to={to} className="abtn">{label}</Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
