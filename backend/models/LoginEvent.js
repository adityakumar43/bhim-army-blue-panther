import mongoose from 'mongoose'

// One login attempt to the admin panel, successful or not
const loginEventSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    name: String,
    email: String,
    success: Boolean,
    reason: String, // like 'wrong password' or 'with 2-step code'
    ip: String,
    device: String, // like 'Chrome on Windows'
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
)

loginEventSchema.index({ admin: 1, createdAt: -1 })
// Old entries are removed automatically after 6 months
loginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 })

export default mongoose.model('LoginEvent', loginEventSchema)