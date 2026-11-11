import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import Icon from '../../components/Icon.jsx'
import { PasswordInput } from './ui.jsx'

// The page a set-password link opens (/admin/set-password?t=...): a new team member chooses their first password,
// or an admin who forgot theirs chooses a new one. The link's code is taken out of the address bar at once,
// so it is not left in the browser history.
const takeToken = () => {
  const t = new URLSearchParams(window.location.search).get('t') || ''
  if (t) window.history.replaceState(null, '', window.location.pathname)
  return t
}

export default function SetPassword() {
  const navigate = useNavigate()
  const [token] = useState(takeToken)
  const [who, setWho] = useState(null) // { name, email, isNew }
  const [bad, setBad] = useState(token ? '' : 'This link is not complete. Open it again from your email, or ask for a new one.')
  const [form, setForm] = useState({ next: '', again: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) return
    api.post('/auth/set-password/check', { token }).then(setWho).catch((err) => setBad(err.message))
  }, [token])

  const mismatch = form.again && form.next !== form.again

  async function save(e) {
    e.preventDefault()
    if (form.next !== form.again) return setError('The two passwords are not the same')
    setBusy(true)
    setError('')
    try {
      await api.post('/auth/set-password', { token, password: form.next })
      setDone(true)
    } catch (err) {
      if (err.status === 410) setBad(err.message)
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy px-5 py-4">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.75),transparent_60%)]" />
      <div className="relative w-full max-w-md rounded-3xl border-t-[6px] border-gold bg-white p-6 shadow-2xl shadow-black/40 sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <img src="/logo-160.webp" alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm ring-2 ring-mist" />
          <div>
            <p className="leading-tight font-bold text-brand">Bhim Army Blue Panther</p>
            <p className="text-xs text-navy/65">Admin panel</p>
          </div>
        </div>

        {bad ? (
          <div role="alert" className="flex flex-col gap-3">
            <h1 className="text-2xl font-extrabold">Link not valid</h1>
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">{bad}</p>
            <p className="text-sm text-navy/70">On the login page, use <b>Forgot password?</b> to get a new link, or ask a super admin to send you one.</p>
            <Link to="/admin/login" className="btn w-full rounded-xl bg-brand text-white hover:bg-navy">Go to login</Link>
          </div>
        ) : done ? (
          <div role="status" className="flex flex-col gap-3">
            <h1 className="text-2xl font-extrabold">✅ Password saved</h1>
            <p className="text-navy/80">You can now log in with <b>{who?.email}</b> and your new password.</p>
            <button type="button" onClick={() => navigate('/admin/login')} className="btn w-full gap-2 rounded-xl bg-brand text-white hover:bg-navy">
              Log in <Icon name="login" size={18} />
            </button>
          </div>
        ) : !who ? (
          <p role="status" className="py-6 text-center text-navy/70">Checking your link…</p>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-3">
            <h1 className="text-2xl font-extrabold">{who.isNew ? 'Welcome to the team' : 'Choose a new password'}</h1>
            <p className="text-navy/80">
              Jai Bhim <b>{who.name}</b>. {who.isNew ? 'Choose the password you will use to log in.' : 'Choose a new password for your account.'}
              {' '}Your login email: <b className="break-all">{who.email}</b>
            </p>
            <label className="flex flex-col gap-1 font-semibold">New password (8+ characters)
              <PasswordInput required minLength="8" autoFocus autoComplete="new-password" value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 font-semibold">New password again
              <PasswordInput required minLength="8" autoComplete="new-password" value={form.again} aria-invalid={mismatch || undefined}
                onChange={(e) => setForm({ ...form, again: e.target.value })} />
              {mismatch && <span className="text-xs font-semibold text-red-700">⚠️ Not the same as the password above</span>}
            </label>
            <p className="text-xs text-navy/65">🔒 Use a password you don't use anywhere else. Nobody from the team will ever ask you for it.</p>
            {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
            <button disabled={busy || form.next.length < 8 || form.next !== form.again} className="btn w-full gap-2 rounded-xl bg-brand text-white shadow-md transition hover:bg-navy disabled:opacity-60">
              {busy ? 'Saving…' : <>Save my password <Icon name="lock" size={18} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
