// Samvidhan Divas dates, kept apart from samvidhan.js (the page's text and quiz) because the footer and the
// Home banner need only these, and they are part of the first download of every page.

// The Home page shows the Samvidhan Divas banner on these days every year (Indian time).
// 25 November: Dr. Ambedkar's last speech in the Constituent Assembly. 26 November: the Constitution was adopted.
export const SAMVIDHAN_DAYS = ['11-25', '11-26']

// True on those days in India; ?samvidhan=1 in the address shows the banner on any day (to check how it looks)
export function isSamvidhanTime(now = new Date()) {
    try { if (new URLSearchParams(window.location.search).get('samvidhan') === '1') return true } catch { /* no window */ }
    const md = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit' }).format(now)
    return SAMVIDHAN_DAYS.includes(md)
}

// The footer shows the Samvidhan Divas link only in its season: 1 November to 26 January
// (the build-up to Samvidhan Divas, through to Republic Day). The page itself stays open all year,
// so shared certificates and quiz links keep working. ?samvidhan=1 shows the link on any day.
export const SEASON = { from: '11-01', to: '01-26' }
export function isSamvidhanSeason(now = new Date()) {
    try { if (new URLSearchParams(window.location.search).get('samvidhan') === '1') return true } catch { /* no window */ }
    const md = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit' }).format(now)
    // The season crosses the new year, so it is "from 1 Nov onwards" OR "up to 26 Jan"
    // A season inside one year (e.g. 04-10 to 04-20) needs both; one that crosses the new year (11-01 to 01-26) needs either
    return SEASON.from <= SEASON.to ? md >= SEASON.from && md <= SEASON.to : md >= SEASON.from || md <= SEASON.to
}
