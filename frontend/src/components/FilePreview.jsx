import { useEffect, useRef } from 'react'

// Shows a photo the visitor has just chosen (before it is uploaded). The browser makes a temporary address
// for the file, and it is freed again as soon as the photo changes or the preview goes away.
export default function FilePreview({ file, alt = '', className = '' }) {
  const img = useRef(null)
  useEffect(() => {
    if (!file || !img.current) return
    const url = URL.createObjectURL(file)
    img.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <img ref={img} alt={alt} className={className} />
}
