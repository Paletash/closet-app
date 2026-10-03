import { useState } from 'react'
import { Share2, Loader2 } from 'lucide-react'
import Button from '../ui/Button'
import { toast } from '../../lib/toast'
import { generateOutfitCollage, shareOutfitCollage } from '../../utils/outfitCollage'

export default function ShareOutfitButton({ prendas, ocasion, className = '' }) {
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    if (!prendas || prendas.length === 0) {
      toast.error('No hay prendas para compartir')
      return
    }

    setLoading(true)
    try {
      toast.success('Generando imagen del outfit...', { duration: 2000 })
      
      const blob = await generateOutfitCollage(prendas, { ocasion })
      const result = await shareOutfitCollage(blob, `outfit-${Date.now()}.jpg`)
      
      if (result.success) {
        if (result.method === 'download') {
          toast.success('¡Imagen descargada!')
        }
        // If shared via Web Share API, no need for toast, the OS UI handles it
      }
    } catch (error) {
      console.error('Error sharing outfit:', error)
      toast.error('Error al generar la imagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleShare}
      disabled={loading}
      className={`flex items-center gap-2 ${className}`}
      title="Compartir Outfit"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
      <span className="hidden sm:inline">{loading ? 'Generando...' : 'Compartir'}</span>
    </Button>
  )
}
