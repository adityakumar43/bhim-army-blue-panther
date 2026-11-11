import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'
import { STATES, stateByCode } from '../../data/states.js'
import { PageHeader, Notice, ListLoading, Pill, PasswordInput } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import DistrictSelect from '../../components/DistrictSelect.jsx'


const EMPTY = { name: '', email: '', password: '', role: 'editor', state: '', district: '' }
const sortedStates = [...STATES].sort((a, b) => a.en.localeCompare(b.en))
const stateLabel = (code) => stateByCode(code)?.en || code
const hasState = (role) => ['stateadmin', 'districtadmin', 'gate'].includes(role)
const areaLabel = (a) => [a.district, a.state && stateLabel(a.state)].filter(Boolean).join(', ')

const duration = (hours) => (hours >= 24 ? `${hours / 24} day${hours === 24 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'}`)

// After adding someone (or sending them a new link): the set-password link, emailed to them, and here to copy
// or send on WhatsApp in case the email does not arrive
function LinkBox({ sent, onClose }) {
  const [copied, setCopied] = useState(false)
  const message = `Jai Bhim ${sent.name}, please choose your password for the Bhim Army Blue Panther admin panel with this link (it works for ${duration(sent.hours)}, once). Your login email is ${sent.email}.\n${sent.link}`
  const copy = () => navigator.clipboard?.writeText(sent.link).then(() => setCopied(true)).catch(() => {})
  return (
    <div role="status" className="card mb-5 border-2 border-green-300 bg-green-50/60">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-lg font-extrabold">{sent.emailed ? `📧 Link emailed to ${sent.name}` : `⚠️ The email to ${sent.name} could not be sent`}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy/65 hover:bg-white"><Icon name="close" size={18} /></button>
      </div>
      <p className="mb-3 text-sm text-navy/80">
        {sent.emailed
          ? <>They will get an email at <b>{sent.email}</b> with a link to choose their own password. Nobody else, not even you, will know it. If the email does not arrive, send them this link yourself:</>
          : <>Send this link to <b>{sent.name}</b> yourself, on WhatsApp or by message. With it they choose their own password.</>}
      </p>
      <div className="flex flex-wrap gap-2">
        <input readOnly value={sent.link} aria-label="Set-password link" onFocus={(e) => e.target.select()} className="input min-w-0 flex-1 text-sm" />
        <button type="button" onClick={copy} className="abtn min-h-11 px-4">{copied ? '✅ Copied' : '📋 Copy link'}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="abtn min-h-11 border-green-300 px-4 text-green-800">💬 WhatsApp</a>
      </div>
      <p className="mt-2 text-xs text-navy/65">🔒 The link works once, for {duration(sent.hours)}. Send it only to {sent.name}: whoever opens it can choose the password.</p>
    </div>
  )
}

