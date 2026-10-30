import mongoose from 'mongoose'

// Visitor numbers, one document per day (Indian date). Only counts are kept: no names, no IP addresses, no cookies.
const visitDaySchema = new mongoose.Schema(
    {
        day: { type: String, required: true, unique: true }, // like 2026-10-30
        views: { type: Number, default: 0 }, // pages opened
        visitors: { type: Number, default: 0 }, // different people (counted once a day)
        pages: { type: Map, of: Number, default: {} }, // page -> times opened
        sources: { type: Map, of: Number, default: {} }, // where they came from -> visitors
        devices: { type: Map, of: Number, default: {} }, // phone / computer / app -> visitors
        langs: { type: Map, of: Number, default: {} }, // hi / en -> visitors
    },
    { versionKey: false }
)
export const VisitDay = mongoose.model('VisitDay', visitDaySchema)

// "Have we already counted this person today?" A scrambled code made from their network address and browser
// with a secret that changes every day, so it cannot be turned back into who they are. Deleted after 2 days.
const visitorMarkSchema = new mongoose.Schema({
    _id: String, // day + scrambled code
    at: { type: Date, default: Date.now, expires: 2 * 24 * 3600 },
}, { versionKey: false })
export const VisitorMark = mongoose.model('VisitorMark', visitorMarkSchema)