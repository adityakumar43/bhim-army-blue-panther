import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import crud from './routes/crud.js'
import memberRoutes from './routes/members.js'
import leaderRoutes from './routes/leaders.js'
import announcementRoutes from './routes/announcements.js'
import contactRoutes from './routes/contact.js'
import donationRoutes, { razorpayWebhook } from './routes/donations.js'
import adminRoutes from './routes/admin.js'
import adminsRoutes from './routes/admins.js'
import activityRoutes from './routes/activity.js'
import backupRoutes from './routes/backup.js'
import rsvpRoutes from './routes/rsvp.js'
import loginRoutes from './routes/logins.js'
import { activityLog } from './middleware/activity.js'
import { News, Event, Gallery, Slide } from './models/Content.js'
import helpdeskRoutes from './routes/helpdesk.js'
import volunteerRoutes from './routes/volunteers.js'
import downloadRoutes from './routes/downloads.js'
import videoRoutes from './routes/videos.js'
import shareRoutes from './routes/share.js'
import sitemapRoutes from './routes/sitemap.js'
import birthdayRoutes from './routes/birthdays.js'
import certificateRoutes from './routes/certificates.js'
import { startBirthdayTimer } from './services/birthdays.js'

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
app.use(activityLog)

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
app.use('/api/rsvp', rsvpRoutes)
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
app.use('/api/leaders', leaderRoutes)
app.use('/api/announcements', announcementRoutes)

app.use('/api/contact', contactRoutes)
app.use('/api/helpdesk', helpdeskRoutes)
app.use('/api/volunteers', volunteerRoutes)
app.use('/api/downloads', downloadRoutes)
app.use('/api/videos', videoRoutes)
app.use('/share', shareRoutes)
app.use('/sitemap.xml', sitemapRoutes)
app.use('/api/birthdays', birthdayRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/logins', loginRoutes)

app.use((req, res) => res.status(404).json({ message: 'Not found' }))
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'This file is too large. Please choose a smaller photo.' })
  if (err.status === 400) return res.status(400).json({ message: err.message })
  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
})

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => console.log('API running'))
    startBirthdayTimer()
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message)
    process.exit(1)
  })
