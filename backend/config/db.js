import mongoose from 'mongoose'
import Admin from '../models/Admin.js'
import { Gallery } from '../models/Content.js'
import { backfillCards } from '../services/members.js'

export async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')


  await Admin.updateMany({ role: { $exists: false } }, { role: 'superadmin' })
  await Admin.updateMany({ active: { $exists: false } }, { active: true })
  await backfillCards()
  // Gallery photos uploaded before sections existed belong to the general section
  await Gallery.updateMany({ section: { $exists: false } }, { $set: { section: 'general' } })
}
