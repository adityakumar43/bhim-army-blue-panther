// The link that shows a preview picture on WhatsApp (made by the backend's /share route)
const SHARE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
export const shareLink = (kind, id) => `${SHARE_BASE}/share/${kind}/${id}`
