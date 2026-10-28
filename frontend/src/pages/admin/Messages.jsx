import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'



const TOPICS = { general: '💬 General', membership: '🪪 Membership', event: '📅 Event', media: '📰 Media', other: '✏️ Other' }

export default function Messages() {
  const { refresh } = useOutletContext()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const [note, setNote] = useState('')
  const [replyFor, setReplyFor] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [topic, setTopic] = useState('')

  const openReply = (m) => { setReplyFor(m._id); setReplyText(`Jai Bhim ${m.name},\n\n`); setNote(''); setError('') }

  async function sendReply(m) {
    setSending(true)
    setError('')
    setNote('')
    try {
      await api.post(`/contact/${m._id}/reply`, { text: replyText })
      setNote(`Reply emailed to ${m.email}.`)
      setReplyFor(null)
      await load()
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const load = () => api.get('/contact').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  async function act(fn) {
    try {
      await fn()
      await load()
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = (id) => {
    if (window.confirm('Delete this message permanently?')) act(() => api.del(`/contact/${id}`))
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Messages sent from the Contact page. Unread ones are highlighted." />
      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No messages yet.</p>}
      {items?.length > 0 && (
        <div role="group" aria-label="Filter by topic" className="mb-4 flex flex-wrap gap-1.5">
          {[['', '📬 All'], ...Object.entries(TOPICS)].map(([key, label]) => {
            const n = key ? items.filter((m) => (m.topic || 'general') === key).length : items.length
            return (
              <button key={key || 'all'} onClick={() => setTopic(key)} aria-pressed={topic === key}
                className={`min-h-9 rounded-full border px-3 text-sm font-semibold transition ${topic === key ? 'border-brand bg-brand text-white' : 'border-brand/15 bg-white text-navy/75 hover:bg-mist'}`}>
                {label} <span className="opacity-70">({n})</span>
              </button>
            )
          })}
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {items?.filter((m) => !topic || (m.topic || 'general') === topic).map((m) => (
          <li key={m._id} className={`card p-4 sm:p-5 ${m.read ? '' : 'border-l-4 border-brand bg-mist/50'}`}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold text-white ${m.read ? 'bg-navy/40' : 'bg-brand'}`}>
                {m.name?.[0]?.toUpperCase() || '?'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg leading-tight font-bold">{m.name}</span>
                    {!m.read && <Pill tone="gold">🆕 New</Pill>}
                    {m.topic && m.topic !== 'general' && <Pill tone="blue">{TOPICS[m.topic] || m.topic}</Pill>}
                  </div>
                  <span className="text-xs text-navy/60">🕒 {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-navy/70">
                  {m.phone && <a href={`tel:${m.phone}`} className="hover:text-brand hover:underline">📞 {m.phone}</a>}
                  {m.email && <a href={`mailto:${m.email}`} className="break-all hover:text-brand hover:underline">✉️ {m.email}</a>}
                </div>
                <p className="mt-3 rounded-xl bg-white px-3 py-2 whitespace-pre-line text-navy/90 ring-1 ring-brand/10">{m.message}</p>

                {/* Replies already sent */}
                {m.replies?.map((r, i) => (
                  <div key={i} className="mt-2 ml-4 rounded-xl border-l-4 border-green-400 bg-green-50 px-3 py-2 text-sm">
                    <div className="mb-0.5 text-xs font-semibold text-green-800">
                      ↩️ Replied by {r.byName || 'an admin'} · {new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <p className="whitespace-pre-line text-navy/85">{r.text}</p>
                  </div>
                ))}

                {replyFor === m._id && (
                  <div className="mt-3 rounded-xl bg-white p-3 ring-2 ring-brand/30">
                    <label className="flex flex-col gap-1 text-sm font-semibold">✉️ Reply to {m.email}
                      <textarea rows="5" value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength="5000" autoFocus
                        className="input min-h-28 py-2 font-normal" />
                    </label>
                    <p className="mt-1 text-xs text-navy/55">Their original message is added below your reply automatically.</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setReplyFor(null)} className="abtn min-h-9 px-3">Cancel</button>
                      <button onClick={() => sendReply(m)} disabled={sending || !replyText.trim()} className="abtn-primary min-h-9 px-4">
                        {sending ? 'Sending...' : '📤 Send reply'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {m.email && replyFor !== m._id && (
                    <button onClick={() => openReply(m)} className="abtn-primary min-h-9 px-3">↩️ Reply by email</button>
                  )}
                  {m.phone && (
                    <a href={`https://wa.me/91${String(m.phone).replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
                      className="abtn min-h-9 border-green-300 px-3 text-green-800 hover:border-green-500 hover:text-green-900">💬 WhatsApp</a>
                  )}
                  <button onClick={() => act(() => api.patch(`/contact/${m._id}/read`, { read: !m.read }))} className="abtn min-h-9 px-3">
                    {m.read ? '↩️ Mark as unread' : '✔️ Mark as read'}
                  </button>
                  <button onClick={() => remove(m._id)} className="abtn-danger min-h-9 px-3">🗑️ Delete</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
