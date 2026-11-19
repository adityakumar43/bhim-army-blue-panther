import { useEffect, useSyncExternalStore } from 'react'

// Lets a page hide the floating "Join" button (JoinButton.jsx) while it is open, for pages that already
// have their own Join link in the middle of the screen (the 404 page), so the button does not cover it.
let hiders = 0
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const useJoinButtonHidden = () => useSyncExternalStore(subscribe, () => hiders > 0, () => false)

// Call in a page component: the button stays hidden while that page is on screen
export function useHideJoinButton() {
  useEffect(() => {
    hiders += 1; notify()
    return () => { hiders -= 1; notify() }
  }, [])
}
