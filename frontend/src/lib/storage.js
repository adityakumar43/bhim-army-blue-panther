// Things saved in this browser (language, admin login, remembered device).
// Some browsers refuse saved data ("Block all cookies", some in-app browsers and privacy modes); then every
// use of it throws an error. These do not: the site keeps working, it just does not remember things.
export function getItem(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
export function setItem(key, value) {
  try { localStorage.setItem(key, value) } catch { /* not saved */ }
}
export function removeItem(key) {
  try { localStorage.removeItem(key) } catch { /* nothing was saved */ }
}
