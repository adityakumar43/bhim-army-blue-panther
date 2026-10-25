import { Router } from 'express'
import mongoose from 'mongoose'
import ExcelJS from 'exceljs'
import { protect, requirePermission } from '../middleware/auth.js'

const router = Router()

// Friendly sheet names. Anything not listed keeps its own name.
const NAMES = {
  Member: 'Members', Donation: 'Donations', Message: 'Messages', Leader: 'Leaders', News: 'News', Event: 'Events',
  Gallery: 'Gallery', Slide: 'Home slider', Announcement: 'Home updates', Admin: 'Team', Activity: 'Activity log',
}
const SKIP = new Set(['Counter']) // internal counters, not useful in a backup
// Secrets are never put in a backup file
const HIDE = '-password -twoFactorSecret -twoFactorPending -sessionId'

async function collectAll() {
  const out = {}
  const models = Object.entries(mongoose.models).filter(([name]) => !SKIP.has(name))
  models.sort(([a], [b]) => (NAMES[a] || a).localeCompare(NAMES[b] || b))
  for (const [name, Model] of models) out[NAMES[name] || name] = await Model.find().select(HIDE).sort({ createdAt: -1 }).lean()
  return out
}

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

// How many records each part has (shown on the Backup page)
router.get('/summary', protect, requirePermission('admins'), async (req, res) => {
  const models = Object.entries(mongoose.models).filter(([name]) => !SKIP.has(name))
  const counts = await Promise.all(models.map(async ([name, M]) => ({ name: NAMES[name] || name, count: await M.estimatedDocumentCount() })))
  res.json(counts.sort((a, b) => a.name.localeCompare(b.name)))
})

// Excel: one sheet per section, easy to open and read
// One cell value per column: dates stay dates, ids become text, small objects are spread out (image.url)
function flatten(doc) {
  const row = {}
  for (const [k, v] of Object.entries(doc)) {
    if (k === '__v') continue
    if (v instanceof Date) row[k] = v
    else if (v instanceof mongoose.Types.ObjectId) row[k] = String(v)
    else if (Array.isArray(v)) row[k] = v.length ? JSON.stringify(v) : ''
    else if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) row[`${k}.${k2}`] = v2 instanceof Date ? v2 : v2 == null ? '' : typeof v2 === 'object' ? JSON.stringify(v2) : v2
    else row[k] = v
  }
  return row
}

router.get('/excel', protect, requirePermission('admins'), async (req, res) => {
  const data = await collectAll()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Bhim Army Blue Panther'
  wb.created = new Date()
  for (const [sheetName, docs] of Object.entries(data)) {
    const rows = docs.map(flatten)
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))]
    const ws = wb.addWorksheet(sheetName.slice(0, 31))
    ws.columns = keys.map((k) => ({ header: k, key: k, width: Math.min(40, Math.max(12, k.length + 2)) }))
    rows.forEach((r) => ws.addRow(r))
    ws.getRow(1).font = { bold: true }
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    keys.forEach((k, i) => {
      if (rows.some((r) => r[k] instanceof Date)) ws.getColumn(i + 1).numFmt = 'dd-mmm-yyyy hh:mm'
    })
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="bluepanther-backup-${today()}.xlsx"`)
  await wb.xlsx.write(res)
  res.end()
})

// JSON: everything exactly as stored, for restoring the database if ever needed
router.get('/json', protect, requirePermission('admins'), async (req, res) => {
  const data = await collectAll()
  res.setHeader('Content-Disposition', `attachment; filename="bluepanther-backup-${today()}.json"`)
  res.json({ exportedAt: new Date(), exportedBy: req.admin.name, data })
})

export default router