import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import { getItem, setItem } from './lib/storage.js' // safe when the browser blocks saved data

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: getItem('lang') || 'hi',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  setItem('lang', lng)
  document.documentElement.lang = lng
})

export default i18n
