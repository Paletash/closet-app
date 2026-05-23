import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTripStore } from '../store/useTripStore'
import { Luggage, Plus, MapPin, Calendar, ArrowRight, Trash2, Plane } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../components/ui/Toast'

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
  })
}

function getTripStatus(start, end) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T23:59:59')

  if (now < s) return { label: 'Próximo', color: 'bg-primary/10 text-primary' }
  if (now > e) return { label: 'Pasado', color: 'bg-bg-alt text-text-muted' }
  return { label: 'En curso', color: 'bg-success-light text-success' }
}

export default function TripsPage() {
  const { user } = useAuthStore()
  const { trips, loading, fetchTrips, createTrip, deleteTrip } = useTripStore()
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    destino: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  useEffect(() => {
    if (user?.id) fetchTrips(user.id)
  }, [user?.id, fetchTrips])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.destino.trim()) { toast.error('Escribe un destino'); return }
    if (!form.fecha_inicio || !form.fecha_fin) { toast.error('Selecciona las fechas'); return }
    if (form.fecha_fin < form.fecha_inicio) { toast.error('La fecha de regreso debe ser después de la salida'); return }

    setSaving(true)
    const res = await createTrip(user.id, form)
    setSaving(false)

    if (res?.error) {
      toast.error('Error al crear viaje')
    } else {
      toast.success('¡Viaje creado!')
      setForm({ destino: '', fecha_inicio: '', fecha_fin: '' })
      setShowCreate(false)
    }
  }

  const handleDelete = async (tripId) => {
    const res = await deleteTrip(tripId, user.id)
    if (res?.success) toast.success('Viaje eliminado')
    else toast.error('Error al eliminar')
  }

  if (loading && trips.length === 0) {
    return <LoadingSpinner text="Cargando viajes..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Luggage className="w-6 h-6 text-primary" />
            Modo Maleta
          </h1>
          <p className="text-sm text-text-muted mt-1">Planifica tus outfits para cada viaje</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={Plus} size="sm">
          Nuevo viaje
        </Button>
      </div>

      {/* Trip Cards */}
      {trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {trips.map((trip) => {
            const days = getDaysDiff(trip.fecha_inicio, trip.fecha_fin)
            const status = getTripStatus(trip.fecha_inicio, trip.fecha_fin)

            return (
              <div key={trip.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all group">
                {/* Gradient header */}
                <div className="h-24 bg-gradient-to-br from-primary/10 via-accent-light to-primary-light flex items-center justify-center relative">
                  <Plane className="w-10 h-10 text-primary/30" />
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-text text-lg flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        {trip.destino}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-xs text-text-secondary">
                          {formatDateShort(trip.fecha_inicio)} — {formatDateShort(trip.fecha_fin)} · {days} día{days > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(trip.id) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {trip.prendaCount} prenda{trip.prendaCount !== 1 ? 's' : ''} en maleta
                    </span>
                    <Link
                      to={`/trips/${trip.id}`}
                      className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                    >
                      Ver maleta <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Luggage}
          title="Sin viajes planeados"
          description="Crea un viaje para empezar a planear qué prendas llevar y generar outfits para cada día."
          actionLabel="Crear mi primer viaje"
          onAction={() => setShowCreate(true)}
        />
      )}

      {/* Create Trip Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuevo viaje" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Destino *"
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            placeholder="Cancún, CDMX, París..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha de salida *"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
            <Input
              label="Fecha de regreso *"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Crear viaje
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
