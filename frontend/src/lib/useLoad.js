import { useCallback, useEffect, useEffectEvent, useState } from 'react'

// Loads data for a key, like a page address, a tab or a filter: useLoad(() => api.get(`/news/${id}`), id)
//   data    the answer for the CURRENT key, or null while it is on its way
//   error   the error for the current key, or null
//   loading true until the answer (or error) for the current key has arrived
//   reload  loads the same key again (for "Try again" buttons); data is null meanwhile
//   setData changes the loaded data in place, for example after an edit, without loading again
// When the key changes, the old data is not shown for the new key, and an answer that arrives late
// for an older key (the visitor already moved on) is ignored, so a slow answer never replaces a newer one.
export default function useLoad(load, key) {
  const [tries, setTries] = useState(0)
  const id = `${key}\u0000${tries}`
  const [result, setResult] = useState({ id: null, data: null, error: null })
  const run = useEffectEvent(() => load()) // always the latest load function, without reloading when it changes

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => run())
      .then(
        (data) => { if (current) setResult({ id, data, error: null }) },
        (error) => { if (current) setResult({ id, data: null, error }) },
      )
    return () => { current = false }
  }, [id])

  const reload = useCallback(() => setTries((n) => n + 1), [])
  const setData = useCallback((update) => setResult((r) => ({ ...r, data: typeof update === 'function' ? update(r.data) : update })), [])
  const here = result.id === id
  return { data: here ? result.data : null, error: here ? result.error : null, loading: !here, reload, setData }
}
