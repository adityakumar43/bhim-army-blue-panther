// Phone cameras make 5 to 15 MB photos. This shrinks the picture in the browser before it is sent
// (longest side 1000 px), so uploads are fast on slow mobile data and never hit the size limit.
// If anything goes wrong it quietly sends the original instead.
export async function shrinkImage(file, maxSide = 1000) {
  try {
    if (!file || !file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob && blob.size < file.size ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}