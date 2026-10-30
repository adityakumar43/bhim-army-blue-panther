import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { Notice, ListLoading } from './ui.jsx'
import Icon from '../../components/Icon.jsx'

// Pop-up list of everyone who registered for one event, with Excel download
export default function RsvpList({ event, onClose, onChange }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const title = event.titleHi || event.titleEn || 'Event'

  const load = () => api.get(`/rsvp/${event._id}/list`).then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [event._id])
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function remove(r) {
    if (!window.confirm(`Remove ${r.name} from this list?`)) return
    try { await api.del(`/rsvp/${event._id}/${r._id}`); await load(); onChange?.() } catch (e) { setError(e.message) }
  }

  function downloadCsv() {
    const rows = [['Name', 'Phone', 'District', 'People', 'Registered on'],
      ...items.map((r) => [r.name, r.phone, r.district, r.people, new Date(r.createdAt).toLocaleString('en-IN')])]
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `attending-${(event.titleEn || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const total = (items || []).reduce((n, r) => n + (r.people || 1), 0)

  return (
    <div role="dialog" aria-modal="true" aria-label={`People attending ${title}`} className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-brand/10 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold">🙋 {title}</h2>
            {items && <p className="text-sm text-navy/65">👥 {total} people coming · {items.length} registrations</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {items?.length > 0 && <button onClick={downloadCsv} className="abtn min-h-9 px-3">📥 Excel</button>}
            <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-mist"><Icon name="close" size={18} /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">
          <Notice>{error}</Notice>
          {!items && !error && <ListLoading />}
          {items?.length === 0 && <p className="text-center text-navy/70">📭 Nobody has registered yet.</p>}
          {items?.length > 0 && (
            <ul className="divide-y divide-brand/10">
              {items.map((r) => (
                <li key={r._id} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{r.name?.[0]?.toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{r.name} {r.people > 1 && <span className="rounded-full bg-mist px-2 text-xs text-brand">+{r.people - 1}</span>}</div>
                    <div className="text-xs text-navy/60">
                      <a href={`tel:${r.phone}`} className="hover:underline">📞 {r.phone}</a>{r.district ? ` · 📍 ${r.district}` : ''}
                    </div>
                  </div>
                  <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noreferrer" className="abtn min-h-8 border-green-300 px-2 text-green-800">💬</a>
                  <button onClick={() => remove(r)} aria-label={`Remove ${r.name}`} className="abtn-danger min-h-8 px-2">🗑️</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
