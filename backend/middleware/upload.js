import multer from 'multer'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true)
    const err = new Error('Only JPG, PNG or WebP images are allowed')
    err.status = 400
    cb(err)
  },
})

// Help desk: up to 3 photos and one voice message (audio from the phone's recorder)
export const helpdeskUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photos' && /^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true)
    if (file.fieldname === 'voice' && /^audio\//.test(file.mimetype)) return cb(null, true)
    const err = new Error(file.fieldname === 'voice' ? 'The voice message could not be read. Please record it again.' : 'Only JPG, PNG or WebP images are allowed')
    err.status = 400
    cb(err)
  },
}).fields([{ name: 'photos', maxCount: 3 }, { name: 'voice', maxCount: 1 }])