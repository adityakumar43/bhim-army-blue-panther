// Video categories, shared by the public page and the admin panel
export const VIDEO_CATEGORIES = [
    { key: 'speeches', emoji: '🎙️', en: 'Speeches', hi: 'भाषण' },
    { key: 'rallies', emoji: '✊', en: 'Rallies & protests', hi: 'रैली और आंदोलन' },
    { key: 'events', emoji: '🎉', en: 'Events', hi: 'कार्यक्रम' },
    { key: 'interviews', emoji: '🗣️', en: 'Interviews', hi: 'साक्षात्कार' },
    { key: 'other', emoji: '🎬', en: 'Other', hi: 'अन्य' },
]
export const videoCategory = (key) => VIDEO_CATEGORIES.find((c) => c.key === key) || VIDEO_CATEGORIES.at(-1)
export const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

// The same link reading as the server: watch?v=, youtu.be/, shorts/, embed/, live/
export function youtubeId(link) {
    const s = String(link || '').trim()
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
    let u
    try { u = new URL(s) } catch { return null }
    const host = u.hostname.replace(/^www\.|^m\./, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1, 12)
    else if (['youtube.com', 'youtube-nocookie.com', 'music.youtube.com'].includes(host)) {
        id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/) || [])[1]
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null
}