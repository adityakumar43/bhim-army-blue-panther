import mongoose from 'mongoose'
import Admin from '../models/Admin.js'

export async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')

  
  await Admin.updateMany({ role: { $exists: false } }, { role: 'superadmin' })
  await Admin.updateMany({ active: { $exists: false } }, { active: true })
}
