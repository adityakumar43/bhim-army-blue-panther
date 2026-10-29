import mongoose from 'mongoose'
import crypto from 'crypto'

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    dob: Date, // date of birth
    assemblyNo: { type: Number, min: 1, max: 999 }, // Vidhan Sabha constituency number
    lokSabhaNo: { type: Number, min: 1, max: 999 }, // Lok Sabha constituency number
    photo: { url: String, publicId: String },
    city: { type: String, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    stateCode: { type: String, index: true }, // like 'uttar-pradesh', chosen from the list on the Join form
    message: { type: String, trim: true, maxlength: 500 },
    consentAt: Date, // when they ticked "I agree" to the Privacy Policy
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    memberNo: { type: String, unique: true, sparse: true },

    cardToken: { type: String, unique: true, sparse: true, default: () => crypto.randomBytes(16).toString('hex') },
    approvedAt: Date,
    reviewedAt: Date,
    reviewedByName: String,
    reviewedById: mongoose.Schema.Types.ObjectId,
    endReason: String, // why the membership was ended
    cardEmailedAt: Date,
    birthdayWishedYear: Number, // the last year a birthday email was sent
    emailOptOut: { type: Boolean, default: false }, // said "stop" to announcement emails
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', index: true }, // the member whose invite link they joined with
    detailsUpdatedAt: Date, // the last time the member changed their own details
    // "Update my details": the code emailed to them, and the pass they get after typing it (both kept scrambled)
    editCodeHash: { type: String, select: false },
    editCodeExpires: { type: Date, select: false },
    editCodeTries: { type: Number, select: false },
    editTokenHash: { type: String, select: false },
    editTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

export default mongoose.model('Member', memberSchema)
