
export function pickText(item, field, lang) {
  const hi = item[`${field}Hi`]
  const en = item[`${field}En`]
  return lang === 'hi' ? hi || en || '' : en || hi || ''
}

export function formatDate(value, lang) {
  return new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
