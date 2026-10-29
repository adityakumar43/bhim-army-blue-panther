import mongoose from 'mongoose'

// An announcement emailed to members (all of them, one state, or one district)
const mailoutSchema = new mongoose.Schema(
    {
        subject: { type: String, required: true, trim: true, maxlength: 150 },
        body: { type: String, required: true, trim: true, maxlength: 5000 },
        stateCode: { type: String, default: '' }, // empty = every state
        district: { type: String, trim: true, default: '' }, // empty = every district
        byName: String, // who sent it
        byId: mongoose.Schema.Types.ObjectId,
        total: { type: Number, default: 0 }, // how many members it was going to
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        status: { type: String, enum: ['sending', 'done', 'stopped'], default: 'sending' },
        note: String, // why it stopped, if it did
        finishedAt: Date,
    },
    { timestamps: true }
)

export default mongoose.model('Mailout', mailoutSchema)