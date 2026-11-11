export const ORG = {
  name: process.env.ORG_NAME || 'Bhim Army Blue Panther',
  address: process.env.ORG_ADDRESS || '',
  regNo: process.env.ORG_REG_NO || '',
  note: process.env.ORG_RECEIPT_NOTE || '',
  // Shown at the bottom of every email. Keep these the same as frontend/src/lib/orgInfo.js
  email: process.env.ORG_EMAIL || 'contact@bhimarmybluepanther.org',
  social: {
    facebook: 'https://www.facebook.com/bhimarmybluepanther',
    instagram: 'https://www.instagram.com/bhimarmybluepanther',
    youtube: '',
    x: '',
    whatsapp: '',
    linkedin: '',
  },
}
