import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import Admin from '../models/Admin.js'
import { protect } from '../middleware/auth.js'
import { ROLES, needsTwoFactor } from '../config/roles.js'
import { encrypt } from '../config/crypto.js'
import { verifyCode } from '../services/twofactor.js'
import { recordLogin } from '../services/loginlog.js'
import bcrypt from 'bcryptjs'
import LoginLock from '../models/LoginLock.js'

const router = Router()

const MAX_WRONG = 5
const LOCK_MINUTES = 15


const challengeSecret = () => `${process.env.JWT_SECRET}:challenge`
// Every new login gets a fresh session id, so older logins of this account on other devices stop working
const sign = async (id) => {
  const sid = crypto.randomUUID()
  await Admin.updateOne({ _id: id }, { $set: { sessionId: sid } })
  return jwt.sign({ id, sid }, process.env.JWT_SECRET, { expiresIn: '12h' })
}

const limiter = (max) =>
  rateLimit({ windowMs: 15 * 60 * 1000, max, message: { message: 'Too many attempts. Try again in 15 minutes.' } })

const profile = (a) => ({
  id: a._id, name: a.name, email: a.email, role: a.role,
  permissions: ROLES[a.role] || [], twoFactorEnabled: a.twoFactorEnabled === true,
  twoFactorRequired: needsTwoFactor(a.role), state: a.state || null, district: a.district || null,
})

// Wrong tries count per account AND network, so a stranger who knows an admin's email can lock out only
// their own network, not the admin (see models/LoginLock.js). The limit of 10 tries per network also stays.
const lockKey = (admin, req) => `${admin._id}:${crypto.createHash('sha256').update(`${process.env.JWT_SECRET}:${req.ip}`).digest('hex').slice(0, 20)}`
const isLocked = async (admin, req) => {
  const lock = await LoginLock.findById(lockKey(admin, req)).lean()
  return !!lock?.lockUntil && lock.lockUntil > new Date()
}
const lockedReply = (res) =>
  res.status(429).json({ message: `Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes.` })

// For an email that is not an admin, check the password against this anyway, so the answer takes as long
// as for a real admin and the time it takes does not tell anyone which emails have accounts
let dummyHash
const dummyCheck = async (password) => {
  dummyHash ||= bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12)
  await bcrypt.compare(String(password), await dummyHash)
}


async function recordFailure(admin, req) {
  const _id = lockKey(admin, req)
  const lock = await LoginLock.findOneAndUpdate({ _id }, { $inc: { wrong: 1 }, $set: { at: new Date() } }, { upsert: true, new: true })
  if (lock.wrong >= MAX_WRONG) await LoginLock.updateOne({ _id }, { $set: { wrong: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) } })
}

const clearFailures = (admin, req) => LoginLock.deleteOne({ _id: lockKey(admin, req) })


router.post('/login', limiter(10), async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase() }).select('+password')
  if (admin && await isLocked(admin, req)) {
    recordLogin(req, { admin, success: false, reason: 'locked on this network (too many wrong tries)' })
    return lockedReply(res)
  }

  if (!admin) await dummyCheck(password) // the same time as a wrong password for a real account
  if (!admin || !(await admin.matchPassword(password))) {
    if (admin) await recordFailure(admin, req)
    recordLogin(req, { admin, email, success: false, reason: admin ? 'wrong password' : 'unknown email' })
    return res.status(401).json({ message: 'Wrong email or password' })
  }
  if (admin.active === false) {
    recordLogin(req, { admin, success: false, reason: 'account disabled' })
    return res.status(403).json({ message: 'This account is disabled. Ask a super admin.' })
  }
  await clearFailures(admin, req)

  if (admin.twoFactorEnabled) {
    const challenge = jwt.sign({ id: admin._id }, challengeSecret(), { expiresIn: '5m' })
    return res.json({ needs2fa: true, challenge })
  }
  recordLogin(req, { admin, success: true, reason: 'with password' })
  res.json({ token: await sign(admin._id), admin: profile(admin) })
})


