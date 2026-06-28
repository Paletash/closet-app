import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useWeather } from './useWeather'

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default') // 'default', 'granted', 'denied'
  const [isEnabled, setIsEnabled] = useState(false) // User preference from localStorage

  useEffect(() => {
    const supported = 'Notification' in window
    setIsSupported(supported)
    if (supported) {
      setPermission(Notification.permission)
    }
    
    const pref = localStorage.getItem('outfitme_notif_enabled')
    if (pref === 'true') setIsEnabled(true)
  }, [])

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
