import mongoose from 'mongoose'

// A phone or computer that has logged in to an admin account. The browser keeps a private code; only a
// scrambled form of it is kept here. While an account is locked after many wrong tries from different
// networks, its known devices can still log in (with the right password, and the 2-step code if it is on).
// Forgotten 90 days after the last login from it.
const knownDeviceSchema = new mongoose.Schema({
    _id: String, // `${adminId}:${scrambled code}`
    at: { type: Date, default: Date.now, expires: 90 * 24 * 3600 },
}, { versionKey: false })

export default mongoose.model('KnownDevice', knownDeviceSchema)
