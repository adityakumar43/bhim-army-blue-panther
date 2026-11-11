import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import Admin from '../models/Admin.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { ROLES, can } from '../config/roles.js'
import { STATE_CODES } from '../config/states.js'
import { canonicalDistrict } from '../config/districts.js'
import LoginLock from '../models/LoginLock.js'

// Team & roles. Super admins manage everyone. A State admin manages only the District admins of their own state.
const router = Router()
router.use(protect, requirePermission('team'))

const view = (a) => ({
  id: a._id, name: a.name, email: a.email, role: a.role, active: a.active !== false, createdAt: a.createdAt,
  twoFactorEnabled: a.twoFactorEnabled === true, state: a.state || null, district: a.district || null,
})

// A State admin needs a state; a District admin needs a state and one of its districts; every other role has neither
const NEED_STATE = 'Choose the state this person will look after'
const NEED_DISTRICT = 'Choose the district this District admin will look after'
const validState = (s) => STATE_CODES.includes(String(s || ''))
const hasState = (role) => ['stateadmin', 'districtadmin', 'gate'].includes(role)
// The roles a State admin may add and manage, in their own state
const LOCAL = ['districtadmin', 'gate']

// Is this a State admin (who may only manage their own state's District admins)?
const limited = (req) => !can(req.admin.role, 'admins')
const mine = (req, a) => !limited(req) || (LOCAL.includes(a.role) && a.state === req.admin.state)

// Works out the state and district for a role, or gives the problem as text
function area(role, state, district) {
  if (!hasState(role)) return { state: null, district: null }
  if (!validState(state)) return { problem: NEED_STATE }
  if (role !== 'districtadmin') return { state, district: null } // State admins and Gate volunteers belong to a state only
  const d = canonicalDistrict(state, district)
  return d ? { state, district: d } : { problem: NEED_DISTRICT }
}

// Wrong current passwords when changing your own: at most 10 tries per 15 minutes
const ownPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Too many attempts. Try again in 15 minutes.' } })
const ownPasswordTries = (req, res, next) => (req.body?.password !== undefined && String(req.params.id) === String(req.admin._id) ? ownPasswordLimiter(req, res, next) : next())

const otherActiveSuperadmins = (excludeId) =>
  Admin.countDocuments({ _id: { $ne: excludeId }, role: 'superadmin', active: { $ne: false } })

router.get('/', async (req, res) => {
  const filter = limited(req) ? { role: { $in: LOCAL }, state: req.admin.state } : {}
  res.json((await Admin.find(filter).sort({ createdAt: 1 })).map(view))
})

router.post('/', async (req, res) => {
  const { name, email, password } = req.body || {}
  // A State admin can only add District admins and Gate volunteers, and only in their own state
  const role = limited(req) ? (LOCAL.includes(req.body?.role) ? req.body.role : 'districtadmin') : req.body?.role
  const state = limited(req) ? req.admin.state : req.body?.state
  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Enter a name' })
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ message: 'Enter a valid email address' })
  if (!password || String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }
  if (!ROLES[role]) return res.status(400).json({ message: 'Choose a role' })
  const where = area(role, state, req.body?.district)
  if (where.problem) return res.status(400).json({ message: where.problem })

  try {
    const admin = await Admin.create({ name: String(name).trim(), email, password, role, state: where.state, district: where.district })
    res.status(201).json(view(admin))
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' })
    throw err
  }
})

router.patch('/:id', ownPasswordTries, async (req, res) => {
  const target = await Admin.findById(req.params.id).select('+password').catch(() => null)
  if (!target || !mine(req, target)) return res.status(404).json({ message: 'Not found' })

  const { name, role, active, password, state, district } = req.body || {}
  const isSelf = target._id.equals(req.admin._id)
  const roleChanges = role !== undefined && role !== target.role
  const disabling = active === false && target.active !== false

  if (role !== undefined && !ROLES[role]) return res.status(400).json({ message: 'Unknown role' })
  if (limited(req) && roleChanges) return res.status(403).json({ message: 'You can only manage District admins and Gate volunteers' })
  if (limited(req) && state !== undefined && state !== req.admin.state) return res.status(403).json({ message: 'You can only choose districts of your own state' })
  if (isSelf && (roleChanges || disabling)) {
    return res.status(400).json({ message: 'You cannot change your own role or disable your own account' })
  }
  if (target.role === 'superadmin' && target.active !== false && (roleChanges || disabling)) {
    if ((await otherActiveSuperadmins(target._id)) < 1) {
      return res.status(400).json({ message: 'There must be at least one active super admin' })
    }
  }
  const newRole = role ?? target.role
  const where = area(newRole, state ?? target.state, district ?? target.district)
  if (where.problem) return res.status(400).json({ message: where.problem })
  if (password !== undefined && String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }
  if (password !== undefined && isSelf && !(await target.matchPassword(String(req.body?.currentPassword || '')))) {
    return res.status(400).json({ message: 'Your current password is not correct' })
  }

  if (name !== undefined && String(name).trim()) target.name = String(name).trim()
  if (role !== undefined) target.role = role
  target.state = where.state
  target.district = where.district
  if (active !== undefined) target.active = !!active
  if (password !== undefined) {
    target.password = password
    // A new password logs that admin out everywhere at once (a new session id makes their current login invalid).
    // Someone changing their own password keeps the session they are using: with one session per account, it is theirs.
    if (!isSelf) target.sessionId = crypto.randomUUID()
  }
  await target.save()
  res.json(view(target))
})

router.post('/:id/reset-2fa', async (req, res) => {
  const target = await Admin.findById(req.params.id).catch(() => null)
  if (!target || !mine(req, target)) return res.status(404).json({ message: 'Not found' })
  if (target._id.equals(req.admin._id)) return res.status(400).json({ message: 'Use the Security page for your own account' })
  await Admin.updateOne(
    { _id: target._id },
    { $set: { twoFactorEnabled: false, twoFactorLastStep: 0, failedLogins: 0 }, $unset: { twoFactorSecret: 1, twoFactorPending: 1, lockUntil: 1 } }
  )
  // and any lock from wrong tries: on every network, and for the account as a whole
  await LoginLock.deleteMany({ $or: [{ _id: { $regex: `^${target._id}:` } }, { _id: `acct:${target._id}` }] })
  res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const target = await Admin.findById(req.params.id).catch(() => null)
  if (!target || !mine(req, target)) return res.status(404).json({ message: 'Not found' })
  if (target._id.equals(req.admin._id)) return res.status(400).json({ message: 'You cannot delete your own account' })
  if (target.role === 'superadmin' && target.active !== false && (await otherActiveSuperadmins(target._id)) < 1) {
    return res.status(400).json({ message: 'There must be at least one active super admin' })
  }
  await target.deleteOne()
  res.json({ ok: true })
})

export default router