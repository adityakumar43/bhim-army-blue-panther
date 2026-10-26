import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import { DL_CATEGORIES, dlCategory, fileSize } from '../../data/downloads.js'

const EMPTY = { titleHi: '', titleEn: '', descriptionHi: '', descriptionEn: '', category: 'books', order: '' }
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function DownloadsAdmin() {
    const [items, setItems] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [file, setFile] = useState(null)
    const [editing, setEditing] = useState(null)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [formKey, setFormKey] = useState(0)
    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
    const load = () => api.get('/downloads').then(setItems).catch((e) => setError(e.message))
    useEffect(() => { load() }, [])

    function reset() { setForm(EMPTY); setFile(null); setEditing(null); setAdding(false); setFormKey((k) => k + 1) }
    function startEdit(d) {
        setForm({ titleHi: d.titleHi || '', titleEn: d.titleEn || '', descriptionHi: d.descriptionHi || '', descriptionEn: d.descriptionEn || '', category: d.category, order: String(d.order ?? '') })
        setFile(null); setEditing(d); setError(''); setNote(''); setFormKey((k) => k + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function submit(e) {
        e.preventDefault()
        setBusy(true); setError(''); setNote('')
        try {
            const data = new FormData()
            Object.entries(form).forEach(([k, v]) => data.append(k, v))
            if (file) data.append('file', file)
            if (editing) await api.put(`/downloads/${editing._id}`, data)
            else await api.post('/downloads', data)
            setNote('Saved.')
            reset()
            await load()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    async function remove(d) {
        if (!window.confirm(`Delete "${d.titleEn || d.titleHi}"? The file will be removed too.`)) return
        try { await api.del(`/downloads/${d._id}`); if (editing?._id === d._id) reset(); await load() } catch (e) { setError(e.message) }
    }

    const showForm = adding || !!editing
    return (
        <>
            <PageHeader title="Downloads" subtitle="Books, pamphlets, posters and forms that visitors can download from the Downloads page.">
                {!showForm && <button onClick={() => { setAdding(true); setNote('') }} className="abtn-primary">➕ Add file</button>}
            </PageHeader>
            <Notice kind="success">{note}</Notice>

            {showForm && (
                <form key={formKey} onSubmit={submit} className="card mb-6 border-brand/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-extrabold">{editing ? '✏️ Edit file' : '➕ Add a file'}</h2>
                        <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist"><Icon name="close" size={18} /></button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 font-semibold">Title (Hindi)<input value={form.titleHi} onChange={set('titleHi')} maxLength="150" className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold">Title (English)<input value={form.titleEn} onChange={set('titleEn')} maxLength="150" className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold">Short description (Hindi, optional)<input value={form.descriptionHi} onChange={set('descriptionHi')} maxLength="400" className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold">Short description (English, optional)<input value={form.descriptionEn} onChange={set('descriptionEn')} maxLength="400" className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold">Category
                            <select value={form.category} onChange={set('category')} className="input">
                                {DL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.en}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 font-semibold">Order (1 shows first)<input type="number" min="0" value={form.order} onChange={set('order')} className="input" /></label>
                        <label className="flex flex-col gap-1 font-semibold sm:col-span-2">
                            📎 {editing ? 'Replace file (leave empty to keep the current one)' : 'File'}
                            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required={!editing}
                                onChange={(e) => setFile(e.target.files[0] || null)} className="file-pick" />
                            <span className="text-xs font-normal text-navy/60">PDF, JPG, PNG or WebP, up to 10 MB</span>
                        </label>
                    </div>
                    {error && <div className="mt-3"><Notice>{error}</Notice></div>}
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={reset} className="abtn min-h-11">Cancel</button>
                        <button disabled={busy} className="abtn-primary min-h-11 px-6">{busy ? 'Uploading...' : editing ? '💾 Save changes' : '✅ Upload'}</button>
                    </div>
                </form>
            )}

            {!showForm && <Notice>{error}</Notice>}
            <h2 className="mb-3 text-lg font-extrabold">📂 All files {items && `(${items.length})`}</h2>
            {!items && <p>Loading...</p>}
            {items?.length === 0 && <p className="card text-center text-navy/70">📭 No files yet. Click "Add file" to upload the first one.</p>}
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items?.map((d) => {
                    const c = dlCategory(d.category)
                    return (
                        <li key={d._id} className={`card flex gap-3 p-4 sm:p-4 ${editing?._id === d._id ? 'ring-2 ring-brand' : ''}`}>
                            {d.preview
                                ? <img src={d.preview} alt="" className="h-20 w-16 shrink-0 object-cover" />
                                : <span aria-hidden="true" className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-mist text-3xl">{d.format === 'pdf' ? '📕' : c.emoji}</span>}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="line-clamp-2 font-bold">{d.titleHi || d.titleEn}</div>
                                <div className="text-xs text-navy/60">{c.emoji} {c.en} · {(d.format || '').toUpperCase()} {fileSize(d.bytes)}</div>
                                <div className="text-xs font-semibold text-brand">📥 {d.count || 0} downloads</div>
                                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                    <a href={`${BASE}/downloads/${d._id}/file`} target="_blank" rel="noreferrer" className="abtn min-h-8 px-2 text-xs">👁️ Open</a>
                                    <button onClick={() => startEdit(d)} className="abtn min-h-8 px-2 text-xs">✏️ Edit</button>
                                    <button onClick={() => remove(d)} className="abtn-danger min-h-8 px-2 text-xs">🗑️ Delete</button>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}
