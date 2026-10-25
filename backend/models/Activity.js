import mongoose from 'mongoose'

// One line in the admin activity log: who did what, and when
const activitySchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminName: String,
    section: String, // like 'news' or 'members'
    action: String, // like 'create', 'delete', 'approve'
    text: String, // like 'approved the membership of'
    target: String, // the name or title of the item
    ip: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
)

activitySchema.index({ createdAt: -1 })
// Old entries are removed automatically after one year
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

export default mongoose.model('Activity', activitySchema)