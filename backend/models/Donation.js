import mongoose from 'mongoose'
import crypto from 'crypto'

const donationSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    paymentId: String,
    amount: { type: Number, required: true }, 
    name: { type: String, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    status: { type: String, enum: ['created', 'paid'], default: 'created' },
    paidAt: Date,
    receiptNo: { type: String, unique: true, sparse: true },
    
    receiptToken: { type: String, unique: true, sparse: true, default: () => crypto.randomBytes(16).toString('hex') },
    receiptEmailedAt: Date,
  },
  { timestamps: true }
)

export default mongoose.model('Donation', donationSchema)
