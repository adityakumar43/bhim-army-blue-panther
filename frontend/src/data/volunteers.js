// Ways people can help, and when they are free. Shared by the public page and the admin panel.
export const SKILLS = [
  { key: 'legal', emoji: '⚖️', en: 'Legal help (lawyer, law student)', hi: 'क़ानूनी मदद (वकील, क़ानून के छात्र)' },
  { key: 'teaching', emoji: '📚', en: 'Teaching / free tuition', hi: 'पढ़ाना / मुफ़्त ट्यूशन' },
  { key: 'medical', emoji: '🩺', en: 'Medical / health camps', hi: 'चिकित्सा / स्वास्थ्य शिविर' },
  { key: 'social', emoji: '📱', en: 'Social media & design', hi: 'सोशल मीडिया और डिज़ाइन' },
  { key: 'events', emoji: '🎤', en: 'Organising events & rallies', hi: 'कार्यक्रम और रैली आयोजन' },
  { key: 'field', emoji: '🚶', en: 'Field work / door-to-door', hi: 'ज़मीनी काम / घर-घर संपर्क' },
  { key: 'writing', emoji: '✍️', en: 'Writing & translation', hi: 'लेखन और अनुवाद' },
  { key: 'computer', emoji: '💻', en: 'Computer / IT', hi: 'कंप्यूटर / आईटी' },
  { key: 'driving', emoji: '🚗', en: 'Driving / own vehicle', hi: 'ड्राइविंग / अपना वाहन' },
]
export const AVAILABILITY = [
  { key: 'anytime', en: 'Whenever needed', hi: 'जब भी ज़रूरत हो' },
  { key: 'weekends', en: 'Weekends', hi: 'सप्ताहांत' },
  { key: 'evenings', en: 'Evenings', hi: 'शाम को' },
  { key: 'events', en: 'Only for big events', hi: 'सिर्फ़ बड़े कार्यक्रमों में' },
]
export const skillOf = (key) => SKILLS.find((s) => s.key === key)