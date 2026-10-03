export const PHOTO_BUCKETS = ['prendas-fotos', 'avatares']

// Supports existing public URLs without rewriting the user's records.
export function parseMediaReference(value, projectUrl) {
  if (!value || typeof value !== 'string') return null
  try {
    if (value.startsWith('storage://')) {
      const url = new URL(value)
      const path = decodeURIComponent(url.pathname.slice(1))
      return PHOTO_BUCKETS.includes(url.hostname) && path && !path.split('/').includes('..')
        ? { bucket: url.hostname, path } : null
    }
    const url = new URL(value)
    if (url.origin !== new URL(projectUrl).origin) return null
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/)
    return match && PHOTO_BUCKETS.includes(match[1]) ? { bucket: match[1], path: decodeURIComponent(match[2]) } : null
  } catch { return null }
}

export function mediaReference(bucket, path) {
  if (!PHOTO_BUCKETS.includes(bucket) || !path || path.split('/').includes('..')) throw new Error('Referencia de foto inválida')
  return `storage://${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`
}
