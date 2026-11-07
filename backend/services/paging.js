import mongoose from 'mongoose'

// Long admin lists come a page at a time, newest first (frontend/src/pages/admin/paged.jsx).
//   ?limit=   rows per page, at most `max`
//   ?before=  where the last row on screen sits: "<createdAt in ms>_<id>", with "<group>_" in front for lists
//             in groups (Help desk: 1 = urgent, 0 = the rest)
// The next page is the rows after that one, so nothing is skipped or shown twice when new rows arrive meanwhile.
export const NEWEST = { createdAt: -1, _id: -1 }

export function pageSize(req, max) {
    const n = Number(req.query.limit)
    return Number.isInteger(n) && n >= 1 && n <= max ? n : max
}

// null: the first page. false: a cursor that cannot be read.
export function cursorOf(req) {
    if (req.query.before === undefined || req.query.before === '') return null
    const m = /^(?:([01])_)?(\d{1,15})_([a-f0-9]{24})$/.exec(String(req.query.before))
    return m ? { group: m[1] === undefined ? null : Number(m[1]), at: new Date(Number(m[2])), id: new mongoose.Types.ObjectId(m[3]) } : false
}

// The filter, keeping only the rows after the cursor
export const after = (filter, c) => (c
    ? { $and: [filter, { $or: [{ createdAt: { $lt: c.at } }, { createdAt: c.at, _id: { $lt: c.id } }] }] }
    : filter)
