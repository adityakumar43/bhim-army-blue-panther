import "dotenv/config"
import mongoose from "mongoose"
import Admin from "../models/Admin.js"


const [name, email, password] = process.argv.slice(2)
if (!name || !email || !password) {
  console.error("Usage: npm run create-admin -- \"Name\" email password")
  process.exit(1)
}

await mongoose.connect(process.env.MONGO_URI)
await Admin.create({ name, email, password, role: 'superadmin' })
console.log(`Super admin created: ${email}`)
await mongoose.disconnect()
