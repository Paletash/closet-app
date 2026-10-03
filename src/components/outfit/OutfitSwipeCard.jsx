import PrivateImage from '../ui/PrivateImage'
import { useState, useRef, useEffect } from 'react'

export default function OutfitSwipeCard({ outfit, onResult, active }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })
  const pending = useRef(false)
  const mounted = useRef(true)
  const animation = useRef(null)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; clearTimeout(animation.current) }
  }, [])

  const finishSwipe = (action) => {
    pending.current = true
    animation.current = setTimeout(async () => {
      try { await onResult(action) }
      finally {
        pending.current = false
        // Failed saves and sharing keep this card: restore it for another attempt.
        if (mounted.current) setDragOffset({ x: 0, y: 0 })
      }
    }, 200)
  }

  const handleStart = (clientX, clientY) => {
    if (!active || pending.current) return
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !active) return
    const dx = clientX - startPos.current.x
    const dy = clientY - startPos.current.y
    setDragOffset({ x: dx, y: dy })
  }

  const handleEnd = () => {
    if (!isDragging || !active) return
    setIsDragging(false)
    
    const thresholdX = window.innerWidth * 0.25
    const thresholdY = -100 // swipe up
    
    if (dragOffset.x > thresholdX) {
      setDragOffset({ x: window.innerWidth, y: dragOffset.y })
      finishSwipe('save')
    } else if (dragOffset.x < -thresholdX) {
      setDragOffset({ x: -window.innerWidth, y: dragOffset.y })
      finishSwipe('discard')
    } else if (dragOffset.y < thresholdY) {
      setDragOffset({ x: dragOffset.x, y: -window.innerHeight })
      finishSwipe('share')
    } else {
      setDragOffset({ x: 0, y: 0 }) // snap back
    }
  }

  const onTouchStart = (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  const onMouseDown = (e) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e) => handleMove(e.clientX, e.clientY)
  const onMouseUp = () => handleEnd()
  const onMouseLeave = () => { if (isDragging) handleEnd() }
  
  const rotation = dragOffset.x * 0.05
  const items = outfit.items || []

  return (
    <div 
      className={`absolute inset-0 max-w-sm mx-auto w-full h-full bg-surface rounded-3xl shadow-xl border border-border select-none overflow-hidden touch-none
        ${!isDragging ? 'transition-all duration-300 ease-out' : ''}
      `}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        zIndex: active ? 10 : 0
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4 h-full flex flex-col pointer-events-none">
        <div className="flex-1 min-h-0 grid grid-cols-2 auto-rows-fr gap-2 mb-4 bg-bg-alt rounded-2xl p-2">
          {items.map((item, i) => (
             <div key={item.id || i} className={`min-h-0 bg-white rounded-xl overflow-hidden border border-border/50 ${items.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
               <PrivateImage src={item.foto_url} alt="" className="w-full h-full object-contain p-2" draggable={false} />
             </div>
          ))}
        </div>

        <div className="text-center">
          <p className="font-bold text-text text-xl">
            {outfit.generado_por_ia ? 'Personalizado con IA' : 'Combinación local'}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {Array.from(new Set(items.flatMap(i => i.estilos || []))).slice(0, 3).map(s => (
              <span key={s} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase tracking-wider">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Overlays */}
      <div className={`absolute top-12 right-8 border-4 border-success text-success font-black text-4xl rounded-xl px-4 py-2 rotate-12 transition-opacity ${dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'}`}>
        LIKE
      </div>
      <div className={`absolute top-12 left-8 border-4 border-error text-error font-black text-4xl rounded-xl px-4 py-2 -rotate-12 transition-opacity ${dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'}`}>
        NOPE
      </div>
      <div className={`absolute bottom-32 left-1/2 -translate-x-1/2 border-4 border-accent text-accent font-black text-2xl rounded-xl px-4 py-2 transition-opacity ${dragOffset.y < -50 && Math.abs(dragOffset.x) < 50 ? 'opacity-100' : 'opacity-0'}`}>
        COMPARTIR
      </div>
    </div>
  )
}
