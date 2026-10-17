import { authenticator } from 'otplib'
import { decrypt } from '../config/crypto.js'

// Accept the code just before or after the current one, in case the phone clock is a little off
authenticator.options = { window: 1 }

// Returns the time step of a valid code, or null. A step at or below lastStep was already used, so it is refused.
export function verifyCode(encryptedSecret, code, lastStep = 0) {
  const clean = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(clean)) return null
  let delta
  try {
    delta = authenticator.checkDelta(clean, decrypt(encryptedSecret))
  } catch {
    return null
  }
  if (delta === null || delta === undefined) return null
  const step = Math.floor(Date.now() / 30000) + delta
  return step > lastStep ? step : null
}