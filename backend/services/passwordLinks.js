import crypto from 'crypto'
import Admin from '../models/Admin.js'
import LoginLock from '../models/LoginLock.js'
import { sendMail } from './mailer.js'
import { esc, button, hero, greet, both, details, note, signoff } from './emailLayout.js'
import { ORG } from '../config/org.js'

// One-time links to choose a password: for a new team member (instead of the super admin making up a password
// and passing it on), and for an admin who forgot theirs. The link holds a long random code; only a scrambled
// copy (sha256) is saved, so even someone who reads the database cannot use it. It works once, for a limited time.

export const INVITE_HOURS = 72 // a new team member has 3 days to open their link
export const RESET_HOURS = 1 // a "forgot password" link works for 1 hour

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex')
const site = () => (process.env.CLIENT_URL || '').trim().replace(/\/+$/, '').replace('://www.', '://')

// A new link for this admin (any older link stops working). Gives the address to open.
export async function makeLink(adminId, hours) {
    const token = crypto.randomBytes(32).toString('hex')
    await Admin.updateOne({ _id: adminId }, {
        $set: { setupTokenHash: hashToken(token), setupTokenExpires: new Date(Date.now() + hours * 3600e3), setupLinkAt: new Date() },
    })
    return `${site()}/admin/set-password?t=${token}`
}

// The admin a link belongs to, if it is still valid
export async function adminForToken(token) {
    if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return null
    const admin = await Admin.findOne({ setupTokenHash: hashToken(token), setupTokenExpires: { $gt: new Date() } })
        .select('+password +setupTokenHash +setupTokenExpires')
    return admin && admin.active !== false ? admin : null
}

// Saves the chosen password and uses up the link. Logs the account out everywhere and clears wrong-try locks.
export async function usePasswordLink(admin, password) {
    admin.password = password
    admin.passwordSet = true
    admin.sessionId = crypto.randomUUID()
    admin.setupTokenHash = undefined
    admin.setupTokenExpires = undefined
    await admin.save()
    await LoginLock.deleteMany({ $or: [{ _id: { $regex: `^${admin._id}:` } }, { _id: `acct:${admin._id}` }] })
}

// Emails the link. true when the mail server took it, false when email is not set up (throws if sending failed).
export function emailLink(admin, url, kind, hours = kind === 'invite' ? INVITE_HOURS : RESET_HOURS) {
    const invite = kind === 'invite'
    const days = hours >= 24 && hours % 24 === 0 ? hours / 24 : 0
    const valid = days ? `${days} day${days === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'}`
    const validHi = days ? `${days} दिन` : `${hours} ${hours === 1 ? 'घंटा' : 'घंटे'}`
    const subject = invite ? `You have been added to the ${ORG.name} admin team` : `Choose a new password for ${ORG.name}`
    const intro = invite
        ? `You have been added to the ${ORG.name} admin team. Choose your own password to start. Nobody else knows it, not even the person who added you.`
        : 'Someone (hopefully you) asked to choose a new password for your admin account.'
    const introHi = invite
        ? `आपको ${ORG.name} की एडमिन टीम में जोड़ा गया है। शुरू करने के लिए नीचे के बटन से अपना पासवर्ड चुनें। यह पासवर्ड सिर्फ़ आपको पता होगा, आपको जोड़ने वाले को भी नहीं।`
        : 'आपके एडमिन खाते का नया पासवर्ड चुनने के लिए कहा गया है। अगर यह आपने माँगा है, तो नीचे के बटन से नया पासवर्ड चुनें।'
    const outro = invite ? '' : 'If you did not ask for this, ignore this email: your password stays as it is.'
    return sendMail({
        to: admin.email,
        subject,
        text: `Jai Bhim ${admin.name},\n\n${intro}\n\nChoose your password here (the link works for ${valid}, once):\n${url}\n\nYour login email: ${admin.email}\n\n${outro}\n\n— ${ORG.name}`.replace(/\n{3,}/g, '\n\n'),
        html: `${invite ? hero('👋', 'एडमिन टीम में स्वागत है', 'Welcome to the admin team') : hero('🔑', 'नया पासवर्ड चुनें', 'Password reset')}
${greet(admin.name)}
${both(introHi, intro)}
${button(invite ? 'अपना पासवर्ड चुनें / Choose my password' : 'नया पासवर्ड चुनें / Choose a new password', url)}
${details([
            ['लॉगिन ईमेल / Login email', admin.email],
            ['लिंक कब तक / Link works for', `${validHi} · ${valid}, once`],
        ])}
${outro ? note(`🔒 अगर यह आपने नहीं माँगा, तो इस ईमेल को अनदेखा करें। आपका पासवर्ड नहीं बदलेगा।<br>${esc(outro)}`, 'warn') : note('🔒 यह लिंक किसी के साथ साझा न करें। / Do not share this link with anyone.')}
${signoff()}`,
    })
}
