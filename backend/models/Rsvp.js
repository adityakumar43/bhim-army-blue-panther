import mongoose from 'mongoose'

// One person's "I will attend" for an event
const rsvpSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    district: { type: String, trim: true, maxlength: 100 },
    people: { type: Number, min: 1, max: 20, default: 1 }, // how many are coming, including this person
  },
  { timestamps: true }
)

// One registration per phone number per event (registering again updates it)
rsvpSchema.index({ event: 1, phone: 1 }, { unique: true })

export default mongoose.model('Rsvp', rsvpSchema)