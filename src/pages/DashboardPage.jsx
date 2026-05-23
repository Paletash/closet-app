import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useClothingStore } from '../store/useClothingStore'
import { useOutfitStore } from '../store/useOutfitStore'
import { useWeather } from '../hooks/useWeather'
import { PlusCircle, Sparkles, ShirtIcon, Heart, ArrowRight, BarChart3, Zap, CalendarDays, Luggage, Camera } from 'lucide-react'
import { getGreeting } from '../utils/helpers'
import { CATEGORIAS } from '../utils/categories'
import WeatherCard from '../components/weather/WeatherCard'

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const { clothes, fetchClothes } = useClothingStore()
  const { outfits, fetchOutfits } = useOutfitStore()
  const { weather, loading: weatherLoading, error: weatherError, locationDenied, refetch: refetchWeather } = useWeather()

  useEffect(() => {
    if (user?.id) {
      fetchClothes(user.id)
      fetchOutfits(user.id)
    }
  }, [user?.id, fetchClothes, fetchOutfits])

  const greeting = getGreeting()
  const recentClothes = clothes.slice(0, 4)
  const favoriteOutfits = outfits.filter((o) => o.es_favorito).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          {greeting}, {profile?.nombre || 'amigo'}
        </h1>
        <p className="text-text-secondary mt-1">
          ¿Qué te vas a poner hoy?
        </p>
      </div>

      {/* Weather Widget */}
      <div className="mb-6">
        <WeatherCard
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          locationDenied={locationDenied}
          onRefresh={refetchWeather}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 stagger-children">
        {[
          { icon: ShirtIcon, label: 'Prendas', value: clothes.length, color: 'bg-primary/8 text-primary' },
          { icon: Sparkles, label: 'Outfits', value: outfits.length, color: 'bg-accent-light text-accent' },
          { icon: Heart, label: 'Favoritos', value: favoriteOutfits, color: 'bg-error-light text-error' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="bg-surface rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-text">{value}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          to="/closet/add"
          className="flex items-center gap-3 p-4 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm">Agregar prenda</div>
            <div className="text-xs opacity-80">Sube una foto</div>
          </div>
        </Link>
        <Link
          to="/outfit/generate"
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-sm text-text">Generar outfit</div>
            <div className="text-xs text-text-muted">IA + Clima</div>
          </div>
        </Link>
      </div>

      {/* Feature Links */}
      <div className="grid grid-cols-3 gap-3 mb-8 stagger-children">
        <Link
          to="/calendar"
          className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-2xl hover:shadow-sm hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-text">Calendario</span>
        </Link>
        <Link
          to="/trips"
          className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-2xl hover:shadow-sm hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center group-hover:scale-110 transition-transform">
            <Luggage className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-text">Maleta</span>
        </Link>
        <Link
          to="/look"
          className="flex flex-col items-center gap-2 p-4 bg-surface border border-border rounded-2xl hover:shadow-sm hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5 text-success" />
          </div>
          <span className="text-xs font-medium text-text">Look del Día</span>
        </Link>
      </div>

      {/* Recent Clothes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Últimas prendas</h2>
          {clothes.length > 4 && (
            <Link to="/closet" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentClothes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            {recentClothes.map((item) => (
              <Link
                key={item.id}
                to={`/closet/${item.id}`}
                className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-square overflow-hidden bg-bg-alt">
                  <img
                    src={item.foto_url}
                    alt={item.subcategoria || item.categoria}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-text truncate">
                    {item.subcategoria || CATEGORIAS[item.categoria]?.label}
                  </p>
                  <p className="text-xs text-text-muted">
                    {CATEGORIAS[item.categoria]?.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <p className="text-text-muted mb-3">Aún no tienes prendas</p>
            <Link to="/closet/add">
              <button className="text-sm text-primary font-medium hover:underline cursor-pointer">
                Sube tu primera prenda →
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
