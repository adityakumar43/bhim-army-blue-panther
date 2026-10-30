import mongoose from 'mongoose'

// One person let in at an event: a member whose card was scanned (or number typed),
// or a group of guests who are not members (member is empty, guests is how many)
const checkinSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        guests: { type: Number, min: 1, max: 50 },
        // A copy of the member's details at the time, so the list still reads well if they change later
        name: String,
        memberNo: String,
        district: String,
        stateCode: String,
        byId: mongoose.Schema.Types.ObjectId, // the team member who let them in
        byName: String,
    },
    { timestamps: true }
)

// A member is checked in only once per event
checkinSchema.index({ event: 1, member: 1 }, { unique: true, partialFilterExpression: { member: { $type: 'objectId' } } })

export default mongoose.model('Checkin', checkinSchema)