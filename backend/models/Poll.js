import mongoose from 'mongoose'

// A question for members, with 2 to 6 answers to choose from
const pollSchema = new mongoose.Schema(
    {
        questionHi: { type: String, trim: true, maxlength: 300 },
        questionEn: { type: String, trim: true, maxlength: 300 },
        options: {
            type: [{ textHi: { type: String, trim: true, maxlength: 120 }, textEn: { type: String, trim: true, maxlength: 120 } }],
            validate: [(v) => v.length >= 2 && v.length <= 6, 'A poll needs 2 to 6 answers'],
        },
        // Who may answer: all members (empty), the members of one state, or of one district
        stateCode: { type: String, trim: true, default: '' },
        district: { type: String, trim: true, default: '' },
        closesAt: Date, // empty: open until it is closed by hand
        closed: { type: Boolean, default: false },
        showResults: { type: Boolean, default: true }, // members see the results after they answer
        createdById: mongoose.Schema.Types.ObjectId,
        createdByName: String,
    },
    { timestamps: true }
)

export default mongoose.model('Poll', pollSchema)