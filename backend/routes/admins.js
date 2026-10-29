import { Router } from 'express'
import Admin from '../models/Admin.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { ROLES, can } from '../config/roles.js'
import { STATE_CODES } from '../config/states.js'
import { canonicalDistrict } from '../config/districts.js'

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
const hasState = (role) => role === 'stateadmin' || role === 'districtadmin'

// Is this a State admin (who may only manage their own state's District admins)?
const limited = (req) => !can(req.admin.role, 'admins')
const mine = (req, a) => !limited(req) || (a.role === 'districtadmin' && a.state === req.admin.state)

// Works out the state and district for a role, or gives the problem as text
function area(role, state, district) {
  if (!hasState(role)) return { state: null, district: null }
  if (!validState(state)) return { problem: NEED_STATE }
  if (role === 'stateadmin') return { state, district: null }
  const d = canonicalDistrict(state, district)
  return d ? { state, district: d } : { problem: NEED_DISTRICT }
}

const otherActiveSuperadmins = (excludeId) =>
  Admin.countDocuments({ _id: { $ne: excludeId }, role: 'superadmin', active: { $ne: false } })

router.get('/', async (req, res) => {
  const filter = limited(req) ? { role: 'districtadmin', state: req.admin.state } : {}
  res.json((await Admin.find(filter).sort({ createdAt: 1 })).map(view))
})

router.post('/', async (req, res) => {
  const { name, email, password } = req.body || {}
  // A State admin can only add District admins, and only in their own state
  const role = limited(req) ? 'districtadmin' : req.body?.role
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

router.patch('/:id', async (req, res) => {
  const target = await Admin.findById(req.params.id).select('+password').catch(() => null)
  if (!target || !mine(req, target)) return res.status(404).json({ message: 'Not found' })

  const { name, role, active, password, state, district } = req.body || {}
  const isSelf = target._id.equals(req.admin._id)
  const roleChanges = role !== undefined && role !== target.role
  const disabling = active === false && target.active !== false

  if (role !== undefined && !ROLES[role]) return res.status(400).json({ message: 'Unknown role' })
  if (limited(req) && roleChanges) return res.status(403).json({ message: 'You can only manage District admins' })
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

  if (name !== undefined && String(name).trim()) target.name = String(name).trim()
  if (role !== undefined) target.role = role
  target.state = where.state
  target.district = where.district
  if (active !== undefined) target.active = !!active
  if (password !== undefined) target.password = password
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