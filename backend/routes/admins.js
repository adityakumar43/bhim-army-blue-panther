import { Router } from 'express'
import Admin from '../models/Admin.js'
import { protect, requirePermission } from '../middleware/auth.js'
import { ROLES } from '../config/roles.js'
import { STATE_CODES } from '../config/states.js'


const router = Router()
router.use(protect, requirePermission('admins'))

const view = (a) => ({
  id: a._id, name: a.name, email: a.email, role: a.role, active: a.active !== false, createdAt: a.createdAt,
  twoFactorEnabled: a.twoFactorEnabled === true, state: a.state || null,
})


// A State admin must have a valid state; every other role has none
const NEED_STATE = 'Choose the state this State admin will look after'
const validState = (s) => STATE_CODES.includes(String(s || ''))


const otherActiveSuperadmins = (excludeId) =>
  Admin.countDocuments({ _id: { $ne: excludeId }, role: 'superadmin', active: { $ne: false } })

router.get('/', async (req, res) => {
  res.json((await Admin.find().sort({ createdAt: 1 })).map(view))
})

router.post('/', async (req, res) => {
  const { name, email, password, role, state } = req.body || {}
  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Enter a name' })
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ message: 'Enter a valid email address' })
  if (!password || String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }
  if (!ROLES[role]) return res.status(400).json({ message: 'Choose a role' })
  if (role === 'stateadmin' && !validState(state)) return res.status(400).json({ message: NEED_STATE })

  try {
    const admin = await Admin.create({ name: String(name).trim(), email, password, role, state: role === 'stateadmin' ? state : null })
    res.status(201).json(view(admin))
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' })
    throw err
  }
})

router.patch('/:id', async (req, res) => {
  const target = await Admin.findById(req.params.id).select('+password').catch(() => null)
  if (!target) return res.status(404).json({ message: 'Not found' })

  const { name, role, active, password, state } = req.body || {}
  const isSelf = target._id.equals(req.admin._id)
  const roleChanges = role !== undefined && role !== target.role
  const disabling = active === false && target.active !== false

  if (role !== undefined && !ROLES[role]) return res.status(400).json({ message: 'Unknown role' })
  if (isSelf && (roleChanges || disabling)) {
    return res.status(400).json({ message: 'You cannot change your own role or disable your own account' })
  }
  if (target.role === 'superadmin' && target.active !== false && (roleChanges || disabling)) {
    if ((await otherActiveSuperadmins(target._id)) < 1) {
      return res.status(400).json({ message: 'There must be at least one active super admin' })
    }
  }
  const newRole = role ?? target.role
  const newState = newRole === 'stateadmin' ? (state ?? target.state) : null
  if (newRole === 'stateadmin' && !validState(newState)) return res.status(400).json({ message: NEED_STATE })
  if (password !== undefined && String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }

  if (name !== undefined && String(name).trim()) target.name = String(name).trim()
  if (role !== undefined) target.role = role
  target.state = newState
  if (active !== undefined) target.active = !!active
  if (password !== undefined) target.password = password
  await target.save()
  res.json(view(target))
})



router.post('/:id/reset-2fa', async (req, res) => {
  const target = await Admin.findById(req.params.id).catch(() => null)
  if (!target) return res.status(404).json({ message: 'Not found' })
  if (target._id.equals(req.admin._id)) return res.status(400).json({ message: 'Use the Security page for your own account' })
  await Admin.updateOne(
    { _id: target._id },
    { $set: { twoFactorEnabled: false, twoFactorLastStep: 0, failedLogins: 0 }, $unset: { twoFactorSecret: 1, twoFactorPending: 1, lockUntil: 1 } }
  )
  res.json({ ok: true })
})


router.delete('/:id', async (req, res) => {
  const target = await Admin.findById(req.params.id).catch(() => null)
  if (!target) return res.status(404).json({ message: 'Not found' })
  if (target._id.equals(req.admin._id)) return res.status(400).json({ message: 'You cannot delete your own account' })
  if (target.role === 'superadmin' && target.active !== false && (await otherActiveSuperadmins(target._id)) < 1) {
    return res.status(400).json({ message: 'There must be at least one active super admin' })
  }
  await target.deleteOne()
  res.json({ ok: true })
})

export default router
