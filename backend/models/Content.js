import mongoose from 'mongoose'

function makeModel(name, extra = {}) {
  const schema = new mongoose.Schema(
    {
      titleHi: { type: String, trim: true },
      titleEn: { type: String, trim: true },
      bodyHi: { type: String, trim: true },
      bodyEn: { type: String, trim: true },
      image: { url: String, publicId: String },
      draft: { type: Boolean, default: false },
      publishAt: { type: Date, default: null }, // hidden from the public website until this time
      ...extra,
    },
    { timestamps: true }
  )
  return mongoose.model(name, schema)
}

export const News = makeModel('News')
export const Event = makeModel('Event', {
  date: { type: Date, required: true },
  time: { type: String, trim: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be like 10:30'] }, // start time, optional
  location: { type: String, trim: true },
  stateCode: { type: String, trim: true }, // the state it is in, optional (for the calendar's state filter)
})

// "general" photos, or "adivasi" for traditional dances and festivals of tribal and Adivasi communities
export const Gallery = makeModel('Gallery', {
  section: { type: String, enum: ['general', 'adivasi'], default: 'general' },
  kind: { type: String, enum: ['', 'dance', 'festival'] },
  communityHi: { type: String, trim: true, maxlength: 80 },
  communityEn: { type: String, trim: true, maxlength: 80 },
})


export const Slide = makeModel('Slide', {
  order: { type: Number, default: 0 },

  link: {
    type: String,
    trim: true,
    match: [/^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/, 'Link must start with / or https://'],
  },
})
