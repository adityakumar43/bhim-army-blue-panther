import { useEffect } from 'react'
import { api } from '../../lib/api.js'

// Checks every 15 seconds (and whenever this tab is opened again) that this login is still the newest one.
// If the account logged in on another device, api.js sees the 401 and sends this device to the login page.
export default function SessionWatch() {
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') api.get('/auth/me').catch(() => {})
    }
    const timer = setInterval(check, 15000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return null
}