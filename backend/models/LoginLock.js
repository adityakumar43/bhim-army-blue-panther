import mongoose from 'mongoose'

// Wrong admin logins, counted per account AND network (a scrambled form of the network address).
// Someone typing wrong passwords for an account locks only their own network out of it, never the real admin
// on theirs. Each record removes itself a day after the last wrong try.
const loginLockSchema = new mongoose.Schema({
    _id: String, // `${adminId}:${network}`
    wrong: { type: Number, default: 0 },
    lockUntil: Date,
    at: { type: Date, default: Date.now, expires: 24 * 3600 },
}, { versionKey: false })

export default mongoose.model('LoginLock', loginLockSchema)
