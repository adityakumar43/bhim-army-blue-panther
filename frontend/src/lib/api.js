import i18n from '../i18n.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// When the server is waking up or the connection drops for a moment, reading data (GET) is tried again
// after 1, 2 and 4 seconds before giving up. Sending (POST, PUT…) is never repeated, so nothing is sent twice.
const WAITS = [1000, 2000, 4000]
const BUSY = [502, 503, 504] // "server not ready yet" answers from the hosting
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const offline = () => i18n.t('errors.offline', { defaultValue: 'Could not reach the server. Please check your internet and try again.' })

async function send(url, options, retry) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, options)
      if (retry && BUSY.includes(res.status) && i < WAITS.length) { await wait(WAITS[i]); continue }
      return res
    } catch {
      // fetch throws only when there was no answer at all (no internet, server asleep or restarting)
      if (retry && i < WAITS.length) { await wait(WAITS[i]); continue }
      throw Object.assign(new Error(offline()), { status: 0, offline: true })
    }
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }

  const res = await send(BASE + path, { method, headers, body }, method === 'GET')
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && token) {
    localStorage.removeItem('token')
    try { sessionStorage.setItem('loginNotice', data.message || '') } catch { /* storage blocked */ }
    window.location.href = '/admin/login'
  }
  // The error keeps the server's reply (e.data), so pages can read extra details like a code
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data })
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
}
