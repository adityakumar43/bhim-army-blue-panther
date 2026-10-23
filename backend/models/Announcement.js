import mongoose from 'mongoose'

// A short update shown in the "Latest updates" bar on the Home page
const announcementSchema = new mongoose.Schema(
  {
    textHi: { type: String, trim: true, maxlength: 200 },
    textEn: { type: String, trim: true, maxlength: 200 },
    link: { type: String, trim: true, maxlength: 300 }, // optional: /join or https://...
    important: { type: Boolean, default: false }, // shown first, with an "Important" tag
    startsAt: Date, // optional: not shown before this day
    endsAt: Date, // optional: shown until the end of this day
  },
  { timestamps: true }
)

export default mongoose.model('Announcement', announcementSchema)