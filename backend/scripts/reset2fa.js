import 'dotenv/config'
import mongoose from 'mongoose'
import Admin from '../models/Admin.js'

// Usage: npm run reset-2fa -- you@example.com
const email = (process.argv[2] || '').toLowerCase()
if (!email) {
  console.error('Usage: npm run reset-2fa -- email')
  process.exit(1)
}

await mongoose.connect(process.env.MONGO_URI)
const r = await Admin.updateOne(
  { email },
  { $set: { twoFactorEnabled: false, twoFactorLastStep: 0, failedLogins: 0 }, $unset: { twoFactorSecret: 1, twoFactorPending: 1, lockUntil: 1 } }
)
console.log(r.matchedCount ? `Two-step login turned off for ${email}. Log in and turn it on again.` : `No admin found with the email ${email}`)
await mongoose.disconnect()