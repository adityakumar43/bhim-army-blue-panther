// Hindi or English list (contributions, bio). Falls back to the other language.
export const pickList = (item, field, lang) => {
  const hi = item[`${field}Hi`], en = item[`${field}En`]
  return (lang === 'hi' ? (hi?.length ? hi : en) : (en?.length ? en : hi)) || []
}
