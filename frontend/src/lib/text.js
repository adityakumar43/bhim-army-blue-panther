
export function pickText(item, field, lang) {
  const hi = item[`${field}Hi`]
  const en = item[`${field}En`]
  return lang === 'hi' ? hi || en || '' : en || hi || ''
}

// An event's date is saved as just a day (midnight UTC), so it is shown as that day, in every country.
// Anything else is a real moment (news posted, card issued, poll closing) and is shown in Indian time,
// so every visitor, in India or abroad, sees the same date as the team. (A moment exactly at midnight UTC is
// 5:30 a.m. in India on the same day, so both ways give the same date.)
const isDayOnly = (d) => d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0

export function formatDate(value, lang) {
  const d = new Date(value)
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: isDayOnly(d) ? 'UTC' : 'Asia/Kolkata',
  })
}
