/**
 * Utilities to generate and share outfit collages
 */

/**
 * Loads an image from a URL and returns a Promise that resolves to an HTMLImageElement
 */
import { resolvePhoto } from '../lib/privateMedia'

async function loadImage(reference) {
  const url = await resolvePhoto(reference)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar una foto para compartir.'))
    img.src = url
  })
}

/**
 * Generates a vertical 1080x1920 collage of the provided outfit garments
 * @param {Array} prendas - Array of garment objects containing `foto_url`
 * @param {Object} options - Additional info like `ocasion`
 * @returns {Promise<Blob>} - A blob of the generated JPEG image
 */
export async function generateOutfitCollage(prendas, options = {}) {
  const WIDTH = 1080
  const HEIGHT = 1920
  
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#F9FAFB' // bg color (light mode)
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Header background
  ctx.fillStyle = '#6C63FF' // primary color
  ctx.beginPath()
  ctx.roundRect(40, 40, WIDTH - 80, 160, 40)
  ctx.fill()

  // Header text
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 72px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('OutfitMe', WIDTH / 2, 120) // adjusted baseline visual center
  
  // Occasion text if available (in header or slightly below)
  // Re-adjusting the Y positions to fit nicely
  ctx.fillText('OutfitMe', WIDTH / 2, 90)
  ctx.font = '500 40px sans-serif'
  ctx.fillText(`Para: ${options.ocasion ? options.ocasion.charAt(0).toUpperCase() + options.ocasion.slice(1) : 'Hoy'}`, WIDTH / 2, 160)

  // Wait for all images to load
  const imageUrls = prendas.map(p => p.foto_url).filter(Boolean)
  if (imageUrls.length === 0) {
    throw new Error('No images available for this outfit.')
  }

  const images = await Promise.all(imageUrls.map(loadImage))

  // Grid layout parameters
  const PADDING = 40
  const TOP_OFFSET = 260 // space for header
  const BOTTOM_OFFSET = 100 // space for footer
  const contentHeight = HEIGHT - TOP_OFFSET - BOTTOM_OFFSET
  
  // Decide grid based on number of items (usually 2, 3 or 4)
  const columns = images.length > 2 ? 2 : 1
  const rows = Math.ceil(images.length / columns)
  
  const cellWidth = (WIDTH - (PADDING * 2) - (PADDING * (columns - 1))) / columns
  const cellHeight = (contentHeight - (PADDING * (rows - 1))) / rows

  // Draw images
  images.forEach((img, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    
    // Some centering logic if odd number of items on last row
    let xOffset = 0
    if (images.length === 3 && index === 2) {
      // Center the 3rd item
      xOffset = cellWidth / 2 + PADDING / 2
    }

    const x = PADDING + (col * (cellWidth + PADDING)) + xOffset
    const y = TOP_OFFSET + (row * (cellHeight + PADDING))

    // Draw rounded rect mask for image
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, cellWidth, cellHeight, 32)
    ctx.clip()
    
    // Draw background placeholder for transparent images
    ctx.fillStyle = '#f3f4f6' // bg-alt
    ctx.fillRect(x, y, cellWidth, cellHeight)

    // Calculate aspect ratio fit (cover)
    const imgAspect = img.width / img.height
    const cellAspect = cellWidth / cellHeight
    
    let drawWidth, drawHeight, drawX, drawY
    
    if (imgAspect > cellAspect) {
      // Image is wider
      drawHeight = cellHeight
      drawWidth = img.width * (cellHeight / img.height)
      drawX = x - (drawWidth - cellWidth) / 2
      drawY = y
    } else {
      // Image is taller
      drawWidth = cellWidth
      drawHeight = img.height * (cellWidth / img.width)
      drawX = x
      drawY = y - (drawHeight - cellHeight) / 2
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()
    
    // Optional: draw subtle border
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(x, y, cellWidth, cellHeight, 32)
    ctx.stroke()
  })

  // Footer branding
  ctx.fillStyle = '#9ca3af'
  ctx.font = '36px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Generado con OutfitMe', WIDTH / 2, HEIGHT - 40)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.9)
  })
}

/**
 * Attempts to share the blob using Web Share API if available,
 * otherwise triggers a download.
 */
export async function shareOutfitCollage(blob, filename = 'outfit.jpg') {
  const file = new File([blob], filename, { type: 'image/jpeg' })

  // Check if Web Share API with files is supported
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Mi Outfit',
        text: '¡Mira el outfit que armé con OutfitMe!',
        files: [file],
      })
      return { method: 'share', success: true }
    } catch (error) {
      // User cancelled or share failed, fallback to download or abort
      if (error.name !== 'AbortError') {
        console.error('Share failed', error)
      }
      return { method: 'share', success: false, error }
    }
  } else {
    // Fallback: Download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { method: 'download', success: true }
  }
}
