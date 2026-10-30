import mongoose from 'mongoose'

// A notification sent from the admin panel to everyone who turned notifications on
const pushSendSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 80 },
        body: { type: String, trim: true, maxlength: 200 },
        url: { type: String, default: '/' }, // the page that opens when they tap it
        byName: String,
        byId: mongoose.Schema.Types.ObjectId,
        total: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        removed: { type: Number, default: 0 }, // devices that have turned notifications off or uninstalled
        status: { type: String, enum: ['sending', 'done', 'stopped'], default: 'sending' },
        note: String,
        finishedAt: Date,
    },
    { timestamps: true }
)

export default mongoose.model('PushSend', pushSendSchema)