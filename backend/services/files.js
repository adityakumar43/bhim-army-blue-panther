import { v2 as cloudinary } from 'cloudinary'
import '../config/cloudinary.js' // sets the Cloudinary account keys

// PDFs are stored as "raw" files (Cloudinary blocks PDF delivery for images on free accounts); pictures as images
export const kindOf = (mimetype) => (mimetype === 'application/pdf' ? 'raw' : 'image')

export function uploadFile(buffer, { mimetype, originalname }) {
    const resourceType = kindOf(mimetype)
    // A readable file name, so the downloaded file is called something like "constitution-of-india.pdf"
    const base = String(originalname || 'file').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'file'
    const suffix = Math.random().toString(36).slice(2, 7)
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                { folder: 'bluepanther/downloads', resource_type: resourceType, public_id: resourceType === 'raw' ? `${base}-${suffix}.pdf` : `${base}-${suffix}` },
                (err, r) => {
                    if (err) return reject(Object.assign(new Error(`Upload failed: ${err.message || 'Cloudinary error'}`), { status: 502 }))
                    resolve({ url: r.secure_url, publicId: r.public_id, resourceType, bytes: r.bytes, format: resourceType === 'raw' ? 'pdf' : r.format })
                }
            )
            .end(buffer)
    })
}

export async function deleteFile(file) {
    if (!file?.publicId) return
    try {
        await cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType || 'image' })
    } catch (err) {
        console.error('Could not delete file:', err.message)
    }
}