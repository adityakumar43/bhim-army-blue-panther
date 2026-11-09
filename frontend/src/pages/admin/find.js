import { useSearchParams } from 'react-router-dom'

// "find" in the address comes from the search box at the top: the page then shows only what matches
export function useFind() {
  const [params, setParams] = useSearchParams()
  const find = params.get('find') || ''
  const clear = () => {
    const next = new URLSearchParams(params)
    next.delete('find')
    next.delete('status')
    setParams(next, { replace: true })
  }
  return { find, status: params.get('status'), clear }
}

// Does any of these values contain the text being looked for? (ignores capitals)
export const matchesFind = (find, ...values) => !find || values.join(' ').toLowerCase().includes(find.toLowerCase())
