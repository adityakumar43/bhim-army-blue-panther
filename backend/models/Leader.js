import mongoose from 'mongoose'
import { STATE_CODES } from '../config/states.js'

// A person in the organisation's leadership: national, or for one state / union territory
const leaderSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['national', 'state', 'district'], required: true },
    state: { type: String, enum: [...STATE_CODES, null] }, // only for state leaders
    nameHi: { type: String, trim: true, maxlength: 100 },
    nameEn: { type: String, trim: true, maxlength: 100 },
    roleHi: { type: String, trim: true, maxlength: 100 }, // for example: प्रदेश अध्यक्ष
    roleEn: { type: String, trim: true, maxlength: 100 }, // for example: State President
    areaHi: { type: String, trim: true, maxlength: 100 }, // optional district or area
    areaEn: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 }, // optional, shown publicly
    photo: { url: String, publicId: String },
    order: { type: Number, default: 0 }, // lower shows first
  },
  { timestamps: true }
)

export default mongoose.model('Leader', leaderSchema)