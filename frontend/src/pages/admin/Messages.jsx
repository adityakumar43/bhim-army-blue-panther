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
      {items?.length === 0 && <p className="text-navy/70">No messages yet.</p>}
      <ul className="flex flex-col gap-4">
        {items?.map((m) => (
          <li key={m._id} className={`card ${m.read ? '' : 'border-brand bg-mist'}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{m.name}</span>
                {!m.read && <Pill tone="gold">New</Pill>}
              </div>
              <span className="text-sm text-navy/70">{new Date(m.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div className="text-sm text-navy/80">{[m.phone, m.email].filter(Boolean).join(' · ')}</div>
            <p className="mt-3 whitespace-pre-line">{m.message}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => act(() => api.patch(`/contact/${m._id}/read`, { read: !m.read }))} className="abtn">
                {m.read ? 'Mark as unread' : 'Mark as read'}
              </button>
              <button onClick={() => remove(m._id)} className="abtn-danger">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
