import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice } from './ui.jsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

// Remember on this computer when the last backup was downloaded
const LAST_KEY = 'lastBackupAt'
const readLast = () => { try { return localStorage.getItem(LAST_KEY) } catch { return null } }
const saveLast = () => { try { localStorage.setItem(LAST_KEY, new Date().toISOString()) } catch { /* storage blocked */ } }

export default function Backup() {
    const [counts, setCounts] = useState(null)
    const [busy, setBusy] = useState('')
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [last, setLast] = useState(readLast)

    useEffect(() => { api.get('/backup/summary').then(setCounts).catch((e) => setError(e.message)) }, [])

    async function download(kind) {
        setBusy(kind)
        setError('')
        setNote('')
        try {
            let token = null
            try { token = localStorage.getItem('token') } catch { /* storage blocked */ }
            const res = await fetch(`${BASE}/backup/${kind}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Download failed')
            const blob = await res.blob()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `bluepanther-backup-${today()}.${kind === 'excel' ? 'xlsx' : 'json'}`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
            saveLast()
            setLast(readLast())
            setNote('Backup downloaded. Keep it somewhere safe, like Google Drive or a pen drive.')
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy('')
        }
    }

    const days = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null
    const total = counts?.reduce((n, c) => n + c.count, 0) || 0

    return (
        <>
            <PageHeader title="Backup" subtitle="Download a copy of all your website data, so nothing is lost if something goes wrong." />
            <Notice>{error}</Notice>
            <Notice kind="success">{note}</Notice>

            <p className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${days === null || days > 7 ? 'bg-gold/15 text-navy' : 'bg-green-50 text-green-900'}`}>
                <span aria-hidden="true">{days === null || days > 7 ? '⚠️' : '✅'}</span>
                {days === null ? 'No backup downloaded from this computer yet.'
                    : days === 0 ? 'Last backup downloaded today.'
                        : `Last backup downloaded ${days} day${days === 1 ? '' : 's'} ago${days > 7 ? '. Time for a new one!' : '.'}`}
            </p>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="card flex flex-col">
                    <div className="mb-2 text-3xl" aria-hidden="true">📊</div>
                    <h2 className="text-lg font-extrabold">Excel backup</h2>
                    <p className="mt-1 flex-1 text-sm text-navy/70">One Excel file with a separate sheet for members, donations, messages, leaders, news and more. Easy to open and read.</p>
                    <button onClick={() => download('excel')} disabled={!!busy} className="abtn-primary mt-4 min-h-11">
                        {busy === 'excel' ? 'Preparing...' : '📥 Download Excel (.xlsx)'}
                    </button>
                </div>
                <div className="card flex flex-col">
                    <div className="mb-2 text-3xl" aria-hidden="true">🗄️</div>
                    <h2 className="text-lg font-extrabold">Full data backup</h2>
                    <p className="mt-1 flex-1 text-sm text-navy/70">Everything exactly as it is stored. Not for reading: keep it so the database can be restored if it is ever lost.</p>
                    <button onClick={() => download('json')} disabled={!!busy} className="abtn mt-4 min-h-11">
                        {busy === 'json' ? 'Preparing...' : '📥 Download full backup (.json)'}
                    </button>
                </div>
            </div>

            {counts && (
                <section className="card">
                    <h2 className="mb-3 font-extrabold">📦 What is included ({total.toLocaleString('en-IN')} records)</h2>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {counts.map((c) => (
                            <li key={c.name} className="flex items-center justify-between rounded-xl bg-mist/50 px-3 py-2 text-sm">
                                <span className="font-semibold">{c.name}</span>
                                <span className="text-navy/70">{c.count.toLocaleString('en-IN')}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-navy/55">🔒 Passwords and two-step login keys are never included. Photos stay safe on Cloudinary; the backup keeps their links.</p>
                </section>
            )}
        </>
    )
}
