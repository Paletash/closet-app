import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, MapPin, RefreshCw, CloudFog } from 'lucide-react'

/**
 * Map OpenWeatherMap icon codes to Lucide icons
 */
function getWeatherIcon(iconId) {
  if (!iconId) return Sun
  // iconId is the weather condition id (e.g., 200-series = thunderstorm)
  if (iconId >= 200 && iconId < 300) return CloudLightning
  if (iconId >= 300 && iconId < 400) return CloudDrizzle
  if (iconId >= 500 && iconId < 600) return CloudRain
  if (iconId >= 600 && iconId < 700) return CloudSnow
  if (iconId >= 700 && iconId < 800) return CloudFog
  if (iconId === 800) return Sun
  if (iconId > 800) return Cloud
  return Sun
}

function getWeatherGradient(iconId) {
  if (!iconId) return 'from-amber-400 to-orange-500'
  if (iconId >= 200 && iconId < 300) return 'from-gray-600 to-purple-700'
  if (iconId >= 300 && iconId < 600) return 'from-blue-400 to-blue-600'
  if (iconId >= 600 && iconId < 700) return 'from-blue-200 to-indigo-300'
  if (iconId >= 700 && iconId < 800) return 'from-gray-300 to-gray-500'
  if (iconId === 800) return 'from-amber-400 to-orange-500'
  if (iconId > 800) return 'from-gray-400 to-blue-400'
  return 'from-amber-400 to-orange-500'
}

export default function WeatherCard({ weather, loading, error, locationDenied, onRefresh, compact = false }) {
  if (loading) {
    return (
      <div className={`bg-surface rounded-2xl border border-border ${compact ? 'p-3' : 'p-4'} animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-alt" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-alt rounded w-24" />
            <div className="h-3 bg-bg-alt rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error || locationDenied) {
    return (
      <div className={`bg-surface rounded-2xl border border-border ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-muted">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">
              {locationDenied
                ? 'Activa tu ubicación para ver el clima'
                : 'No se pudo obtener el clima'}
            </span>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-bg-alt transition-colors cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!weather) return null

  const WeatherIcon = getWeatherIcon(weather.icono_id)
  const gradient = getWeatherGradient(weather.icono_id)

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <WeatherIcon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-text">{weather.temperatura}°C</span>
        <span className="text-text-muted text-xs capitalize">{weather.descripcion}</span>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <WeatherIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-text">{weather.temperatura}°</span>
              <span className="text-sm text-text-muted">Sensación {weather.sensacion_termica}°</span>
            </div>
            <p className="text-sm text-text-secondary capitalize">{weather.descripcion}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
            <MapPin className="w-3 h-3" />
            {weather.ciudad}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" />{weather.humedad}%</span>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="mt-1 p-1 rounded-lg hover:bg-bg-alt transition-colors cursor-pointer">
              <RefreshCw className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
