import mongoose from 'mongoose'

// One member's answer to one poll (which answer, and where they are from, for the results by place)
const pollVoteSchema = new mongoose.Schema(
    {
        poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
        option: { type: Number, required: true, min: 0, max: 5 },
        stateCode: String,
        district: String,
    },
    { timestamps: true }
)

// One answer per member per poll
pollVoteSchema.index({ poll: 1, member: 1 }, { unique: true })

export default mongoose.model('PollVote', pollVoteSchema)