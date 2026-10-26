import mongoose from 'mongoose'

export const CATEGORIES = ['atrocity', 'discrimination', 'police', 'land', 'education', 'government', 'other']
export const STATUSES = ['new', 'in_progress', 'resolved', 'closed']

// A problem reported through the Help desk page
const complaintSchema = new mongoose.Schema(
  {
    refNo: { type: String, required: true, unique: true }, // like HD-261026-7KQ3, given to the person to track it
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    stateCode: { type: String, required: true, index: true },
    state: String,
    district: { type: String, trim: true, maxlength: 100 },
    category: { type: String, enum: CATEGORIES, required: true },
    incidentDate: Date,
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    photo: { url: String, publicId: String },
    status: { type: String, enum: STATUSES, default: 'new', index: true },
    publicNote: { type: String, trim: true, maxlength: 1000 }, // message the person sees when they track their complaint
    notes: [{ text: { type: String, maxlength: 2000 }, byName: String, at: { type: Date, default: Date.now } }], // team only
  },
  { timestamps: true }
)

export default mongoose.model('Complaint', complaintSchema)