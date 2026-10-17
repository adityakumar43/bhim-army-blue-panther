import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { ROLE_INFO } from '../../lib/roles.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

const EMPTY = { name: '', email: '', password: '', role: 'editor' }

export default function Team() {
  const { me } = useOutletContext()
  const [admins, setAdmins] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetFor, setResetFor] = useState(null)
  const [newPw, setNewPw] = useState('')

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
      <PageHeader title="Team & roles" subtitle="Give each person only the access they need." />
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>

      <section className="card mb-6">
        <h2 className="mb-3 text-xl font-extrabold">What each role can do</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(ROLE_INFO).map(([key, r]) => (
            <div key={key}><dt className="font-semibold text-brand">{r.label}</dt><dd className="text-navy/80">{r.desc}</dd></div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <form onSubmit={create} className="card flex flex-col gap-4">
          <h2 className="text-xl font-extrabold">Add a team member</h2>
          <label className="flex flex-col gap-1 font-semibold">Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">Email (used to log in)
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">Password (at least 8 characters)
            <input type="password" required minLength="8" autoComplete="new-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
          </label>
          <label className="flex flex-col gap-1 font-semibold">Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              {Object.entries(ROLE_INFO).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
            </select>
            <span className="text-sm font-normal text-navy/70">{ROLE_INFO[form.role].desc}</span>
          </label>
          <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">{busy ? 'Adding...' : 'Add team member'}</button>
        </form>

        <section className="card">
          <h2 className="mb-4 text-xl font-extrabold">Team {admins && `(${admins.length})`}</h2>
          {!admins && <p>Loading...</p>}
          <ul className="flex flex-col gap-4">
            {admins?.map((a) => {
              const self = a.id === me.id
              return (
                <li key={a.id} className={`border p-4 ${a.active ? 'border-brand/15' : 'border-navy/20 bg-navy/5'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold">{a.name} {self && <Pill tone="blue">You</Pill>} {a.twoFactorEnabled && <Pill tone="green">2-step on</Pill>} </div>
                      <div className="text-sm text-navy/70">{a.email}</div>
                    </div>
                    {!a.active && <Pill tone="red">Disabled</Pill>}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select aria-label={`Role of ${a.name}`} value={a.role} disabled={self}
                      onChange={(e) => setRole(a, e.target.value)} className="input w-auto">
                      {Object.entries(ROLE_INFO).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                    </select>
                    <button onClick={() => { setResetFor(resetFor === a.id ? null : a.id); setNewPw('') }} className="abtn">
                      {self ? 'Change my password' : 'Reset password'}
                    </button>
                    {!self && <button onClick={() => toggle(a)} className="abtn">{a.active ? 'Disable' : 'Enable'}</button>}
                    {!self && a.twoFactorEnabled && <button onClick={() => reset2fa(a)} className="abtn">Reset 2-step</button>}
                    {!self && <button onClick={() => remove(a)} className="abtn-danger">Delete</button>}
                  </div>

                  {resetFor === a.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input type="password" autoComplete="new-password" placeholder="New password (8+ characters)"
                        value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input w-auto min-w-60 flex-1" />
                      <button onClick={() => savePw(a)} disabled={newPw.length < 8} className="abtn-primary">Save password</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}
