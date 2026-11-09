import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api.js'

// Long admin lists come a page at a time, newest first. "Load more" asks the server for the rows after the
// last one on screen, so nothing is left out however long a list grows, and rows that arrive in between are
// neither skipped nor shown twice. backend/services/paging.js reads the same cursor.
//   group(row): for lists in groups (Help desk: urgent cases first), the row's group, 1 for the first group, 0 for the rest
const cursorOf = (row, group) => `${group ? `${group(row)}_` : ''}${Date.parse(row.createdAt)}_${row._id}`
const pageUrl = (path, size, before) =>
  `${path}${!path.includes('?') ? '?' : path.endsWith('?') ? '' : '&'}limit=${size}${before ? `&before=${encodeURIComponent(before)}` : ''}`

//   pick(answer): for answers that are not just a list (Donations: { items, total, count }), where the rows are
export function usePaged(path, size, { group, pick, onError } = {}) {
  const [items, setItems] = useState(null)
  const [meta, setMeta] = useState(null) // the whole latest answer, for totals that come with the rows
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const rows = useRef([]) // what is on screen
  const run = useRef(0) // a newer request (another tab or filter) wins over an older one still on its way
  const report = useRef(onError)
  useEffect(() => { report.current = onError })

  // Pages after `from` until there are at least `want` rows, or no more
  async function fill(from, want) {
    const id = ++run.current
    setBusy(true)
    try {
      let list = from
      for (;;) {
        const answer = await api.get(pageUrl(path, size, list.length ? cursorOf(list[list.length - 1], group) : ''))
        if (id !== run.current) return
        const page = pick ? pick(answer) : answer
        setMeta(answer)
        list = list.concat(page)
        const full = page.length >= size
        if (!full || list.length >= want) {
          rows.current = list
          setItems(list)
          setMore(full)
          return
        }
      }
    } catch (err) {
      if (id === run.current) report.current?.(err)
    } finally {
      if (id === run.current) setBusy(false)
    }
  }

  // After a change: load again, keeping as many rows as were on screen
  const load = () => fill([], Math.max(rows.current.length, 1))
  const loadMore = () => fill(rows.current, rows.current.length + 1)
  useEffect(() => { rows.current = []; setItems(null); setMeta(null); setMore(false); load() }, [path]) // eslint-disable-line react-hooks/exhaustive-deps

  return { items, meta, more, busy, load, loadMore }
}

export function LoadMore({ more, busy, onClick, count, noun }) {
  if (!more) return null
  return (
    <div className="mt-5 flex flex-col items-center gap-1.5 text-center">
      <button onClick={onClick} disabled={busy} className="abtn min-h-10 px-5">{busy ? 'Loading…' : `⬇️ Load older ${noun}`}</button>
      <p className="text-xs text-navy/65">{count} {noun} loaded. Search, filters, counts and downloads cover only the loaded ones.</p>
    </div>
  )
}
