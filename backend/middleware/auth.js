import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import { can, needsTwoFactor } from '../config/roles.js'


// Someone who must use two-step login but has not set it up yet may only open these, to set it up
const SETUP_PATHS = ['/api/auth/me', '/api/auth/2fa/setup', '/api/auth/2fa/enable']


export async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Login required' })

  try {
    const { id, sid } = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findById(id).select('+sessionId')
    if (!admin) return res.status(401).json({ message: 'Account not found' })
    if (admin.active === false) return res.status(401).json({ message: 'This account is disabled' })
    if (admin.sessionId && sid !== admin.sessionId) {
      return res.status(401).json({ message: 'You were logged out because this account was logged in on another device.' })
    }
    if (needsTwoFactor(admin.role) && !admin.twoFactorEnabled && !SETUP_PATHS.includes(req.originalUrl.split('?')[0])) {
      return res.status(403).json({ code: '2FA_REQUIRED', message: 'Your role requires two-step login. Set it up first.' })
    }
    req.admin = admin
    next()
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}

// A State admin only sees and changes their own state's members and leaders.
// Gives their state code, or null for everyone else (no limit).
export const stateScope = (admin) => (['stateadmin', 'districtadmin'].includes(admin?.role) ? admin.state || 'none' : null)

// A District admin only sees their own district. Gives { state, district } for them, or null for everyone else.
export const districtScope = (admin) => (admin?.role === 'districtadmin' ? { state: admin.state || 'none', district: admin.district || 'none' } : null)

// Database condition for a district name, ignoring capitals and spaces around it ("lucknow " is Lucknow)
export const sameDistrict = (district) => new RegExp(`^\\s*${String(district).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')

// Lets the request through when the role has any one of these permissions
export const requireAny = (...permissions) => (req, res, next) =>
  permissions.some((p) => can(req.admin.role, p))
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do this' })

export const requirePermission = (permission) => (req, res, next) =>
  can(req.admin.role, permission)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do this' })
