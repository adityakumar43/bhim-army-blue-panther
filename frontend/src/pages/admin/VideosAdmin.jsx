import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import { PageHeader, Notice, ListLoading } from './ui.jsx'
import Icon from '../../components/Icon.jsx'
import { VIDEO_CATEGORIES, videoCategory, youtubeId, thumb } from '../../data/videos.js'

const EMPTY = { link: '', titleHi: '', titleEn: '', category: 'speeches', order: '' }

export default function VideosAdmin() {
    const [items, setItems] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [editing, setEditing] = useState(null)
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
    const load = () => api.get('/videos').then(setItems).catch((e) => setError(e.message))
    useEffect(() => { load() }, [])
    const id = youtubeId(form.link)

    function reset() { setForm(EMPTY); setEditing(null); setAdding(false) }
    function startEdit(v) {
        setForm({ link: `https://youtu.be/${v.youtubeId}`, titleHi: v.titleHi || '', titleEn: v.titleEn || '', category: v.category, order: String(v.order ?? '') })
        setEditing(v); setError(''); setNote('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function submit(e) {
        e.preventDefault()
        setBusy(true); setError(''); setNote('')
        try {
            if (editing) await api.put(`/videos/${editing._id}`, form)
            else await api.post('/videos', form)
            setNote('Saved.')
            reset()
            await load()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    async function remove(v) {
        if (!window.confirm(`Remove "${v.titleEn || v.titleHi}" from the website? (It stays on YouTube.)`)) return
        try { await api.del(`/videos/${v._id}`); if (editing?._id === v._id) reset(); await load() } catch (e) { setError(e.message) }
    }

    const showForm = adding || !!editing
    return (
        <>
            <PageHeader title="Videos" subtitle="YouTube videos shown on the Videos page. Paste a link — the video stays on YouTube.">
                {!showForm && <button onClick={() => { setAdding(true); setNote('') }} className="abtn-primary">➕ Add video</button>}
            </PageHeader>
            <Notice kind="success">{note}</Notice>

            {showForm && (
                <form onSubmit={submit} className="card mb-6 border-brand/30">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-extrabold">{editing ? '✏️ Edit video' : '➕ Add a video'}</h2>
                        <button type="button" onClick={reset} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/60 hover:bg-mist"><Icon name="close" size={18} /></button>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 font-semibold sm:col-span-2">▶️ YouTube link
                                <input required value={form.link} onChange={set('link')} placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." className="input" />
                                {form.link && !id && <span className="text-xs font-normal text-red-700">This does not look like a YouTube video link.</span>}
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">Title (Hindi)<input value={form.titleHi} onChange={set('titleHi')} maxLength="150" className="input" /></label>
                            <label className="flex flex-col gap-1 font-semibold">Title (English)<input value={form.titleEn} onChange={set('titleEn')} maxLength="150" className="input" /></label>
                            <label className="flex flex-col gap-1 font-semibold">Category
                                <select value={form.category} onChange={set('category')} className="input">
                                    {VIDEO_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.en}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 font-semibold">Order (1 shows first)<input type="number" min="0" value={form.order} onChange={set('order')} className="input" /></label>
                        </div>
                        <div>
                            <p className="mb-1 text-sm font-semibold">Preview</p>
                            {id
                                ? <img src={thumb(id)} alt="Video thumbnail" className="aspect-video w-full rounded-xl object-cover" />
                                : <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-mist text-sm text-navy/50">Paste a link to see it</div>}
                        </div>
                    </div>
                    {error && <div className="mt-3"><Notice>{error}</Notice></div>}
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={reset} className="abtn min-h-11">Cancel</button>
                        <button disabled={busy || !id} className="abtn-primary min-h-11 px-6">{busy ? 'Saving...' : editing ? '💾 Save changes' : '✅ Add video'}</button>
                    </div>
                </form>
            )}

            {!showForm && <Notice>{error}</Notice>}
            <h2 className="mb-3 text-lg font-extrabold">🎞️ All videos {items && `(${items.length})`}</h2>
            {!items && <ListLoading />}
            {items?.length === 0 && <p className="card text-center text-navy/70">📭 No videos yet. Click "Add video" to add the first one.</p>}
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items?.map((v) => (
                    <li key={v._id} className={`card flex flex-col overflow-hidden p-0 sm:p-0 ${editing?._id === v._id ? 'ring-2 ring-brand' : ''}`}>
                        <a href={`https://youtu.be/${v.youtubeId}`} target="_blank" rel="noreferrer"><img src={thumb(v.youtubeId)} alt="" className="aspect-video w-full rounded-none object-cover" /></a>
                        <div className="flex flex-1 flex-col p-4">
                            <div className="line-clamp-2 font-bold">{v.titleHi || v.titleEn}</div>
                            <div className="mt-1 text-xs text-navy/60">{videoCategory(v.category).emoji} {videoCategory(v.category).en}{v.order ? ` · #${v.order}` : ''}</div>
                            <div className="mt-auto flex gap-2 pt-3">
                                <button onClick={() => startEdit(v)} className="abtn min-h-9 flex-1 px-3">✏️ Edit</button>
                                <button onClick={() => remove(v)} className="abtn-danger min-h-9 flex-1 px-3">🗑️ Remove</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    )
}