export default function Team() {
  const { me } = useOutletContext()
  // A State admin manages only the District admins of their own state
  const limited = !me.permissions.includes('admins')
  const roleChoices = Object.entries(ROLE_INFO).filter(([key]) => !limited || key === 'districtadmin' || key === 'gate')
  const fresh = () => (limited ? { ...EMPTY, role: 'districtadmin', state: me.state } : EMPTY)
  const [admins, setAdmins] = useState(null)
  const [form, setForm] = useState(fresh)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPw, setNewPw] = useState('')
  const [ownPw, setOwnPw] = useState(false) // "set a password myself" instead of emailing a link
  const [sent, setSent] = useState(null) // the set-password link just made: { name, email, link, emailed, hours }
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState(null) // { id, role, state, district } while choosing the area of a State or District admin

  const load = () => api.get('/admins').then(setAdmins).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  async function run(fn, okMessage) {
    setError('')
    setNote('')
    try {
      await fn()
      setNote(okMessage)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    await run(async () => {
      const r = await api.post('/admins', ownPw ? form : { ...form, password: '' })
      setSent(r.link ? { name: r.name, email: r.email, link: r.link, emailed: r.emailed, hours: r.hours } : null)
      setForm(fresh())
      setOwnPw(false)
      setAdding(false)
    }, ownPw ? `${ROLE_INFO[form.role]?.label || 'Team member'} added. Share the password with them privately.` : `${form.name} was added.`)
    setBusy(false)
  }

  const setRole = (a, role) => {
    // State and District admins need their area first, so ask for it before saving
    if (hasState(role)) return setPick({ id: a.id, role, state: a.state || '', district: role === 'districtadmin' ? a.district || '' : '' })
    setPick(null)
    run(() => api.patch(`/admins/${a.id}`, { role }), `${a.name} is now ${ROLE_INFO[role].label}.`)
  }
  const savePick = (a) => run(async () => {
    await api.patch(`/admins/${a.id}`, { role: pick.role, state: pick.state, district: pick.district })
    setPick(null)
  }, `${a.name} is now ${ROLE_INFO[pick?.role]?.label} for ${areaLabel(pick || {})}.`)
  const pickReady = pick && pick.state && (pick.role !== 'districtadmin' || pick.district)
  const toggle = (a) => run(() => api.patch(`/admins/${a.id}`, { active: !a.active }), a.active ? `${a.name} was disabled.` : `${a.name} was enabled.`)
  const savePw = (a) => run(async () => {
    await api.patch(`/admins/${a.id}`, { password: newPw })
    setResetFor(null)
    setNewPw('')
  }, 'Password changed.')
  const sendLink = (a) => run(async () => {
    const r = await api.post(`/admins/${a.id}/send-link`)
    setSent({ name: r.name, email: r.email, link: r.link, emailed: r.emailed, hours: r.hours })
    setResetFor(null)
  }, '')
  const reset2fa = (a) => {
    if (window.confirm(`Reset two-step login for ${a.name}? They can set it up again after logging in.`)) {
      run(() => api.post(`/admins/${a.id}/reset-2fa`), `Two-step login was reset for ${a.name}.`)
    }
  }
  const remove = (a) => {
    if (window.confirm(`Delete the account of ${a.name}? This cannot be undone.`)) run(() => api.del(`/admins/${a.id}`), 'Account deleted.')
  }

  return (
    <>
      <PageHeader title="Team & Roles" subtitle={limited ? `Add and manage the District admins and Gate volunteers of ${stateLabel(me.state)}.` : 'Give each person only the access they need.'}>
        {!adding && <button onClick={() => { setAdding(true); setNote('') }} className="abtn-primary">➕ Add team member</button>}
      </PageHeader>
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {sent && <LinkBox sent={sent} onClose={() => setSent(null)} />}

      {adding && (
        <form onSubmit={create} className="card mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">➕ Add a team member</h2>
            <button type="button" onClick={() => { setAdding(false); setForm(fresh()) }} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/65 hover:bg-mist">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1 font-semibold">👤 Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </label>
            <label className="flex flex-col gap-1 font-semibold">✉️ Email (used to log in)
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </label>
            {ownPw && (
              <label className="flex flex-col gap-1 font-semibold">🔑 Password (8+ characters)
                <PasswordInput required minLength="8" autoComplete="new-password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
            )}
            <label className="flex flex-col gap-1 font-semibold">🎭 Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, district: '' })} className="input">
                {roleChoices.map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
              </select>
            </label>
            {hasState(form.role) && (
              <label className="flex flex-col gap-1 font-semibold">📍 State
                <select required value={form.state} disabled={limited} onChange={(e) => setForm({ ...form, state: e.target.value, district: '' })} className="input disabled:opacity-70">
                  <option value="">Choose...</option>
                  {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                </select>
              </label>
            )}
            {form.role === 'districtadmin' && (
              <label className="flex flex-col gap-1 font-semibold">🏘️ District
                <DistrictSelect english required stateCode={form.state} value={form.district} onChange={(district) => setForm((f) => ({ ...f, district }))} />
              </label>
            )}
          </div>
          <p className="mt-3 rounded-xl bg-mist/60 p-3 text-sm text-navy/80">
            {ownPw
              ? <>🔑 You choose the password and pass it on to them privately.</>
              : <>📧 They get an email with a link to <b>choose their own password</b>. You will also see the link here, to send on WhatsApp if the email does not arrive.</>}
            {' '}<button type="button" onClick={() => { setOwnPw(!ownPw); setForm((f) => ({ ...f, password: '' })) }} className="font-semibold text-brand underline">
              {ownPw ? 'Send them a link instead' : 'Set a password myself instead'}
            </button>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-navy/65">ℹ️ <b>{ROLE_INFO[form.role].label}:</b> {ROLE_INFO[form.role].desc}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAdding(false); setOwnPw(false); setForm(fresh()) }} className="abtn">Cancel</button>
              <button disabled={busy} className="abtn-primary">{busy ? 'Adding...' : '✅ Add team member'}</button>
            </div>
          </div>
        </form>
      )}

      <details className="card mb-5 py-3 sm:py-3">
        <summary className="cursor-pointer font-bold text-brand">ℹ️ What each role can do</summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {roleChoices.map(([key, r]) => (
            <div key={key}><dt className="font-semibold text-brand">{r.label}</dt><dd className="text-navy/80">{r.desc}</dd></div>
          ))}
        </dl>
      </details>

      <h2 className="mb-3 text-lg font-extrabold">👥 Team {admins && `(${admins.length})`}</h2>
      {!admins && <ListLoading />}
      <ul className="grid gap-4 lg:grid-cols-2">
        {admins?.map((a) => {
          const self = a.id === me.id
          return (
            <li key={a.id} className={`card flex flex-col p-4 sm:p-5 ${a.active ? '' : 'bg-navy/5 opacity-80'}`}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white ${a.active ? 'bg-brand' : 'bg-navy/40'}`}>
                  {a.name?.[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-lg leading-tight font-bold">{a.name}</span>
                    {self && <Pill tone="blue">🙋 You</Pill>}
                  </div>
                  <div className="truncate text-sm text-navy/65">✉️ {a.email}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Pill tone="gold">{ROLE_INFO[a.role]?.label || a.role}{a.state ? ` · 📍 ${areaLabel(a)}` : ''}</Pill>
                    <Pill tone={a.twoFactorEnabled ? 'green' : 'gray'}>{a.twoFactorEnabled ? '🔐 2-step on' : '🔓 2-step off'}</Pill>
                    {!a.active && <Pill tone="red">🚫 Disabled</Pill>}
                    {!a.passwordSet && <Pill tone="gold">⏳ Invited, has not chosen a password yet</Pill>}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-brand/10 pt-3">
                {!limited && (
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy/70">
                    Role
                    <select aria-label={`Role of ${a.name}`} value={pick?.id === a.id ? pick.role : a.role} disabled={self}
                      onChange={(e) => setRole(a, e.target.value)} className="input min-h-9 flex-1 py-1 text-sm disabled:opacity-60">
                      {roleChoices.map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                    </select>
                  </label>
                )}
                {hasState(a.role) && pick?.id !== a.id && (
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy/70">
                    <span className="min-w-0 flex-1 truncate">📍 {areaLabel(a) || 'No area chosen'}</span>
                    <button onClick={() => setPick({ id: a.id, role: a.role, state: a.state || '', district: a.district || '' })} className="abtn min-h-9 px-3">Change</button>
                  </div>
                )}
                {pick?.id === a.id && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-gold/15 p-2 text-sm font-semibold">
                    📍 {pick.role === 'districtadmin' ? 'Which district?' : 'Which state?'}
                    <select aria-label="Choose state" value={pick.state} disabled={limited} onChange={(e) => setPick({ ...pick, state: e.target.value, district: '' })}
                      className="input min-h-9 min-w-40 flex-1 py-1 text-sm disabled:opacity-70">
                      <option value="">Choose...</option>
                      {sortedStates.map((s) => <option key={s.code} value={s.code}>{s.en}</option>)}
                    </select>
                    {pick.role === 'districtadmin' && (
                      <span className="min-w-40 flex-1">
                        <DistrictSelect english stateCode={pick.state} value={pick.district} onChange={(district) => setPick((p) => ({ ...p, district }))} className="input min-h-9 py-1 text-sm" />
                      </span>
                    )}
                    <button onClick={() => savePick(a)} disabled={!pickReady} className="abtn-primary min-h-9 px-3">Save</button>
                    <button onClick={() => setPick(null)} className="abtn min-h-9 px-3">Cancel</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {self
                    ? <Link to="/admin/security#password" className="abtn min-h-9 px-3">🔑 Change my password</Link>
                    : <button onClick={() => { setResetFor(resetFor === a.id ? null : a.id); setNewPw('') }} aria-expanded={resetFor === a.id} className="abtn min-h-9 px-3">
                      🔑 {a.passwordSet ? 'Password' : 'Resend invite'}
                    </button>}
                  {!self && <button onClick={() => toggle(a)} className="abtn min-h-9 px-3">{a.active ? '⏸️ Disable' : '▶️ Enable'}</button>}
                  {!self && a.twoFactorEnabled && <button onClick={() => reset2fa(a)} className="abtn min-h-9 px-3">🔄 Reset 2-step</button>}
                  {!self && <button onClick={() => remove(a)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>}
                </div>
              </div>

              {resetFor === a.id && !self && (
                <div className="mt-3 flex flex-col gap-3 rounded-xl bg-mist/60 p-3">
                  <div>
                    <button onClick={() => sendLink(a)} disabled={!a.active} className="abtn-primary min-h-10 px-4">
                      📧 {a.passwordSet ? 'Send a link to choose a new password' : 'Send a new invite link'}
                    </button>
                    <p className="mt-1 text-xs text-navy/65">{a.active ? `${a.name} chooses the password; nobody else knows it. Recommended.` : 'Enable this account first.'}</p>
                  </div>
                  <div className="border-t border-navy/10 pt-3">
                    <p className="mb-1.5 text-xs font-semibold text-navy/70">Or set a password yourself and pass it on privately:</p>
                    <div className="flex flex-wrap gap-2">
                      <PasswordInput autoComplete="new-password" placeholder="New password (8+ characters)" aria-label="New password"
                        value={newPw} onChange={(e) => setNewPw(e.target.value)} className="min-w-52 flex-1" />
                      <button onClick={() => savePw(a)} disabled={newPw.length < 8} className="abtn min-h-11">💾 Save</button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
