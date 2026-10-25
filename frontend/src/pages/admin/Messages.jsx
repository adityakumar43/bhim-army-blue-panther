import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, Pill } from './ui.jsx'

export default function Messages() {
  const { refresh } = useOutletContext()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

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
      {!items && !error && <p>Loading...</p>}
      {items?.length === 0 && <p className="card text-center text-navy/70">📭 No messages yet.</p>}
      <ul className="flex flex-col gap-3">
        {items?.map((m) => (
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
                  </div>
                  <span className="text-xs text-navy/60">🕒 {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-navy/70">
                  {m.phone && <a href={`tel:${m.phone}`} className="hover:text-brand hover:underline">📞 {m.phone}</a>}
                  {m.email && <a href={`mailto:${m.email}`} className="break-all hover:text-brand hover:underline">✉️ {m.email}</a>}
                </div>
                <p className="mt-3 rounded-xl bg-white px-3 py-2 whitespace-pre-line text-navy/90 ring-1 ring-brand/10">{m.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
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
