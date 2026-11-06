import mongoose from 'mongoose'

// Someone who took the Preamble pledge on the Samvidhan Divas page (/samvidhan).
// Only the name and the place are kept: no phone, no email.
const pledgeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 60 },
        stateCode: { type: String, required: true, index: true },
        district: { type: String, trim: true, maxlength: 100 },
        certNo: { type: String, required: true, unique: true }, // printed on their certificate, like SD-2026-000123
        year: { type: Number, index: true }, // the Indian year they took it, for "this year" numbers
    },
    { timestamps: true }
)

export default mongoose.model('Pledge', pledgeSchema)
