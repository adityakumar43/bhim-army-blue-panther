import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import LoginHistory from './LoginHistory.jsx'

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

  const codeBox = 'input text-center text-lg font-bold tracking-[0.4em] placeholder:tracking-[0.4em]'
  const STEPS = [
    ['📲', 'Install an authenticator app on your phone (Google Authenticator, Microsoft Authenticator or Authy).'],
    ['📷', 'In the app, choose to add an account and scan this picture.'],
    ['🔢', 'Type the 6-digit code the app shows.'],
  ]

  return (
    <>
      <PageHeader title="Security" subtitle="Protect your account so a stolen password is not enough to log in." />
      {me.twoFactorRequired && !enabled && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-gold bg-gold/15 p-3 font-semibold">
          <span aria-hidden="true">⚠️</span>
          Two-step login is required for your role. Set it up now to continue using the admin panel.
        </p>
      )}
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {enabled === null && !error && <p>Loading...</p>}

      {enabled !== null && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="card">
            {/* Status */}
            <div className={`mb-5 flex items-center gap-4 rounded-2xl p-4 ${enabled ? 'bg-green-50' : 'bg-gold/10'}`}>
              <span aria-hidden="true" className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${enabled ? 'bg-green-600' : 'bg-gold'}`}>
                <Icon name={enabled ? 'shield' : 'lock'} size={28} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold">🔐 Two-step login</h2>
                  <Pill tone={enabled ? 'green' : 'gold'}>{enabled ? '✅ ON' : '⚠️ OFF'}</Pill>
                </div>
                <p className="text-sm text-navy/70">
                  {enabled ? 'Your account is protected by your password and a code from your phone.' : 'Your account is protected by a password only.'}
                </p>
              </div>
            </div>

            {!enabled && !setup && (
              <>
                <p className="mb-4 text-navy/85">
                  After your password, the site asks for a 6-digit code that changes every 30 seconds and appears only on your phone.
                  Someone who learns your password still cannot log in.
                </p>
                <button onClick={start} disabled={busy} className="abtn-primary min-h-11 px-5">🚀 Set up two-step login</button>
              </>
            )}

            {!enabled && setup && (
              <form onSubmit={enable} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
                <ol className="flex flex-col gap-2">
                  {STEPS.map(([emoji, text], i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-mist/50 p-3 text-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                      <span><span aria-hidden="true">{emoji} </span>{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col items-center gap-2 md:row-span-2">
                  <img src={setup.qr} alt="QR code for your authenticator app" className="h-48 w-48 rounded-xl border border-brand/15 bg-white p-2 shadow-sm" />
                  <p className="max-w-48 text-center text-xs text-navy/60">Cannot scan? Type this key into the app instead:</p>
                  <code className="max-w-48 rounded-lg bg-mist px-2 py-1 text-center text-xs font-semibold break-all">{setup.secret}</code>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm font-semibold">6-digit code
                    <input inputMode="numeric" autoComplete="one-time-code" required maxLength="7" placeholder="123456"
                      value={code} onChange={(e) => setCode(e.target.value)} className={`${codeBox} max-w-xs`} />
                  </label>
                  <div className="flex gap-3">
                    <button disabled={busy} className="abtn-primary min-h-11 px-5">✅ Turn on</button>
                    <button type="button" onClick={() => { setSetup(null); setCode('') }} className="abtn min-h-11">Cancel</button>
                  </div>
                </div>
              </form>
            )}

            {enabled && me.twoFactorRequired && (
              <p className="rounded-xl bg-mist/60 p-3 text-sm text-navy/80">
                🛡️ Two-step login is required for your role, so it cannot be turned off. If you change phones, ask another super admin to reset it, then set it up again.
              </p>
            )}

            {enabled && !me.twoFactorRequired && (
              <form onSubmit={disable} className="flex flex-col gap-3">
                <p className="text-sm text-navy/80">To turn it off, enter your password and the current code from your app.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 font-semibold">Password
                    <input type="password" required autoComplete="current-password" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="input" />
                  </label>
                  <label className="flex flex-col gap-1 font-semibold">6-digit code
                    <input inputMode="numeric" autoComplete="one-time-code" required maxLength="7" placeholder="123456" value={code}
                      onChange={(e) => setCode(e.target.value)} className={codeBox} />
                  </label>
                </div>
                <div><button disabled={busy} className="abtn-danger min-h-11">🔓 Turn off two-step login</button></div>
                <p className="text-xs text-navy/60">📱 Lost your phone? Another super admin can reset it from the Team &amp; roles page.</p>
              </form>
            )}
          </section>

          {/* Tips */}
          <aside className="card p-5">
            <h2 className="mb-3 font-extrabold">💡 Stay safe</h2>
            <ul className="flex flex-col gap-2.5 text-sm text-navy/80">
              <li>🔑 Use a long password that you don't use on any other website.</li>
              <li>🙅 Never share your password or 6-digit code, not even with other admins.</li>
              <li>💻 Log out when you use a shared or public computer.</li>
              <li>👤 Each person should have their own account. Logging in somewhere else logs out the old device.</li>
            </ul>
          </aside>
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-1 text-lg font-extrabold">🕘 Your recent logins</h2>
        <p className="mb-3 text-sm text-navy/60">If you see a login you don't recognise, change your password at once and tell a super admin.</p>
        <LoginHistory mine limit={10} />
      </section>
    </>
  )
}
