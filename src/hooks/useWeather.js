import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CACHE_KEY = 'outfitme_weather'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCache(data) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
}

export function useWeather() {
  const [weather, setWeather] = useState(getCached)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)

  const fetchWeather = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCached()
      if (cached) {
        setWeather(cached)
        return
      }
    }

    setLoading(true)
    setError(null)
    setLocationDenied(false)

    try {
      // Get user's location
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalización no soportada'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: CACHE_DURATION,
        })
      })

      const { latitude: lat, longitude: lon } = position.coords

      // Call Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('obtener-clima', {
        body: { lat, lon },
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      setWeather(data)
      setCache(data)
    } catch (err) {
      if (err?.code === 1 || err?.message?.includes('denied')) {
        setLocationDenied(true)
        setError('Permiso de ubicación denegado')
      } else {
        setError(err.message || 'Error al obtener el clima')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { weather, loading, error, locationDenied, refetch: () => fetchWeather(true) }
}
