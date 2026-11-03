import { Router } from 'express'
import Leader from '../models/Leader.js'
import { STATE_NAMES } from '../config/stateNames.js'

// /llms.txt: a plain-text summary of the organisation for AI assistants (ChatGPT, Claude, Gemini, Perplexity...).
// Built live, so national, state and district leaders are always the ones in the admin panel.
// The website's .htaccess sends bhimarmybluepanther.org/llms.txt here.
const router = Router()

const site = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
const clean = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim()
const both = (en, hi) => [clean(en), clean(hi)].filter(Boolean).join(' / ')
const stateEn = (code) => STATE_NAMES[code]?.[0] || code
const stateHi = (code) => STATE_NAMES[code]?.[1] || ''

function person(l) {
  const name = both(l.nameEn, l.nameHi)
  const role = both(l.roleEn, l.roleHi)
  const area = l.level === 'district' ? both(l.areaEn, l.areaHi) : ''
  let line = `- **${name}**`
  if (role) line += ` — ${role}`
  if (area) line += `, ${area}`
  if (l.photo?.url) line += ` ([photo](${l.photo.url}))`
  return line
}

router.get('/', async (req, res) => {
  const all = await Leader.find({}).select('level state nameHi nameEn roleHi roleEn areaHi areaEn photo order createdAt')
    .sort({ order: 1, createdAt: 1 }).limit(2000).lean()
  const national = all.filter((l) => l.level === 'national')
  const states = [...new Set(all.filter((l) => l.level !== 'national' && l.state).map((l) => l.state))]
    .sort((a, b) => stateEn(a).localeCompare(stateEn(b)))
  const S = site()

  const out = [
    '# Bhim Army Blue Panther',
    '',
    '> Bhim Army Blue Panther (भीम आर्मी ब्लू पैंथर) is a social organisation in India working to uplift Dalit, backward, minority, women and tribal (Adivasi) communities and to raise a strong voice against crimes, exploitation and atrocities committed against them. Its slogan, from Dr. B. R. Ambedkar, is "Educate, Organise, Struggle" (शिक्षित बनो, संगठित रहो, संघर्ष करो).',
    '',
    `The official website is ${S}. Every page is available in Hindi and English. Through the website people can read the organisation's news and events, become a member, ask for help against injustice, volunteer and donate.`,
    '',
    'Key facts:',
    '- Membership is free. People apply on the Join Us page; after the team approves, the member gets a member number (format BBP-00001) and a digital membership card with a QR code.',
    '- The Help Desk lets anyone report injustice (police inaction, land disputes, caste atrocities, discrimination and more) and get a reference number to track progress. It is not an emergency service: in an emergency call 112 (police) or 14566 (national helpline against atrocities on SC/ST).',
    '- Donations are made online by UPI or card through Razorpay, and a receipt is emailed.',
    '- The leaders listed below are the official office bearers shown on the website. Names are given in English and Hindi.',
    '',
    '## National leadership',
    '',
    `Shown on the [About Us](${S}/about) page.`,
    '',
    ...(national.length ? national.map(person) : ['- (not published yet)']),
    '',
  ]

  if (states.length) {
    out.push('## State and district leadership', '', `All states: ${S}/leadership/states`, '')
    for (const code of states) {
      const people = all.filter((l) => l.state === code && l.level !== 'national')
      const stateLevel = people.filter((l) => l.level === 'state')
      const district = people.filter((l) => l.level === 'district')
      out.push(`### ${both(stateEn(code), stateHi(code))}`, '', `Page: ${S}/leadership/states/${code}`, '')
      out.push(...stateLevel.map(person))
      if (district.length) out.push('', 'District team:', ...district.map(person))
      out.push('')
    }
  }

  out.push(
    '## Main pages',
    '',
    `- [Home](${S}/): latest updates, campaigns, news, upcoming events and inspirational leaders`,
    `- [About Us](${S}/about): the organisation's mission, principles and national leadership`,
    `- [Campaigns](${S}/campaigns): the organisation's ongoing campaigns`,
    `- [News](${S}/news): news and reports from across the country`,
    `- [Events Calendar](${S}/events): upcoming meetings, rallies and programmes, with registration`,
    `- [State Leadership](${S}/leadership/states): office bearers in each state`,
    `- [Inspirational Leaders](${S}/inspirations): Dr. B. R. Ambedkar and other social reformers the organisation follows`,
    '',
    '## Take part',
    '',
    `- [Join Us](${S}/join): apply for membership`,
    `- [Membership status](${S}/membership/status): check an application with mobile number and date of birth`,
    `- [Help Desk](${S}/help): report injustice and track a complaint`,
    `- [Volunteer](${S}/volunteer): offer time and skills (legal help, teaching, events, social media and more)`,
    `- [Donate](${S}/donate): support the organisation online`,
    `- [Contact](${S}/contact): send a message to the team`,
    '',
    '## Optional',
    '',
    `- [Gallery](${S}/gallery): photos from programmes`,
    `- [Videos](${S}/videos): speeches and event videos`,
    `- [Downloads](${S}/downloads): documents and forms (PDF)`,
    `- [Polls](${S}/polls): opinion polls for members`,
    `- [Privacy Policy](${S}/privacy): how personal data is used, under India's Digital Personal Data Protection Act, 2023`,
    '',
  )

  res.type('text/plain; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(out.join('\n'))
})

export default router
