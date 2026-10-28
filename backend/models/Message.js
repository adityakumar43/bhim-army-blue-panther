import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    consentAt: Date, // when they ticked "I agree" to the Privacy Policy
    topic: { type: String, enum: ['general', 'membership', 'event', 'media', 'other'], default: 'general' },
    read: { type: Boolean, default: false },
    // Email replies sent from the admin panel
    replies: [{ text: { type: String, maxlength: 5000 }, byName: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
)

export default mongoose.model('Message', messageSchema)
