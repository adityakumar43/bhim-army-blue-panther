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
    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    const admin = await Admin.findById(id)
    if (!admin) return res.status(401).json({ message: 'Account not found' })
    if (admin.active === false) return res.status(401).json({ message: 'This account is disabled' })
    if (needsTwoFactor(admin.role) && !admin.twoFactorEnabled && !SETUP_PATHS.includes(req.originalUrl.split('?')[0])) {
      return res.status(403).json({ code: '2FA_REQUIRED', message: 'Your role requires two-step login. Set it up first.' })
    }
    req.admin = admin
    next()
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}


export const requirePermission = (permission) => (req, res, next) =>
  can(req.admin.role, permission)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to do this' })
