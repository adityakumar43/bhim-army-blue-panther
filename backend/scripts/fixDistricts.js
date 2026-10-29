import "dotenv/config"
import mongoose from "mongoose"
import Member from "../models/Member.js"
import { canonicalDistrict } from "../config/districts.js"
import { codeFromName } from "../config/stateNames.js"

// Puts old members' typed districts into the list's spelling ("lucknow ", "लखनऊ" -> "Lucknow").
// Usage: npm run fix-districts            (only shows what would change)
//        npm run fix-districts -- --save  (makes the changes)
const save = process.argv.includes("--save")

await mongoose.connect(process.env.MONGO_URI)
const members = await Member.find({ district: { $nin: [null, ""] } }).select("name memberNo district state stateCode").lean()

let same = 0
const changes = []
const unknown = []
for (const m of members) {
    const fixed = canonicalDistrict(m.stateCode || codeFromName(m.state), m.district)
    if (!fixed) unknown.push(m)
    else if (fixed === m.district) same++
    else changes.push({ m, fixed })
}

for (const { m, fixed } of changes) console.log(`  "${m.district}" -> "${fixed}"   (${m.name}${m.memberNo ? ", " + m.memberNo : ""})`)
console.log(`\n${members.length} members have a district: ${same} already right, ${changes.length} to fix, ${unknown.length} not found in the list.`)
if (unknown.length) {
    console.log("\nNot found (fix these by hand in the database, or leave them):")
    for (const m of unknown) console.log(`  "${m.district}", ${m.state || m.stateCode || "no state"}   (${m.name}${m.memberNo ? ", " + m.memberNo : ""})`)
}

if (save && changes.length) {
    await Member.bulkWrite(changes.map(({ m, fixed }) => ({ updateOne: { filter: { _id: m._id }, update: { $set: { district: fixed } } } })))
    console.log(`\nSaved ${changes.length} changes.`)
} else if (changes.length) {
    console.log('\nNothing was changed. Run again with  -- --save  to make these changes.')
}
await mongoose.disconnect()