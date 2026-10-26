import mongoose from 'mongoose'

export const VIDEO_CATEGORIES = ['speeches', 'rallies', 'events', 'interviews', 'other']

// A YouTube video shown on the Videos page (only the YouTube id is stored, the video stays on YouTube)
const videoSchema = new mongoose.Schema(
    {
        youtubeId: { type: String, required: true, match: /^[A-Za-z0-9_-]{11}$/ },
        titleHi: { type: String, trim: true, maxlength: 150 },
        titleEn: { type: String, trim: true, maxlength: 150 },
        category: { type: String, enum: VIDEO_CATEGORIES, default: 'other' },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
)

export default mongoose.model('Video', videoSchema)