// English and Hindi names of each state, plus common short forms people type (UP, Orissa, J&K...).
// Used to match members to their state, including older applications where the state was typed by hand.
export const STATE_NAMES = {
  'andhra-pradesh': ['Andhra Pradesh', 'आंध्र प्रदेश', 'AP', 'A.P.'],
  'arunachal-pradesh': ['Arunachal Pradesh', 'अरुणाचल प्रदेश'],
  assam: ['Assam', 'असम'],
  bihar: ['Bihar', 'बिहार'],
  chhattisgarh: ['Chhattisgarh', 'छत्तीसगढ़', 'Chattisgarh', 'CG'],
  goa: ['Goa', 'गोवा'],
  gujarat: ['Gujarat', 'गुजरात'],
  haryana: ['Haryana', 'हरियाणा'],
  'himachal-pradesh': ['Himachal Pradesh', 'हिमाचल प्रदेश', 'HP'],
  jharkhand: ['Jharkhand', 'झारखंड'],
  karnataka: ['Karnataka', 'कर्नाटक'],
  kerala: ['Kerala', 'केरल'],
  'madhya-pradesh': ['Madhya Pradesh', 'मध्य प्रदेश', 'MP', 'M.P.'],
  maharashtra: ['Maharashtra', 'महाराष्ट्र'],
  manipur: ['Manipur', 'मणिपुर'],
  meghalaya: ['Meghalaya', 'मेघालय'],
  mizoram: ['Mizoram', 'मिज़ोरम', 'मिजोरम'],
  nagaland: ['Nagaland', 'नागालैंड'],
  odisha: ['Odisha', 'ओडिशा', 'Orissa', 'उड़ीसा'],
  punjab: ['Punjab', 'पंजाब'],
  rajasthan: ['Rajasthan', 'राजस्थान'],
  sikkim: ['Sikkim', 'सिक्किम'],
  'tamil-nadu': ['Tamil Nadu', 'तमिलनाडु', 'TN'],
  telangana: ['Telangana', 'तेलंगाना'],
  tripura: ['Tripura', 'त्रिपुरा'],
  'uttar-pradesh': ['Uttar Pradesh', 'उत्तर प्रदेश', 'UP', 'U.P.'],
  uttarakhand: ['Uttarakhand', 'उत्तराखंड', 'Uttaranchal', 'UK'],
  'west-bengal': ['West Bengal', 'पश्चिम बंगाल', 'WB'],
  'andaman-nicobar': ['Andaman and Nicobar Islands', 'अंडमान और निकोबार द्वीपसमूह', 'Andaman and Nicobar', 'Andaman & Nicobar'],
  chandigarh: ['Chandigarh', 'चंडीगढ़'],
  'dadra-nagar-haveli-daman-diu': ['Dadra and Nagar Haveli and Daman and Diu', 'दादरा और नगर हवेली और दमन और दीव', 'Daman and Diu', 'Dadra and Nagar Haveli'],
  delhi: ['Delhi', 'दिल्ली', 'New Delhi', 'NCT of Delhi'],
  'jammu-kashmir': ['Jammu and Kashmir', 'जम्मू और कश्मीर', 'Jammu & Kashmir', 'J&K'],
  ladakh: ['Ladakh', 'लद्दाख'],
  lakshadweep: ['Lakshadweep', 'लक्षद्वीप'],
  puducherry: ['Puducherry', 'पुडुचेरी', 'Pondicherry'],
}

const clean = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-zऀ-ॿ]/g, '')
const LOOKUP = new Map(Object.entries(STATE_NAMES).flatMap(([code, names]) => names.map((n) => [clean(n), code])))

export const stateNameEn = (code) => STATE_NAMES[code]?.[0] || ''
// "u.p." or "Uttar  pradesh" or "उत्तर प्रदेश" give 'uttar-pradesh'; unknown text gives null
export const codeFromName = (text) => LOOKUP.get(clean(text)) || null
// Does this member belong to this state?
export const memberInState = (m, code) => (m.stateCode ? m.stateCode === code : codeFromName(m.state) === code)

// Database filter for one state's members: new ones by code, older ones by the name they typed
export function memberStateFilter(code) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const names = (STATE_NAMES[code] || []).map((n) => new RegExp(`^\\s*${esc(n)}\\s*$`, 'i'))
  return { $or: [{ stateCode: code }, { stateCode: { $in: [null, ''] }, state: { $in: names } }] }
}