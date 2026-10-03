import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import Button from './Button'

export default function NotificationPrompt() {
  const { isSupported, permission, requestPermission } = useNotifications()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    if (!isSupported || permission !== 'default') return

    // Don't show immediately, wait a bit or use visit count logic
    const dismissTime = localStorage.getItem('outfitme_notif_dismiss_time')
    if (dismissTime) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 7) return // Don't bother user for 7 days if they dismissed
    }

    const visitCount = parseInt(localStorage.getItem('outfitme_visit_count') || '0')
    localStorage.setItem('outfitme_visit_count', (visitCount + 1).toString())

    if (visitCount >= 2) {
      // Small delay so it doesn't pop up instantly on page load
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, permission])

  const handleEnable = async () => {
    await requestPermission()
    setIsVisible(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('outfitme_notif_dismiss_time', Date.now().toString())
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 animate-fade-in relative overflow-hidden group">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-text-muted hover:text-text hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-white animate-pulse" />
        </div>
        
        <div className="flex-1 pt-1">
          <h3 className="font-bold text-text text-sm mb-1">Activa las notificaciones</h3>
          <p className="text-xs text-text-secondary mb-3 pr-4">
            Recibe un recordatorio del clima entre las 7 y las 9 mientras tengas abierto el inicio de OutfitMe.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={handleEnable} size="sm" className="text-xs py-1.5 px-3 h-auto">
              Sí, activar
            </Button>
            <Button variant="secondary" onClick={handleDismiss} size="sm" className="text-xs py-1.5 px-3 h-auto">
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
