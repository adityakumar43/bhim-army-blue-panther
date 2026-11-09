import { useEffect, useEffectEvent, useRef, useState } from 'react'
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
  // The rows on screen, the whole latest answer (for totals that come with the rows), whether there are more,
  // and the address they belong to: rows of another address are not shown while a new one loads
  const [got, setGot] = useState({ path: null, items: null, meta: null, more: false })
  const [busy, setBusy] = useState(false)
  const rows = useRef([]) // what is on screen
  const run = useRef(0) // a newer request (another tab or filter) wins over an older one still on its way
  const report = useRef(onError)
  useEffect(() => { report.current = onError })

  // Pages after `from` until there are at least `want` rows, or no more
  async function fill(from, want) {
    const id = ++run.current
    const forPath = path
    setBusy(true)
    try {
      let list = from
      for (;;) {
        const answer = await api.get(pageUrl(path, size, list.length ? cursorOf(list[list.length - 1], group) : ''))
        if (id !== run.current) return
        const page = pick ? pick(answer) : answer
        list = list.concat(page)
        const full = page.length >= size
        if (!full || list.length >= want) {
          rows.current = list
          setGot({ path: forPath, items: list, meta: answer, more: full })
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
  // Another address: start again from the first page
  const start = useEffectEvent(() => { rows.current = []; fill([], 1) })
  useEffect(() => { Promise.resolve().then(() => start()) }, [path])

  const here = got.path === path
  return { items: here ? got.items : null, meta: here ? got.meta : null, more: here && got.more, busy, load, loadMore }
}
