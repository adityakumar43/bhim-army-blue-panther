import mongoose from 'mongoose'

function makeModel(name, extra = {}) {
  const schema = new mongoose.Schema(
    {
      titleHi: { type: String, trim: true },
      titleEn: { type: String, trim: true },
      bodyHi: { type: String, trim: true },
      bodyEn: { type: String, trim: true },
      image: { url: String, publicId: String },
      ...extra,
    },
    { timestamps: true }
  )
  return mongoose.model(name, schema)
}

export const News = makeModel('News')
export const Event = makeModel('Event', {
  date: { type: Date, required: true },
  location: { type: String, trim: true },
})
export const Gallery = makeModel('Gallery')


export const Slide = makeModel('Slide', {
  order: { type: Number, default: 0 },
  
  link: {
    type: String,
    trim: true,
    match: [/^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/, 'Link must start with / or https://'],
  },
})
