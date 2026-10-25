import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'

const EMPTY = { name: '', email: '', password: '', role: 'editor' }

// Password box with an eye button to show or hide what was typed
function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <span className={`relative block ${className}`}>
      <input {...props} type={show ? 'text' : 'password'} className="input pr-12" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-navy/50 hover:bg-mist hover:text-brand">
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </span>
  )
}

export default function Team() {
  const { me } = useOutletContext()
  const [admins, setAdmins] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPw, setNewPw] = useState('')
  const [adding, setAdding] = useState(false)

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
      await api.post('/admins', form)
      setForm(EMPTY)
      setAdding(false)
    }, 'Team member added. Share the password with them privately.')
    setBusy(false)
  }

  const setRole = (a, role) => run(() => api.patch(`/admins/${a.id}`, { role }), `${a.name} is now ${ROLE_INFO[role].label}.`)
  const toggle = (a) => run(() => api.patch(`/admins/${a.id}`, { active: !a.active }), a.active ? `${a.name} was disabled.` : `${a.name} was enabled.`)
  const savePw = (a) => run(async () => {
    await api.patch(`/admins/${a.id}`, { password: newPw })
    setResetFor(null)
    setNewPw('')
  }, 'Password changed.')
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
      <PageHeader title="Team & roles" subtitle="Give each person only the access they need.">
        {!adding && <button onClick={() => { setAdding(true); setNote('') }} className="abtn-primary">➕ Add team member</button>}
      </PageHeader>
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>

      {adding && (
        <form onSubmit={create} className="card mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">➕ Add a team member</h2>
            <button type="button" onClick={() => { setAdding(false); setForm(EMPTY) }} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist">
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
            <label className="flex flex-col gap-1 font-semibold">🔑 Password (8+ characters)
              <PasswordInput required minLength="8" autoComplete="new-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 font-semibold">🎭 Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                {Object.entries(ROLE_INFO).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-navy/65">ℹ️ <b>{ROLE_INFO[form.role].label}:</b> {ROLE_INFO[form.role].desc}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAdding(false); setForm(EMPTY) }} className="abtn">Cancel</button>
              <button disabled={busy} className="abtn-primary">{busy ? 'Adding...' : '✅ Add team member'}</button>
            </div>
          </div>
        </form>
      )}

      <details className="card mb-5 py-3 sm:py-3">
        <summary className="cursor-pointer font-bold text-brand">ℹ️ What each role can do</summary>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {Object.entries(ROLE_INFO).map(([key, r]) => (
            <div key={key}><dt className="font-semibold text-brand">{r.label}</dt><dd className="text-navy/80">{r.desc}</dd></div>
          ))}
        </dl>
      </details>

      <h2 className="mb-3 text-lg font-extrabold">👥 Team {admins && `(${admins.length})`}</h2>
      {!admins && <p>Loading...</p>}
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
                    <Pill tone="gold">{ROLE_INFO[a.role]?.label || a.role}</Pill>
                    <Pill tone={a.twoFactorEnabled ? 'green' : 'gray'}>{a.twoFactorEnabled ? '🔐 2-step on' : '🔓 2-step off'}</Pill>
                    {!a.active && <Pill tone="red">🚫 Disabled</Pill>}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-brand/10 pt-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy/70">
                  Role
                  <select aria-label={`Role of ${a.name}`} value={a.role} disabled={self}
                    onChange={(e) => setRole(a, e.target.value)} className="input min-h-9 flex-1 py-1 text-sm disabled:opacity-60">
                    {Object.entries(ROLE_INFO).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setResetFor(resetFor === a.id ? null : a.id); setNewPw('') }} className="abtn min-h-9 px-3">
                    🔑 {self ? 'Change my password' : 'Reset password'}
                  </button>
                  {!self && <button onClick={() => toggle(a)} className="abtn min-h-9 px-3">{a.active ? '⏸️ Disable' : '▶️ Enable'}</button>}
                  {!self && a.twoFactorEnabled && <button onClick={() => reset2fa(a)} className="abtn min-h-9 px-3">🔄 Reset 2-step</button>}
                  {!self && <button onClick={() => remove(a)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>}
                </div>
              </div>

              {resetFor === a.id && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-mist/60 p-3">
                  <PasswordInput autoComplete="new-password" placeholder="New password (8+ characters)"
                    value={newPw} onChange={(e) => setNewPw(e.target.value)} className="min-w-52 flex-1" />
                  <button onClick={() => savePw(a)} disabled={newPw.length < 8} className="abtn-primary">💾 Save</button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
