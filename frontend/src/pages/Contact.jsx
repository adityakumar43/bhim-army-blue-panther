import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api.js'
import Consent from '../components/Consent.jsx'
import Icon from '../components/Icon.jsx'

const PHONE_OK = /^[6-9]\d{9}$/
const EMAIL_OK = /^\S+@\S+\.\S+$/
const MAX = 2000

// What the message is about. Saved with the message, so the team can filter by it.
const TOPICS = [
  ['general', '💬', 'General'],
  ['membership', '🪪', 'Membership'],
  ['event', '📅', 'Event / programme'],
  ['media', '📰', 'Media / press'],
  ['other', '✏️', 'Other'],
]

// What Google Maps searches for each office. In English, so the pin is found the same way in Hindi and English.
// If a pin is in the wrong place, make the search more exact here (or paste "lat,long" from Google Maps).
const MAP_SEARCH = {
  head: 'Sudarshan Complex, Pithampur, Madhya Pradesh',
  delhi: 'C-32, New Gopal Nagar, Najafgarh, New Delhi 110043',
}
const mapLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// Common questions. The answers are in the locale files, so they can be changed without touching code.
const FAQ = [
  ['join', '/join'],
  ['status', '/membership/status'],
  ['card', '/membership/status'],
  ['volunteer', '/volunteer'],
  ['problem', '/help'],
  ['donate', '/donate'],
]
const FAQ_EN = {
  join: ['How do I become a member?', 'Fill the membership form on the Join page with your details and photo. Our team reviews every application.'],
  status: ['I have applied. How do I know if I am approved?', 'Open the "Check status" page and enter your mobile number and date of birth. It shows whether your application is under review or approved.'],
  card: ['How do I get my membership card?', 'Once you are approved, your membership card opens from the "Check status" page. You can print it at ID-card size and laminate it. If you gave an email, the card is also emailed to you.'],
  volunteer: ['How can I become a volunteer?', 'Fill the volunteer form and choose how you would like to help. Our team will contact you.'],
  problem: ['I have a problem and need the organisation\'s help. What do I do?', 'Raise a request at the help desk. You get a reference number to follow up on it.'],
  donate: ['How can I support the organisation with a donation?', 'Use the Donate page to give online. You get a receipt for your donation.'],
}

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', website: '' })
  const [topic, setTopic] = useState('general')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false) // the "I agree" tick box
  const [done, setDone] = useState(false)
  const set = (f, clean = (v) => v) => (e) => setForm((old) => ({ ...old, [f]: clean(e.target.value) }))

  const phoneOk = PHONE_OK.test(form.phone)
  const emailOk = EMAIL_OK.test(form.email)
  const topicLabel = (key) => t(`contact.topic_${key}`, { defaultValue: TOPICS.find((x) => x[0] === key)[2] })

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.phone && !phoneOk) return setError(t('join.phoneHint', { defaultValue: '10-digit mobile number starting with 6, 7, 8 or 9' }))
    if (form.email && !emailOk) return setError(t('contact.badEmail', { defaultValue: 'Please check your email address.' }))
    if (!form.phone && !form.email) return setError(t('contact.needOne', { defaultValue: 'Give a mobile number or an email so we can reply to you.' }))
    if (!agree) return setError(t('privacy.needAgree', { defaultValue: 'Please tick the box to agree before sending.' }))
    setBusy(true)
    try {
      await api.post('/contact', { ...form, topic, message: form.message.trim(), consent: true })
      setDone(true)
      setAgree(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // [icon, name, address, what to search on Google Maps, show a map below the form?]
  const offices = [
    ['🏛️', t('offices.head'), t('offices.headAddress'), MAP_SEARCH.head, true],
    ['🏢', t('offices.delhi'), t('offices.delhiAddress'), MAP_SEARCH.delhi, true],

  ]
  const quick = [
    ['/help', '🆘', t('contact.quickHelp', { defaultValue: 'Need help with a problem?' }), t('contact.quickHelpBody', { defaultValue: 'Raise a request at the help desk' })],
    ['/join', '✊', t('contact.quickJoin', { defaultValue: 'Want to join us?' }), t('contact.quickJoinBody', { defaultValue: 'Fill the membership form' })],
    ['/membership/status', '🔍', t('contact.quickStatus', { defaultValue: 'Already applied?' }), t('contact.quickStatusBody', { defaultValue: 'Check your application status' })],
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-10">
        {/* Left: where we are, and faster ways to get help (below the form on phones) */}
        <aside className="order-2 flex flex-col gap-5 lg:order-1">
          <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="building" size={20} /></span>
              {t('contact.offices', { defaultValue: 'Our offices' })}
            </h2>
            <ul className="flex flex-col gap-4">
              {offices.map(([icon, title, address, search]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 text-lg" aria-hidden="true">{icon}</span>
                  <div>
                    <div className="font-bold text-brand">{title}</div>
                    <div className="text-sm leading-relaxed text-navy/75">{address}</div>
                    <a href={mapLink(search)} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex text-xs font-semibold text-brand underline">🗺️ {t('contact.map', { defaultValue: 'Open in Maps' })}</a>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-navy to-brand p-5 text-white shadow-md sm:p-6">
            <h2 className="mb-3 font-extrabold">⚡ {t('contact.faster', { defaultValue: 'Get it done faster' })}</h2>
            <ul className="flex flex-col gap-2">
              {quick.map(([to, icon, title, body]) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 transition hover:bg-white/20">
                    <span className="text-xl" aria-hidden="true">{icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="block text-xs text-white/75">{body}</span>
                    </span>
                    <span aria-hidden="true" className="text-gold">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* Right: the form (first on phones) */}
        <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          {done ? (
            <section aria-live="polite" className="flex flex-col items-center justify-center rounded-2xl border border-green-300 bg-green-50 p-8 text-center shadow-sm lg:min-h-[28rem]">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700" aria-hidden="true"><Icon name="check" size={32} /></span>
              <h2 className="mt-3 text-2xl font-extrabold text-green-900">{t('contact.doneTitle')}</h2>
              <p className="mt-2 text-navy/80">{t('contact.doneBody')}</p>
              {form.email && <p className="mt-1 text-sm text-navy/65">📧 {t('contact.doneEmail', { defaultValue: 'We have also sent a confirmation to your email.' })}</p>}
              <p className="mt-2 font-semibold text-gold">{t('greeting', { defaultValue: 'Jai Bhim' })} 🙏</p>
              <button type="button" onClick={() => { setDone(false); setForm({ name: '', phone: '', email: '', message: '', website: '' }); setTopic('general') }}
                className="mt-6 text-sm font-semibold text-brand underline">{t('contact.another', { defaultValue: 'Send another message' })}</button>
            </section>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-8">
              <h2 className="mb-1 flex items-center gap-3 text-lg font-extrabold">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist text-brand" aria-hidden="true"><Icon name="mail" size={20} /></span>
                {t('contact.formTitle', { defaultValue: 'Send us a message' })}
              </h2>
              <p className="mb-5 text-sm text-navy/60">{t('contact.formIntro', { defaultValue: 'We read every message and reply on your mobile or email.' })}</p>

              <fieldset>
                <legend className="mb-2 font-semibold">{t('contact.topic', { defaultValue: 'What is it about?' })}</legend>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(([key, icon]) => (
                    <button key={key} type="button" onClick={() => setTopic(key)} aria-pressed={topic === key}
                      className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition ${topic === key ? 'border-brand bg-brand text-white shadow-md shadow-brand/20' : 'border-navy/15 bg-white text-navy/75 hover:border-brand/40 hover:bg-mist'}`}>
                      <span aria-hidden="true">{icon}</span> {topicLabel(key)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 flex flex-col gap-1.5 font-semibold">{t('contact.name')}
                <span className="relative block">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">👤</span>
                  <input required maxLength="80" value={form.name} onChange={set('name')} autoComplete="name" className="input pl-10" />
                </span>
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 font-semibold">{t('contact.phone')}
                  <span className="relative block">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 rounded-md bg-mist px-1.5 py-0.5 text-sm font-bold text-brand">+91</span>
                    <input type="tel" inputMode="numeric" maxLength="15" placeholder="12345 67890" value={form.phone} autoComplete="tel-national"
                      onChange={set('phone', (v) => v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(0, 10))}
                      className="input pr-9 pl-14 tracking-wide" />
                    {phoneOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
                  </span>
                </label>
                <label className="flex flex-col gap-1.5 font-semibold">{t('contact.email')}
                  <span className="relative block">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" aria-hidden="true">📧</span>
                    <input type="email" placeholder="name@gmail.com" value={form.email} onChange={set('email', (v) => v.trim())} autoComplete="email" className="input pr-9 pl-10" />
                    {emailOk && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-bold text-green-600" aria-hidden="true">✓</span>}
                  </span>
                </label>
              </div>
              <p className="mt-1.5 text-xs text-navy/55">ℹ️ {t('contact.needOne', { defaultValue: 'Give a mobile number or an email so we can reply to you.' })}</p>

              <label className="mt-4 flex flex-col gap-1.5 font-semibold">{t('contact.message')}
                <textarea required rows="5" maxLength={MAX} value={form.message} onChange={set('message')}
                  placeholder={t('contact.messageHint', { defaultValue: 'Write your message here…' })} className="input resize-y" />
              </label>
              <div className={`mt-1 text-right text-xs ${form.message.length > MAX - 100 ? 'font-bold text-red-600' : 'text-navy/50'}`}>{form.message.length} / {MAX}</div>

              {/* Hidden from people; bots fill it and their message is dropped */}
              <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" value={form.website}
                onChange={set('website')} className="absolute -left-2499.75 h-0 w-0 opacity-0" />

              <div className="mt-4">
                <Consent checked={agree} onChange={(v) => { setAgree(v); setError('') }} error={!!error && !agree}
                  text={t('privacy.agreeContact', { defaultValue: 'I agree that my details are used to reply to my message, as explained in the Privacy Policy.' })} />
              </div>

              {error && <p role="alert" className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span aria-hidden="true">⚠️</span>{error}</p>}

              <button disabled={busy} className="btn mt-5 w-full gap-2 bg-brand text-white shadow-md hover:bg-navy disabled:opacity-60">
                <span aria-hidden="true">📨</span> {busy ? t('contact.sending') : t('contact.send')}
              </button>
              <p className="mt-3 text-center text-xs text-navy/55">🔒 {t('contact.privacy', { defaultValue: 'Your details are only used to reply to you.' })}</p>
            </form>
          )}
        </div>
      </div>



      {/* Common questions: answers people often need, before they write to us */}
      <section className="mt-16 border-t border-navy/10 pt-12 sm:mt-20 sm:pt-16">
        <h2 className="mb-1 text-center text-2xl font-extrabold">❓ {t('contact.faqTitle', { defaultValue: 'Common questions' })}</h2>
        <p className="mb-6 text-center text-navy/60">{t('contact.faqIntro', { defaultValue: 'Your answer may already be here.' })}</p>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {FAQ.map(([key, to]) => (
            <details key={key} className="group rounded-2xl border border-navy/10 bg-white shadow-sm open:border-brand/30 open:shadow-md">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 font-bold [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{t(`contact.faq.${key}.q`, { defaultValue: FAQ_EN[key][0] })}</span>
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-lg text-brand transition group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-4 text-navy/80">
                <p>{t(`contact.faq.${key}.a`, { defaultValue: FAQ_EN[key][1] })}</p>
                <Link to={to} className="mt-2 inline-flex font-semibold text-brand underline">{t('contact.faqGo', { defaultValue: 'Go there' })} →</Link>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
