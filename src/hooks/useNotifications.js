import { useState, useCallback } from 'react'

export function useNotifications() {
  const [isSupported] = useState(() => 'Notification' in window)
  const [permission, setPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'default'
  )
  const [isEnabled, setIsEnabled] = useState(() =>
    localStorage.getItem('outfitme_notif_enabled') === 'true'
  )

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        setIsEnabled(true)
        localStorage.setItem('outfitme_notif_enabled', 'true')
        return true
      } else {
        setIsEnabled(false)
        localStorage.setItem('outfitme_notif_enabled', 'false')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  const toggleEnabled = useCallback(async (value) => {
    if (value && permission !== 'granted') {
      const granted = await requestPermission()
      return granted
    }
    
    setIsEnabled(value)
    localStorage.setItem('outfitme_notif_enabled', value ? 'true' : 'false')
    return value
  }, [permission, requestPermission])

  return {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    toggleEnabled
  }
}

