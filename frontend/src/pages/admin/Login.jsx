import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import Icon from '../../components/Icon.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [challenge, setChallenge] = useState('') // set after the password step when two-step login is on
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const [notice] = useState(() => { try { return sessionStorage.getItem('loginNotice') || '' } catch { return '' } })

  async function submit(e) {
    e.preventDefault()
    try { sessionStorage.removeItem('loginNotice') } catch { /* storage blocked */ }
    setBusy(true)
    setError('')
    localStorage.removeItem('token') // an old expired token must not interfere
    try {
      const r = challenge
        ? await api.post('/auth/login/2fa', { challenge, code })
        : await api.post('/auth/login', form)
      if (r.needs2fa) {
        setChallenge(r.challenge)
      } else {
        localStorage.setItem('token', r.token)
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message)
      if (/session expired/i.test(err.message)) { setChallenge(''); setCode('') }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-5 py-10">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,60,157,0.75),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border-t-[6px] border-gold bg-white p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm ring-2 ring-mist" />
            <div>
              <p className="leading-tight font-bold text-brand">Bhim Army Blue Panther</p>
              <p className="text-xs text-navy/60">शिक्षित बनो, संगठित रहो, संघर्ष करो</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy/10 pt-4">
            <h1 className="text-2xl font-extrabold">Admin login</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-brand"><Icon name="shield" size={14} /> Staff only</span>
          </div>
        </div>

        {notice && <p role="status" className="mb-4 rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm text-navy">{notice}</p>}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {challenge ? (
            <label className="flex flex-col gap-1 font-semibold">
              6-digit code from your authenticator app
              <input inputMode="numeric" autoComplete="one-time-code" autoFocus required maxLength="7" placeholder="123456"
                value={code} onChange={(e) => setCode(e.target.value)} className="input text-center text-2xl tracking-widest" />
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-1 font-semibold">Email
                <div className="relative">
                  <Icon name="mail" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-navy/40" />
                  <input type="email" required autoComplete="username" value={form.email} placeholder="you@example.com"
                    onChange={(e) => setForm({ ...form, email: e.target.value })} className="input pl-11" />
                </div>
              </label>
              <label className="flex flex-col gap-1 font-semibold">Password
                <div className="relative">
                  <Icon name="lock" size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-navy/40" />
                  <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-12 pl-11" />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-1.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-navy/50 hover:bg-mist hover:text-brand">
                    <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              </label>
            </>
          )}
          {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
          <button disabled={busy} className="btn w-full gap-2 rounded-xl bg-brand text-white shadow-md transition hover:bg-navy disabled:opacity-60">
            {busy ? 'Please wait...' : challenge ? <>Verify and log in <Icon name="shield" size={18} /></> : <>Log in <Icon name="login" size={18} /></>}
          </button>
          {challenge && (
            <button type="button" onClick={() => { setChallenge(''); setCode(''); setError('') }} className="text-brand underline">
              Back
            </button>
          )}
        </form>
        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-navy/60 hover:text-brand">← Back to the website</Link>
      </div>
    </div>
  )
}