import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useClothingStore } from '../store/useClothingStore'
import { PlusCircle, ShirtIcon, Filter } from 'lucide-react'
import ClothingGrid from '../components/closet/ClothingGrid'
import ClothingFilters from '../components/closet/ClothingFilters'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useState } from 'react'

export default function ClosetPage() {
  const { user } = useAuthStore()
  const { clothes, loading, fetchClothes, getFilteredClothes } = useClothingStore()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user?.id) fetchClothes(user.id)
  }, [user?.id, fetchClothes])

  const filtered = getFilteredClothes()

  if (loading && clothes.length === 0) {
    return <LoadingSpinner size="lg" text="Cargando tu closet..." />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Mi Closet</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {clothes.length} prenda{clothes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-2.5 rounded-xl border transition-colors cursor-pointer
              ${showFilters
                ? 'bg-primary/8 border-primary/20 text-primary'
                : 'bg-surface border-border text-text-secondary hover:text-text'
              }
            `}
          >
            <Filter className="w-5 h-5" />
          </button>
          <Link
            to="/closet/add"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && <ClothingFilters />}

      {/* Grid */}
      {filtered.length > 0 ? (
        <ClothingGrid clothes={filtered} />
      ) : clothes.length > 0 ? (
        <EmptyState
          icon={Filter}
          title="Sin resultados"
          description="Ninguna prenda coincide con los filtros seleccionados."
          actionLabel="Limpiar filtros"
          onAction={() => useClothingStore.getState().clearFilters()}
        />
      ) : (
        <EmptyState
          icon={ShirtIcon}
          title="Tu closet está vacío"
          description="Empieza subiendo tu primera prenda para organizar tu guardarropa."
          actionLabel="Agregar primera prenda"
          onAction={() => window.location.href = '/closet/add'}
        />
      )}
    </div>
  )
}