router.post('/login/2fa', limiter(10), async (req, res) => {
  const { challenge, code } = req.body || {}
  const expired = () => res.status(401).json({ message: 'Your login session expired. Please log in again.' })

  let id
  try {
    ; ({ id } = jwt.verify(String(challenge || ''), challengeSecret()))
  } catch {
    return expired()
  }

  const admin = await Admin.findById(id).select('+twoFactorSecret')
  if (!admin || admin.active === false || !admin.twoFactorEnabled) return expired()
  if (await isLocked(admin, req)) {
    recordLogin(req, { admin, success: false, reason: 'locked on this network (too many wrong tries)' })
    return lockedReply(res)
  }

  const step = verifyCode(admin.twoFactorSecret, code, admin.twoFactorLastStep)
  if (step === null) {
    await recordFailure(admin, req)
    recordLogin(req, { admin, success: false, reason: 'wrong 2-step code' })
    return res.status(401).json({ message: 'That code is not correct. Try the newest code in your app.' })
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { twoFactorLastStep: step } })
  await clearFailures(admin, req)
  recordLogin(req, { admin, success: true, reason: 'with 2-step code' })
  res.json({ token: await sign(admin._id), admin: profile(admin) })
})

// Log out: a new session id on the server, so this login stops working everywhere, not only in this browser
router.post('/logout', protect, async (req, res) => {
  await Admin.updateOne({ _id: req.admin._id }, { $set: { sessionId: crypto.randomUUID() } })
  res.json({ ok: true })
})

router.get('/me', protect, (req, res) => {
  res.json({ admin: profile(req.admin) })
})


router.post('/2fa/setup', protect, async (req, res) => {
  if (req.admin.twoFactorEnabled) return res.status(400).json({ message: 'Two-step login is already on' })
  const secret = authenticator.generateSecret()
  await Admin.updateOne({ _id: req.admin._id }, { $set: { twoFactorPending: encrypt(secret) } })
  const uri = authenticator.keyuri(req.admin.email, 'Bhim Army Blue Panther', secret)
  res.json({ qr: await QRCode.toDataURL(uri), secret })
})

router.post('/2fa/enable', protect, async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('+twoFactorPending')
  if (!admin.twoFactorPending) return res.status(400).json({ message: 'Start the setup first' })
  if (verifyCode(admin.twoFactorPending, req.body?.code) === null) {
    return res.status(400).json({ message: 'That code is not correct. Check your app and try again.' })
  }
  await Admin.updateOne(
    { _id: admin._id },
    { $set: { twoFactorEnabled: true, twoFactorSecret: admin.twoFactorPending, twoFactorLastStep: 0 }, $unset: { twoFactorPending: 1 } }
  )
  res.json({ ok: true })
})


router.post('/2fa/disable', protect, async (req, res) => {
  const { password, code } = req.body || {}
  const admin = await Admin.findById(req.admin._id).select('+password +twoFactorSecret')
  if (!admin.twoFactorEnabled) return res.status(400).json({ message: 'Two-step login is not on' })
  if (needsTwoFactor(admin.role)) {
    return res.status(400).json({ message: 'Your role must keep two-step login on. If you changed phones, ask a super admin to reset it.' })
  }
  if (!(await admin.matchPassword(String(password || '')))) {
    return res.status(400).json({ message: 'Wrong password' })
  }
  if (verifyCode(admin.twoFactorSecret, code, admin.twoFactorLastStep) === null) {
    return res.status(400).json({ message: 'That code is not correct. Try the newest code in your app.' })
  }
  await Admin.updateOne(
    { _id: admin._id },
    { $set: { twoFactorEnabled: false, twoFactorLastStep: 0 }, $unset: { twoFactorSecret: 1, twoFactorPending: 1 } }
  )
  res.json({ ok: true })
})

export default router