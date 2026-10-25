import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { ROLES } from "../config/roles.js"

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.keys(ROLES), default: 'editor' },
    active: { type: Boolean, default: true },
    state: { type: String, default: null }, // for State admins: the state they look after, like 'uttar-pradesh'
    sessionId: { type: String, select: false }, // only the newest login stays valid
    failedLogins: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorPending: { type: String, select: false },
    twoFactorLastStep: { type: Number, default: 0 },
    seenDonationsAt: Date,
  },
  { timestamps: true }
)

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12)

})

adminSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

export default mongoose.model("Admin", adminSchema)
