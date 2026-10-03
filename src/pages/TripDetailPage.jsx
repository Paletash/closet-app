import PrivateImage from '../components/ui/PrivateImage'
import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useClothingStore } from '../store/useClothingStore'
import { useTripStore } from '../store/useTripStore'
import { generateOutfits } from '../lib/outfitEngine'
import {
  ChevronLeft, MapPin, Calendar, Luggage, Plus, Check, Square,
  CheckSquare, X, Sparkles, RefreshCw, ShirtIcon, Plane
} from 'lucide-react'
import { CATEGORIAS } from '../utils/categories'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { toast } from '../lib/toast'

function getDaysDiff(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1)
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TripDetailPage() {
  const { id: tripId } = useParams()
  const { user } = useAuthStore()
  const { clothes, fetchClothes } = useClothingStore()
  const { currentTrip, loading, fetchTrip, addPrendaToTrip, removePrendaFromTrip, togglePacked } = useTripStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [filterCat, setFilterCat] = useState(null)
  const [outfitResults, setOutfitResults] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (tripId) fetchTrip(tripId)
    if (user?.id) fetchClothes(user.id)
  }, [tripId, user?.id, fetchTrip, fetchClothes])

  const trip = currentTrip
  const prendas = useMemo(() => trip?.prendas || [], [trip?.prendas])
  const packedCount = prendas.filter((p) => p.empacado).length
  const totalCount = prendas.length
  const progress = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0

  // Group prendas by category for the checklist
  const groupedPrendas = useMemo(() => {
    const groups = {}
    for (const prenda of prendas) {
      const cat = prenda.categoria
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(prenda)
    }
    return groups
  }, [prendas])

  // Available clothes to add (not already in this trip)
  const availableClothes = useMemo(() => {
    const tripPrendaIds = new Set(prendas.map((p) => p.id))
    let filtered = clothes.filter((c) => !tripPrendaIds.has(c.id))
    if (filterCat) filtered = filtered.filter((c) => c.categoria === filterCat)
    return filtered
  }, [clothes, prendas, filterCat])

  const handleAdd = async (prendaId) => {
    const res = await addPrendaToTrip(tripId, prendaId)
    if (res?.error) toast.error(res.error.message || 'Error al agregar')
    else toast.success('Prenda añadida a la maleta')
  }

  const handleRemove = async (prendaId) => {
    const res = await removePrendaFromTrip(tripId, prendaId)
    if (res?.error) toast.error('Error al quitar')
  }

  const handleToggle = async (prendaId, current) => {
    await togglePacked(tripId, prendaId, current)
  }

  const handleGenerateOutfits = async () => {
    setGenerating(true)
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 400))
    const res = generateOutfits(prendas, {}, 3)
    setOutfitResults(res)
    if (res.error) toast.warning(res.error)
    setGenerating(false)
  }

  if (loading && !trip) {
    return <LoadingSpinner text="Cargando viaje..." />
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <EmptyState
          icon={Luggage}
          title="Viaje no encontrado"
          description="Este viaje no existe o fue eliminado."
          actionLabel="Volver a viajes"
          onAction={() => window.location.href = '/trips'}
        />
      </div>
    )
  }

  const days = getDaysDiff(trip.fecha_inicio, trip.fecha_fin)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Back link */}
      <Link to="/trips" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Mis viajes
      </Link>

      {/* Trip Header Card */}
      <div className="bg-gradient-to-br from-primary/8 via-surface to-accent-light rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {trip.destino}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-sm text-text-secondary">
                {formatDateShort(trip.fecha_inicio)} — {formatDateShort(trip.fecha_fin)} · {days} día{days > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-secondary">Progreso de empaque</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2.5 bg-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-text-muted">{packedCount} de {totalCount} empacadas</span>
            {progress === 100 && totalCount > 0 && (
              <span className="text-[10px] font-semibold text-success flex items-center gap-0.5">
                <Check className="w-3 h-3" /> ¡Todo listo!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setShowAddModal(true)} icon={Plus} variant="secondary" className="flex-1">
          Agregar prendas
        </Button>
        <Button
          onClick={handleGenerateOutfits}
          icon={Sparkles}
          className="flex-1"
          disabled={prendas.length < 3}
          loading={generating}
        >
          Generar outfits
        </Button>
      </div>

      {/* Checklist by Category */}
      {totalCount > 0 ? (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Luggage className="w-5 h-5 text-primary" />
            Checklist de empaque
          </h2>

          {Object.entries(groupedPrendas).map(([cat, items]) => {
            const catInfo = CATEGORIAS[cat]
            const catPacked = items.filter((i) => i.empacado).length

            return (
              <div key={cat} className="bg-surface rounded-2xl border border-border overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-3 bg-bg-alt/50 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    {catInfo?.icon}
                    <span className="text-sm font-semibold text-text">{catInfo?.label || cat}</span>
                  </div>
                  <span className="text-[10px] font-medium text-text-muted">
                    {catPacked}/{items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border/50">
                  {items.map((prenda) => (
                    <div
                      key={prenda.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        prenda.empacado ? 'bg-success-light/30' : 'hover:bg-bg-alt/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggle(prenda.id, prenda.empacado)}
                        className="shrink-0 cursor-pointer transition-transform active:scale-90"
                      >
                        {prenda.empacado ? (
                          <CheckSquare className="w-5 h-5 text-success" />
                        ) : (
                          <Square className="w-5 h-5 text-text-muted hover:text-primary" />
                        )}
                      </button>

                      {/* Photo */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-alt border border-border shrink-0">
                        <PrivateImage src={prenda.foto_url} alt={prenda.subcategoria} className="w-full h-full object-cover" loading="lazy" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${prenda.empacado ? 'text-text-muted line-through' : 'text-text'}`}>
                          {prenda.subcategoria || catInfo?.label}
                        </p>
                        {prenda.marca && (
                          <p className="text-[10px] text-text-muted">{prenda.marca}</p>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(prenda.id)}
                        className="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border border-dashed p-10 text-center mb-8">
          <ShirtIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted font-medium mb-1">Tu maleta está vacía</p>
          <p className="text-xs text-text-muted mb-4">Agrega prendas de tu closet para empezar a planear.</p>
          <Button onClick={() => setShowAddModal(true)} icon={Plus} size="sm">
            Agregar prendas
          </Button>
        </div>
      )}

      {/* Generated Outfits */}
      {outfitResults && !generating && (
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Outfits sugeridos
            </h2>
            <Button onClick={handleGenerateOutfits} icon={RefreshCw} variant="secondary" size="sm">
              Regenerar
            </Button>
          </div>

          {outfitResults.outfits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
              {outfitResults.outfits.map((outfit, idx) => (
                <div key={idx} className="bg-surface rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-text-secondary">Día {idx + 1}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success-light text-success">
                      {Math.round(outfit.score * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {outfit.items.map((item) => (
                      <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-bg-alt border border-border">
                        <PrivateImage src={item.foto_url} alt={item.subcategoria} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-6 text-center">
              <p className="text-sm text-text-muted">{outfitResults.error || 'No se pudieron generar outfits con las prendas de la maleta.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Clothes Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFilterCat(null) }}
        title="Agregar prendas a la maleta"
        size="lg"
      >
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border/50">
          <button
            onClick={() => setFilterCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              !filterCat ? 'bg-primary text-white' : 'bg-bg-alt text-text-secondary hover:text-text border border-border'
            }`}
          >
            Todas
          </button>
          {Object.entries(CATEGORIAS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setFilterCat(filterCat === key ? null : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterCat === key ? 'bg-primary text-white' : 'bg-bg-alt text-text-secondary hover:text-text border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {availableClothes.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto pr-1">
            {availableClothes.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAdd(item.id)}
                className="group text-left bg-bg rounded-xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="aspect-square overflow-hidden bg-bg-alt relative">
                  <PrivateImage src={item.foto_url} alt={item.subcategoria} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium text-text truncate">{item.subcategoria || CATEGORIAS[item.categoria]?.label}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted">
              {filterCat ? 'No hay más prendas de esta categoría disponibles.' : 'Todas tus prendas ya están en la maleta.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
