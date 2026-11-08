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
        // The last member it went to. Members are emailed in a fixed order, so a send that was interrupted
        // (Hostinger puts the app to sleep or restarts it) can continue with the next one, and nobody gets it twice.
        lastId: mongoose.Schema.Types.ObjectId,
        finishedAt: Date,
    },
    { timestamps: true }
)

export default mongoose.model('Mailout', mailoutSchema)