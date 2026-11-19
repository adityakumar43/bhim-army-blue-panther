import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import hi from './locales/hi.json'
import { getItem, setItem } from './lib/storage.js' // safe when the browser blocks saved data

// Hindi is built into the app. English is a separate small file, fetched only by someone who uses English,
// so the many Hindi visitors do not download and read it. (Every key is in both files, so Hindi is a safe fallback.)
i18n.use(initReactI18next).init({
  resources: { hi: { translation: hi } },
  lng: 'hi',
  fallbackLng: 'hi',
  partialBundledLanguages: true,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  setItem('lang', lng)
  document.documentElement.lang = lng
})

// Fetches the English text once (later calls reuse it)
let english = null
const loadEnglish = () => (english ||= import('./locales/en.json').then((m) => { i18n.addResourceBundle('en', 'translation', m.default) }))

// Switch language. English is fetched first, so the page never shows half-translated text.
export function setLanguage(lng) {
  return (lng === 'en' ? loadEnglish() : Promise.resolve()).then(() => i18n.changeLanguage(lng))
}

// main.jsx waits for this before drawing the page: for someone who chose English last time, English is ready
// from the first moment. If the English file cannot be fetched (offline), the page opens in Hindi.
export const i18nReady = getItem('lang') === 'en' ? setLanguage('en').catch(() => {}) : Promise.resolve()

export default i18n
