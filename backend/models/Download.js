import mongoose from 'mongoose'

export const DOWNLOAD_CATEGORIES = ['books', 'pamphlets', 'posters', 'forms', 'other']

// A file visitors can download: a book, pamphlet, poster, form...
const downloadSchema = new mongoose.Schema(
    {
        titleHi: { type: String, trim: true, maxlength: 150 },
        titleEn: { type: String, trim: true, maxlength: 150 },
        descriptionHi: { type: String, trim: true, maxlength: 400 },
        descriptionEn: { type: String, trim: true, maxlength: 400 },
        category: { type: String, enum: DOWNLOAD_CATEGORIES, default: 'other' },
        file: { url: String, publicId: String, resourceType: String, bytes: Number, format: String },
        order: { type: Number, default: 0 },
        count: { type: Number, default: 0 }, // how many times it was downloaded
    },
    { timestamps: true }
)

export default mongoose.model('Download', downloadSchema)