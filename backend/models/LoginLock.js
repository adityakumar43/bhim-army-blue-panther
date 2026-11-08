import mongoose from 'mongoose'

// Wrong admin logins (see routes/auth.js). Two kinds of record:
//   `${adminId}:${network}`  wrong tries from one network (a scrambled form of its address): locks only that network
//   `acct:${adminId}`        wrong tries for the account from everywhere: locks it for devices it does not know
// Each record removes itself a day after the last wrong try.
const loginLockSchema = new mongoose.Schema({
    _id: String,
    wrong: { type: Number, default: 0 },
    since: Date, // account record: when the current count started
    lockUntil: Date,
    at: { type: Date, default: Date.now, expires: 24 * 3600 },
}, { versionKey: false })

export default mongoose.model('LoginLock', loginLockSchema)
