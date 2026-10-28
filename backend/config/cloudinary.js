import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function uploadImage(buffer, folder = 'bluepanther') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
        if (err) return reject(err)
        resolve({ url: result.secure_url, publicId: result.public_id })
      })
      .end(buffer)
  })
}

// Voice messages: Cloudinary keeps audio under its "video" type
export function uploadAudio(buffer, folder = 'bluepanther') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'video' }, (err, result) => {
        if (err) return reject(err)
        resolve({ url: result.secure_url, publicId: result.public_id })
      })
      .end(buffer)
  })
}

// resourceType is 'image' for pictures and 'video' for voice messages
export async function deleteImage(publicId, resourceType = 'image') {
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error('Could not delete image:', err.message)
  }
}
