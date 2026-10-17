import mongoose from 'mongoose'
import crypto from 'crypto'

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    memberNo: { type: String, unique: true, sparse: true }, 
    
    cardToken: { type: String, unique: true, sparse: true, default: () => crypto.randomBytes(16).toString('hex') },
    approvedAt: Date,
    reviewedAt: Date, 
    reviewedByName: String, 
    reviewedById: mongoose.Schema.Types.ObjectId,
    cardEmailedAt: Date,
  },
  { timestamps: true }
)

export default mongoose.model('Member', memberSchema)
