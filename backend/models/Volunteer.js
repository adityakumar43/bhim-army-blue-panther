import mongoose from 'mongoose'

export const SKILLS = ['legal', 'teaching', 'medical', 'social', 'events', 'driving', 'writing', 'field', 'computer']
export const AVAILABILITY = ['weekends', 'evenings', 'anytime', 'events']
export const VOL_STATUSES = ['new', 'contacted', 'active', 'inactive']

// Someone who offered to volunteer, with what they can do
const volunteerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    stateCode: { type: String, required: true, index: true },
    state: String,
    district: { type: String, trim: true, maxlength: 100 },
    skills: [{ type: String, enum: SKILLS }],
    availability: { type: String, enum: AVAILABILITY, default: 'anytime' },
    message: { type: String, trim: true, maxlength: 500 },
    consentAt: Date, // when they ticked "I agree" to the Privacy Policy
    status: { type: String, enum: VOL_STATUSES, default: 'new', index: true },
    note: { type: String, trim: true, maxlength: 1000 }, // team only
  },
  { timestamps: true }
)

export default mongoose.model('Volunteer', volunteerSchema)