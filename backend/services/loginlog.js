import LoginEvent from '../models/LoginEvent.js'

// "Chrome on Windows", "Safari on iPhone" and so on, from the browser's user-agent text
export function deviceName(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const system = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'unknown system'
  return `${browser} on ${system}`
}

// Saves a login attempt. Never blocks or breaks the login itself.
export function recordLogin(req, { admin, email, success, reason }) {
  LoginEvent.create({
    admin: admin?._id,
    name: admin?.name,
    email: admin?.email || String(email || '').toLowerCase().slice(0, 120),
    success,
    reason,
    ip: req.ip,
    device: deviceName(req.headers['user-agent']),
  }).catch((err) => console.error('Login history failed:', err.message))
}