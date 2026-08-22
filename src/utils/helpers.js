/**
 * Check if browser supports WebP encoding via canvas
 */
let _supportsWebP = null
function supportsWebP() {
  if (_supportsWebP !== null) return _supportsWebP
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    _supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    _supportsWebP = false
  }
  return _supportsWebP
}

/**
 * Compress image before uploading to Supabase Storage
 * Uses WebP (40-50% smaller) with JPEG fallback for older browsers
 * Resizes to max 800px width at 80% quality
 */
export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const useWebP = supportsWebP()
        const mimeType = useWebP ? 'image/webp' : 'image/jpeg'
        const ext = useWebP ? '.webp' : '.jpg'

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ext), {
              type: mimeType,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          mimeType,
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Format date to Spanish locale
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Generate greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Create image preview URL from File object
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file)
}

/**
 * Revoke image preview URL to free memory
 */
export function revokePreviewUrl(url) {
  URL.revokeObjectURL(url)
}
