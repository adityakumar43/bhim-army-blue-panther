import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'
import PushSend from '../models/PushSend.js'

// Phone notifications ("web push"). The two keys are made once with:  npx web-push generate-vapid-keys
// and kept in .env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. Without them, notifications are switched off.
export const pushReady = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)

let configured = false
function setup() {
    if (configured || !pushReady()) return pushReady()
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || `mailto:${process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || 'admin@example.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
    configured = true
    return true
}

const GONE = [404, 410] // the device turned notifications off, or the app was removed

// Sends one notification to one device. Gives 'sent', 'removed' (device is gone, so it was deleted) or 'failed'.
export async function pushTo(sub, message) {
    if (!setup()) throw new Error('Phone notifications are not set up (VAPID keys in .env)')
    try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(message), { TTL: 24 * 3600, urgency: 'normal' })
        if (sub.failures) await PushSubscription.updateOne({ _id: sub._id }, { $set: { failures: 0 } })
        return 'sent'
    } catch (err) {
        if (GONE.includes(err.statusCode)) {
            await PushSubscription.deleteOne({ _id: sub._id })
            return 'removed'
        }
        // Something else went wrong (network, push service busy): try again next time, give up after 5 in a row
        const after = (sub.failures || 0) + 1
        if (after >= 5) await PushSubscription.deleteOne({ _id: sub._id })
        else await PushSubscription.updateOne({ _id: sub._id }, { $set: { failures: after } })
        console.error('Notification failed:', err.statusCode || '', err.body || err.message)
        return 'failed'
    }
}

// Sends a notification to every device, 20 at a time. Counts are saved as it goes so the admin page can show progress.
export async function runPush(id) {
    const ps = await PushSend.findById(id)
    if (!ps) return
    if (!setup()) {
        await PushSend.updateOne({ _id: id }, { $set: { status: 'stopped', note: 'Phone notifications are not set up on the server (VAPID keys in .env).', finishedAt: new Date() } })
        return
    }
    const message = { title: ps.title, body: ps.body || '', url: ps.url || '/', tag: String(ps._id) }
    const subs = await PushSubscription.find().select('endpoint keys failures').lean()
    const count = { sent: 0, failed: 0, removed: 0 }
    for (let i = 0; i < subs.length; i += 20) {
        const now = await PushSend.findById(id).select('status').lean()
        if (now?.status === 'stopped') break
        const results = await Promise.all(subs.slice(i, i + 20).map((s) => pushTo(s, message)))
        results.forEach((r) => count[r]++)
        await PushSend.updateOne({ _id: id }, { $set: count })
    }
    const final = await PushSend.findById(id).select('status').lean()
    await PushSend.updateOne({ _id: id }, { $set: { ...count, ...(final?.status === 'stopped' ? {} : { status: 'done' }), finishedAt: new Date() } })
}