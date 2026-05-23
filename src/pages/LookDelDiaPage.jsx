import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useLookStore } from '../store/useLookStore'
import { Camera, Plus, Trash2, Calendar, Image, MessageSquare, X } from 'lucide-react'
import { compressImage } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../components/ui/Toast'

function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function LookDelDiaPage() {
  const { user } = useAuthStore()
  const { looks, loading, fetchRecentLooks, addLook, deleteLook } = useLookStore()

  const [showUpload, setShowUpload] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [notas, setNotas] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [viewLook, setViewLook] = useState(null)

  const fileRef = useRef(null)

  useEffect(() => {
    if (user?.id) fetchRecentLooks(user.id, 30)
  }, [user?.id, fetchRecentLooks])

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 1200, 0.85)
    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error('Selecciona una foto'); return }

    setSaving(true)
    const res = await addLook(user.id, file, fecha, notas)
    setSaving(false)

    if (res?.error) {
      toast.error('Error al guardar')
    } else {
      toast.success('¡Look del día guardado! 📸')
      resetForm()
    }
  }

  const handleDelete = async (id) => {
    const res = await deleteLook(id)
    if (res?.success) {
      toast.success('Look eliminado')
      setViewLook(null)
    } else {
      toast.error('Error al eliminar')
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setNotas('')
    setFecha(new Date().toISOString().split('T')[0])
    setShowUpload(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (loading && looks.length === 0) {
    return <LoadingSpinner text="Cargando looks..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Camera className="w-6 h-6 text-accent" />
            Look del Día
          </h1>
          <p className="text-sm text-text-muted mt-1">Registra tu outfit diario con una foto</p>
        </div>
        <Button onClick={() => setShowUpload(true)} icon={Plus} size="sm">
          Nuevo look
        </Button>
      </div>

      {/* Stats row */}
      {looks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6 stagger-children">
          <div className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className="text-xl font-bold text-accent">{looks.length}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Looks registrados</div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className="text-xl font-bold text-primary">
              {new Set(looks.map(l => {
                const d = new Date(l.fecha + 'T12:00:00')
                return `${d.getFullYear()}-${d.getMonth()}`
              })).size}
            </div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Meses activos</div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {looks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
          {looks.map((look) => (
            <button
              key={look.id}
              onClick={() => setViewLook(look)}
              className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="aspect-[3/4] overflow-hidden bg-bg-alt relative">
                <img
                  src={look.foto_url}
                  alt={`Look ${look.fecha}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/70" />
                    <span className="text-[10px] font-medium text-white/90">
                      {new Date(look.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
              {look.notas && (
                <div className="p-2.5">
                  <p className="text-[10px] text-text-muted line-clamp-2 flex items-start gap-1">
                    <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                    {look.notas}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="Sin looks registrados"
          description="Tómate una foto con tu outfit del día para llevar un historial visual de tu estilo."
          actionLabel="Registrar mi primer look"
          onAction={() => setShowUpload(true)}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUpload}
        onClose={resetForm}
        title="Registrar look del día"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full aspect-[3/4] object-cover rounded-2xl border border-border"
                />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl aspect-[3/4] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-3">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <span className="text-sm font-medium text-text">Tomar o subir foto</span>
                <span className="text-[10px] text-text-muted mt-1">Tu look completo del día</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ocasión, cómo te sentiste, inspiración..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} disabled={!file} className="flex-1">
              Guardar look
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Look Modal */}
      <Modal
        isOpen={!!viewLook}
        onClose={() => setViewLook(null)}
        title={viewLook ? formatDateFull(viewLook.fecha) : ''}
        size="md"
      >
        {viewLook && (
          <div className="space-y-4">
            <img
              src={viewLook.foto_url}
              alt={`Look ${viewLook.fecha}`}
              className="w-full aspect-[3/4] object-cover rounded-2xl"
            />
            {viewLook.notas && (
              <div className="flex items-start gap-2 p-3 bg-bg-alt rounded-xl">
                <MessageSquare className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">{viewLook.notas}</p>
              </div>
            )}
            <button
              onClick={() => handleDelete(viewLook.id)}
              className="flex items-center gap-2 text-sm text-error hover:text-error font-medium w-full text-left py-2 border-t border-border/50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar este look
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
