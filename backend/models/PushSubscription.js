import mongoose from 'mongoose'

// A phone or computer that said "yes" to notifications. Nothing personal is kept: only the address
// the browser gave us to deliver notifications to, and the page language they used.
const pushSubscriptionSchema = new mongoose.Schema(
    {
        endpoint: { type: String, required: true, unique: true, maxlength: 1000 },
        keys: { p256dh: { type: String, required: true, maxlength: 200 }, auth: { type: String, required: true, maxlength: 100 } },
        lang: { type: String, enum: ['hi', 'en'], default: 'hi' },
        failures: { type: Number, default: 0 }, // sends that failed in a row; removed after a few
    },
    { timestamps: true }
)

export default mongoose.model('PushSubscription', pushSubscriptionSchema)