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
    village: { type: String, trim: true, maxlength: 100 }, // village or locality
    policeStation: { type: String, trim: true, maxlength: 100 },
    category: { type: String, enum: CATEGORIES, required: true },
    incidentDate: Date,
    description: { type: String, trim: true, maxlength: 3000 }, // needed unless they recorded a voice message
    photo: { url: String, publicId: String }, // older cases: one photo
    photos: [{ url: String, publicId: String }], // up to 3 photos or documents
    voice: { url: String, publicId: String, seconds: Number }, // a recorded voice message
    status: { type: String, enum: STATUSES, default: 'new', index: true },
    publicNote: { type: String, trim: true, maxlength: 1000 }, // message the person sees when they track their complaint
    // Every update the person can see when they track it: the status at that time and the message, if any
    history: [{ status: String, note: { type: String, maxlength: 1000 }, at: { type: Date, default: Date.now } }],
    urgent: { type: Boolean, default: false, index: true },
    consentAt: Date, // when they ticked "I agree" to the Privacy Policy
    assignedTo: { adminId: mongoose.Schema.Types.ObjectId, name: String }, // the team member handling this case
    remindedAt: Date, // the last reminder email to the team about this case
    notes: [{ text: { type: String, maxlength: 2000 }, byName: String, at: { type: Date, default: Date.now } }], // team only
  },
  { timestamps: true }
)

export default mongoose.model('Complaint', complaintSchema)