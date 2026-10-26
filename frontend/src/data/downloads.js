// Download categories, shared by the public page and the admin panel
export const DL_CATEGORIES = [
    { key: 'books', emoji: '📚', en: 'Books & writings', hi: 'पुस्तकें और लेख' },
    { key: 'pamphlets', emoji: '📄', en: 'Pamphlets', hi: 'पर्चे' },
    { key: 'posters', emoji: '🖼️', en: 'Posters', hi: 'पोस्टर' },
    { key: 'forms', emoji: '📝', en: 'Forms & letterhead', hi: 'फ़ॉर्म और लेटरहेड' },
    { key: 'other', emoji: '📦', en: 'Other', hi: 'अन्य' },
]
export const dlCategory = (key) => DL_CATEGORIES.find((c) => c.key === key) || DL_CATEGORIES.at(-1)
export const fileSize = (bytes) => (!bytes ? '' : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)