import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Heart } from 'lucide-react'
import OutfitSwipeCard from '../components/outfit/OutfitSwipeCard'
import Button from '../components/ui/Button'
import { useOutfitStore } from '../store/useOutfitStore'
import { useAuthStore } from '../store/useAuthStore'
import { generateOutfitCollage, shareOutfitCollage } from '../utils/outfitCollage'
import { toast } from '../lib/toast'

export default function OutfitComparePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { saveOutfit } = useOutfitStore()
  const { user } = useAuthStore()
  const busy = useRef(false)
  const [saving, setSaving] = useState(false)
  
  const [outfits] = useState(location.state?.outfits || [])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (outfits.length === 0) {
      navigate('/outfit/generate')
    }
  }, [outfits, navigate])

  const handleResult = async (action, outfit) => {
    if (!outfit || busy.current) return
    busy.current = true
    setSaving(true)
    try {
    if (action === 'save') {
      const res = await saveOutfit(user.id, outfit.prendaIds, outfit.ocasion || 'casual', !!outfit.generado_por_ia, true)
      if (res?.error) throw res.error
      toast.success('Outfit guardado en favoritos')
    } else if (action === 'share') {
      const blob = await generateOutfitCollage(outfit.items, { ocasion: outfit.ocasion })
      await shareOutfitCollage(blob)
      return
    }
    
    setCurrentIndex(prev => prev + 1)
    } catch { toast.error('No se pudo completar la acción. Puedes intentarlo de nuevo.') }
    finally { busy.current = false; setSaving(false) }
  }

  if (currentIndex >= outfits.length && outfits.length > 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-success fill-success" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-text">¡Eso es todo!</h2>
        <p className="text-text-secondary mb-8">Has revisado todas las combinaciones sugeridas para esta ocasión.</p>
        <div className="flex flex-col gap-3 justify-center">
          <Button onClick={() => navigate('/outfit/generate')} className="w-full">
            Generar más combinaciones
          </Button>
          <Button variant="secondary" onClick={() => navigate('/outfits')} className="w-full">
            Ver mis outfits guardados
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-[calc(4rem+env(safe-area-inset-bottom))] bg-bg flex flex-col md:static md:h-[calc(100dvh-8rem)] overflow-hidden">
      <div className="p-4 flex items-center justify-between z-10 shrink-0">
        <button onClick={() => navigate('/outfit/generate')} className="p-2 rounded-xl bg-surface border border-border shadow-sm text-text-secondary hover:text-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-surface border border-border shadow-sm rounded-full px-4 py-1.5 text-sm font-bold text-text">
          {currentIndex + 1} / {outfits.length}
        </div>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>
      
      <div className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center w-full max-w-sm mx-auto">
        {outfits.map((outfit, i) => {
            if (i < currentIndex) return null // Ya pasó
            const isActive = i === currentIndex
            
            return (
              <OutfitSwipeCard 
                key={outfit.prendaIds.join('-') + i} 
                outfit={outfit} 
                active={isActive && !saving}
                onResult={(action) => handleResult(action, outfit)}
              />
            )
        }).reverse()}
      </div>
      
      <div className="p-6 flex justify-center gap-6 z-10 bg-gradient-to-t from-bg via-bg to-transparent shrink-0">
        <button 
          onClick={() => handleResult('discard', outfits[currentIndex])}
          disabled={saving} aria-label="Descartar outfit"
          className="w-16 h-16 rounded-full bg-surface border-2 border-border text-text-secondary flex items-center justify-center shadow-lg hover:border-error hover:text-error hover:bg-error-light transition-all active:scale-95"
        >
          <X className="w-8 h-8" />
        </button>
        <button 
          onClick={() => handleResult('save', outfits[currentIndex])}
          disabled={saving} aria-label="Guardar outfit en favoritos"
          className="w-16 h-16 rounded-full bg-surface border-2 border-border text-text-secondary flex items-center justify-center shadow-lg hover:border-success hover:text-success hover:bg-success-light transition-all active:scale-95"
        >
          <Heart className="w-8 h-8" />
        </button>
      </div>
    </div>
  )
}
