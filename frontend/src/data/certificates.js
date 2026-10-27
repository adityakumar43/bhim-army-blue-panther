// The kinds of document the organisation issues
export const CERT_TYPES = [
    { key: 'appointment', emoji: '📜', short: 'Appointment', en: 'Appointment letter', hi: 'नियुक्ति पत्र', titleEn: 'Appointment Letter' },
    { key: 'appreciation', emoji: '🏅', short: 'Appreciation', en: 'Certificate of appreciation', hi: 'प्रशस्ति पत्र', titleEn: 'Certificate of Appreciation' },
    { key: 'participation', emoji: '🎟️', short: 'Participation', en: 'Certificate of participation', hi: 'सहभागिता प्रमाण पत्र', titleEn: 'Certificate of Participation' },
    { key: 'letter', emoji: '✉️', short: 'Letters', en: 'Letter', hi: 'पत्र', titleEn: 'Letter' },
]
export const certType = (key) => CERT_TYPES.find((t) => t.key === key) || CERT_TYPES[0]

export const RELATIONS = [
    ['', '—'],
    ['S/o', 'S/o (son of)'],
    ['D/o', 'D/o (daughter of)'],
    ['W/o', 'W/o (wife of)'],
]
export const RELATION_HI = { 'S/o': 'पुत्र', 'D/o': 'पुत्री', 'W/o': 'पत्नी' }

export const ORG_HI = 'भीम आर्मी ब्लू पैंथर'

// Dates are saved as plain days, so show them without a time-zone shift
export const day = (d, lang = 'en') =>
    d ? new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''