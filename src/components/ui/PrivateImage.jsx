import { useEffect, useState } from 'react'
import { resolvePhoto } from '../../lib/privateMedia'

export default function PrivateImage({ src, alt = '', ...props }) {
  const [resolved, setResolved] = useState(null)
  useEffect(() => {
    let active = true
    const refresh = () => resolvePhoto(src).then(url => {
      if (active) setResolved({ source: src, url })
    }).catch(() => { if (active) setResolved({ source: src, url: '' }) })
    refresh()
    const timer = setInterval(refresh, 240000)
    return () => { active = false; clearInterval(timer) }
  }, [src])
  const url = resolved?.source === src ? resolved.url : ''
  return url ? <img {...props} src={url} alt={alt} /> : <span {...props} role="img" aria-label={alt || 'Foto no disponible'} />
}
