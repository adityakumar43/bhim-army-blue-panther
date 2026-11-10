
export const ORG = {
  // phone: '[PHONE NUMBER]',
  email: 'contact@bhimarmybluepanther.org',
  address: 'Pithampur - Indore, Madhya Pradesh',

  // The organisation's official social media pages. Paste the full link between the quotes,
  // for example: facebook: 'https://www.facebook.com/bhimarmybluepanther'
  // An empty one is simply skipped. Each filled link shows as a button in the footer and tells
  // Google and AI assistants that this page belongs to the same organisation as the website.
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
    x: '', // Twitter / X
    whatsapp: '', // WhatsApp channel link
    linkedin: '',
  },
}

// The social media pages that have a link above, as [name, link] pairs. Empty ones are left out.
export const socialLinks = () => Object.entries(ORG.social || {}).filter(([, url]) => /^https?:\/\//.test(url || ''))
