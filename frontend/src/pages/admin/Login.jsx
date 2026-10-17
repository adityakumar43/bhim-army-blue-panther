import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [challenge, setChallenge] = useState('') // set after the password step when two-step login is on
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
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
    <div className="flex min-h-screen items-center justify-center bg-brand px-5 py-10">
      <div className="w-full max-w-md bg-white p-6 sm:p-8">
        <p className="font-semibold text-brand">Bhim Army Blue Panther</p>
        <h1 className="mb-6 text-3xl font-extrabold">Admin login</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {challenge ? (
            <label className="flex flex-col gap-1 font-semibold">
              6-digit code from your authenticator app
              <input inputMode="numeric" autoComplete="one-time-code" autoFocus required maxLength="7" placeholder="123456"
                value={code} onChange={(e) => setCode(e.target.value)} className="input text-center text-2xl tracking-widest" />
            </label>
          ) : (
            <>
              <label className="flex flex-col gap-1 font-semibold">Email
                <input type="email" required autoComplete="username" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 font-semibold">Password
                <input type="password" required autoComplete="current-password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
              </label>
            </>
          )}
          {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-900">{error}</p>}
          <button disabled={busy} className="btn bg-brand text-white disabled:opacity-60">
            {busy ? 'Please wait...' : challenge ? 'Verify and log in' : 'Log in'}
          </button>
          {challenge && (
            <button type="button" onClick={() => { setChallenge(''); setCode(''); setError('') }} className="text-brand underline">
              Back
            </button>
          )}
        </form>
        <Link to="/" className="mt-6 inline-block text-brand underline">Back to the website</Link>
      </div>
    </div>
  )
}