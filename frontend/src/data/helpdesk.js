// Help desk categories and statuses, shared by the public page and the admin panel
export const CATEGORIES = [
  { key: 'atrocity', emoji: '🚨', en: 'Caste atrocity / violence', hi: 'जातिगत अत्याचार / हिंसा' },
  { key: 'discrimination', emoji: '⚖️', en: 'Caste discrimination', hi: 'जातिगत भेदभाव' },
  { key: 'police', emoji: '👮', en: 'Police not helping / FIR not filed', hi: 'पुलिस मदद नहीं कर रही / FIR दर्ज नहीं हुई' },
  { key: 'land', emoji: '🏠', en: 'Land or property', hi: 'ज़मीन या संपत्ति' },
  { key: 'education', emoji: '🎓', en: 'School, college or scholarship', hi: 'स्कूल, कॉलेज या छात्रवृत्ति' },
  { key: 'government', emoji: '🏛️', en: 'Government scheme or office', hi: 'सरकारी योजना या दफ़्तर' },
  { key: 'other', emoji: '📝', en: 'Something else', hi: 'कुछ और' },
]
export const STATUS = {
  new: { emoji: '🆕', en: 'Received', hi: 'प्राप्त हुई', tone: 'gold' },
  in_progress: { emoji: '🔄', en: 'Action in progress', hi: 'कार्रवाई जारी है', tone: 'blue' },
  resolved: { emoji: '✅', en: 'Resolved', hi: 'हल हो गई', tone: 'green' },
  closed: { emoji: '📁', en: 'Closed', hi: 'बंद', tone: 'gray' },
}
export const categoryOf = (key) => CATEGORIES.find((c) => c.key === key) || CATEGORIES.at(-1)