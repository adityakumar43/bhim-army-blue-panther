import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

export default function Security() {
  const [enabled, setEnabled] = useState(null)
  const [setup, setSetup] = useState(null) // { qr, secret } while setting up
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const { me, refreshMe } = useOutletContext()

  useEffect(() => {
    api.get('/auth/me').then((r) => setEnabled(!!r.admin.twoFactorEnabled)).catch((e) => setError(e.message))
  }, [])

  async function run(fn) {
    setBusy(true)
    setError('')
    setNote('')
    try { await fn() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const start = () => run(async () => { setSetup(await api.post('/auth/2fa/setup')); setCode('') })

  const enable = (e) => {
    e.preventDefault()
    run(async () => {
      await api.post('/auth/2fa/enable', { code })
      await refreshMe()
      setEnabled(true); setSetup(null); setCode('')
      setNote('Two-step login is now ON. From the next login, you will need a code from your app.')
    })
  }

  const disable = (e) => {
    e.preventDefault()
    run(async () => {
      await api.post('/auth/2fa/disable', { password, code })
      await refreshMe()
      setEnabled(false); setPassword(''); setCode('')
      setNote('Two-step login is now OFF.')
    })
  }

  return (
    <>
      <PageHeader title="Security" subtitle="Protect your account so a stolen password is not enough to log in." />
      {me.twoFactorRequired && !enabled && (
        <p role="alert" className="mb-4 border border-gold bg-gold/20 p-3 font-semibold">
          Two-step login is required for your role. Set it up now to continue using the admin panel.
        </p>
      )}
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {enabled === null && !error && <p>Loading...</p>}

      {enabled !== null && (
        <section className="card max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold">Two-step login</h2>
            <Pill tone={enabled ? 'green' : 'gold'}>{enabled ? 'ON' : 'OFF'}</Pill>
          </div>

          {!enabled && !setup && (
            <>
              <p className="mb-4">
                After your password, the site asks for a 6-digit code that changes every 30 seconds and appears only on your phone.
                Someone who learns your password still cannot log in.
              </p>
              <button onClick={start} disabled={busy} className="abtn-primary">Set up two-step login</button>
            </>
          )}

          {!enabled && setup && (
            <form onSubmit={enable} className="flex flex-col gap-4">
              <ol className="list-decimal pl-5">
                <li>Install an authenticator app on your phone (Google Authenticator, Microsoft Authenticator or Authy).</li>
                <li>In the app, choose to add an account and scan this picture.</li>
                <li>Type the 6-digit code the app shows.</li>
              </ol>
              <img src={setup.qr} alt="QR code for your authenticator app" className="h-52 w-52 border border-brand/15" />
              <p className="text-sm">Cannot scan? Type this key into the app instead: <code className="break-all font-semibold">{setup.secret}</code></p>
              <label className="flex flex-col gap-1 font-semibold">6-digit code
                <input inputMode="numeric" autoComplete="one-time-code" required maxLength="7" placeholder="123456"
                  value={code} onChange={(e) => setCode(e.target.value)} className="input max-w-xs" />
              </label>
              <div className="flex gap-3">
                <button disabled={busy} className="abtn-primary">Turn on</button>
                <button type="button" onClick={() => { setSetup(null); setCode('') }} className="abtn">Cancel</button>
              </div>
            </form>
          )}


          {enabled && me.twoFactorRequired && (
            <p>Two-step login is required for your role, so it cannot be turned off. If you change phones, ask another super admin to reset it, then set it up again.</p>
          )}

          {enabled && !me.twoFactorRequired && (
            <form onSubmit={disable} className="flex flex-col gap-4">
              <p>To turn it off, enter your password and the current code from your app.</p>
              <label className="flex flex-col gap-1 font-semibold">Password
                <input type="password" required autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input max-w-xs" />
              </label>
              <label className="flex flex-col gap-1 font-semibold">6-digit code
                <input inputMode="numeric" autoComplete="one-time-code" required maxLength="7" value={code}
                  onChange={(e) => setCode(e.target.value)} className="input max-w-xs" />
              </label>
              <div><button disabled={busy} className="abtn-danger">Turn off two-step login</button></div>
              <p className="text-sm text-navy/70">
                Lost your phone? Another super admin can reset it from the Team &amp; roles page.
              </p>
            </form>
          )}
        </section>
      )}
    </>
  )
}