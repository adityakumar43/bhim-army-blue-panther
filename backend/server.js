import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import crud from './routes/crud.js'
import memberRoutes from './routes/members.js'
import announcementRoutes from './routes/announcements.js'
import contactRoutes from './routes/contact.js'
import donationRoutes, { razorpayWebhook } from './routes/donations.js'
import adminRoutes from './routes/admin.js'
import adminsRoutes from './routes/admins.js'
import { News, Event, Gallery, Slide } from './models/Content.js'

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI in .env')
  process.exit(1)
}

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_URL }))

app.post('/api/donations/webhook', express.raw({ type: 'application/json' }), razorpayWebhook)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)

app.use('/api/news', crud(News, {
  fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn'],
  sort: { createdAt: -1 },
}))
app.use('/api/events', crud(Event, {
  fields: ['titleHi', 'titleEn', 'bodyHi', 'bodyEn', 'date', 'location'],
  sort: { date: -1 },
}))
app.use('/api/gallery', crud(Gallery, {
  fields: ['titleHi', 'titleEn', 'section', 'kind', 'communityHi', 'communityEn'],
  filterFields: ['section', 'kind'],
  sort: { createdAt: -1 },
  requireTitle: false,
  requireImage: true,
}))

app.use('/api/slides', crud(Slide, {
  fields: ['titleHi', 'titleEn', 'link', 'order'],
  sort: { order: 1, createdAt: -1 },
  requireTitle: false,
  requireImage: true,
}))

app.use('/api/members', memberRoutes)
app.use('/api/announcements', announcementRoutes)

app.use('/api/contact', contactRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admins', adminsRoutes)

app.use((req, res) => res.status(404).json({ message: 'Not found' }))
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Image must be under 5 MB' })
  if (err.status === 400) return res.status(400).json({ message: err.message })
  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
})

connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running')))
  .catch((err) => {
    console.error('Database connection failed:', err.message)
    process.exit(1)
  })
