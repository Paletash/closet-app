import PrivateImage from '../components/ui/PrivateImage'
import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useWishlistStore } from '../store/useWishlistStore'
import {
  Heart, Plus, Trash2, ExternalLink, ShoppingBag,
  Tag, ArrowUpDown, CheckCircle2, Circle
} from 'lucide-react'
import { CATEGORIAS } from '../utils/categories'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../lib/toast'

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'bg-error-light text-error', dot: 'bg-error' },
  { value: 'media', label: 'Media', color: 'bg-warning-light text-warning', dot: 'bg-warning' },
  { value: 'baja', label: 'Baja', color: 'bg-bg-alt text-text-muted', dot: 'bg-text-muted' },
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'purchased', label: 'Compradas' },
]

const emptyForm = {
  nombre: '',
  categoria: '',
  url: '',
  imagen_url: '',
  precio: '',
  notas: '',
  prioridad: 'media',
}

export default function WishlistPage() {
  const { user } = useAuthStore()
  const { items, loading, fetchItems, addItem, togglePurchased, deleteItem } = useWishlistStore()

  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date') // date | priority | price

  useEffect(() => {
    if (user?.id) fetchItems(user.id)
  }, [user?.id, fetchItems])

  const filteredItems = useMemo(() => {
    let list = [...items]

    if (filter === 'pending') list = list.filter((i) => !i.comprado)
    if (filter === 'purchased') list = list.filter((i) => i.comprado)

    if (sortBy === 'priority') {
      const order = { alta: 0, media: 1, baja: 2 }
      list.sort((a, b) => (order[a.prioridad] ?? 1) - (order[b.prioridad] ?? 1))
    } else if (sortBy === 'price') {
      list.sort((a, b) => (b.precio || 0) - (a.precio || 0))
    }

    return list
  }, [items, filter, sortBy])

  const stats = useMemo(() => {
    const total = items.length
    const pending = items.filter((i) => !i.comprado).length
    const purchased = items.filter((i) => i.comprado).length
    const totalPrice = items
      .filter((i) => !i.comprado && i.precio)
      .reduce((sum, i) => sum + (i.precio || 0), 0)
    return { total, pending, purchased, totalPrice }
  }, [items])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Escribe un nombre'); return }
    if (!form.categoria) { toast.error('Selecciona una categoría'); return }

    setSaving(true)
    const res = await addItem(user.id, form)
    setSaving(false)

    if (res?.error) {
      toast.error('Error al agregar')
    } else {
      toast.success('¡Artículo añadido a la wishlist!')
      setForm({ ...emptyForm })
      setShowCreate(false)
    }
  }

  const handleToggle = async (id) => {
    const res = await togglePurchased(id)
    if (res?.success) {
      const item = items.find((i) => i.id === id)
      toast.success(item?.comprado ? 'Marcado como pendiente' : '¡Comprado! 🎉')
    }
  }

  const handleDelete = async (id) => {
    const res = await deleteItem(id)
    if (res?.success) toast.success('Eliminado de la wishlist')
    else toast.error('Error al eliminar')
  }

  const cycleSortBy = () => {
    const options = ['date', 'priority', 'price']
    const idx = options.indexOf(sortBy)
    setSortBy(options[(idx + 1) % options.length])
  }

  const sortLabel = { date: 'Recientes', priority: 'Prioridad', price: 'Precio' }

  if (loading && items.length === 0) {
    return <LoadingSpinner text="Cargando wishlist..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Heart className="w-6 h-6 text-error" />
            Wishlist
          </h1>
          <p className="text-sm text-text-muted mt-1">Prendas que quieres comprar</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={Plus} size="sm">
          Agregar
        </Button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
          <div className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className="text-xl font-bold text-primary">{stats.pending}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Pendientes</div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className="text-xl font-bold text-success">{stats.purchased}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Compradas</div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className="text-xl font-bold text-accent">
              {stats.totalPrice > 0 ? `$${stats.totalPrice.toLocaleString()}` : '—'}
            </div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Total pend.</div>
          </div>
        </div>
      )}

      {/* Filter & Sort Bar */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filter === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:text-text border border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={cycleSortBy}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortLabel[sortBy]}
          </button>
        </div>
      )}

      {/* Items */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3 stagger-children">
          {filteredItems.map((item) => {
            const catInfo = CATEGORIAS[item.categoria]
            const prioInfo = PRIORIDADES.find((p) => p.value === item.prioridad)

            return (
              <div
                key={item.id}
                className={`bg-surface rounded-2xl border border-border overflow-hidden transition-all hover:shadow-sm ${
                  item.comprado ? 'opacity-60' : ''
                }`}
              >
                <div className="flex gap-3 p-4">
                  {/* Image or placeholder */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-bg-alt border border-border shrink-0 flex items-center justify-center">
                    {item.imagen_url ? (
                      <PrivateImage src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-text-muted" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${item.comprado ? 'line-through text-text-muted' : 'text-text'}`}>
                          {item.nombre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {catInfo && (
                            <span className="text-[10px] font-medium text-text-muted">
                              {catInfo.icon} {catInfo.label}
                            </span>
                          )}
                          {prioInfo && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${prioInfo.color}`}>
                              {prioInfo.label}
                            </span>
                          )}
                          {item.precio && (
                            <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                              <Tag className="w-3 h-3" />
                              ${item.precio.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {item.notas && (
                          <p className="text-[10px] text-text-muted mt-1 line-clamp-1">{item.notas}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
                            title="Abrir enlace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleToggle(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.comprado
                              ? 'text-success hover:text-text-muted'
                              : 'text-text-muted hover:text-success hover:bg-success-light'
                          }`}
                          title={item.comprado ? 'Marcar como pendiente' : 'Marcar como comprado'}
                        >
                          {item.comprado ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : items.length > 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-8 text-center">
          <p className="text-sm text-text-muted">No hay artículos con este filtro.</p>
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Tu wishlist está vacía"
          description="Agrega las prendas que te gustaría comprar para llevar un seguimiento de tus deseos."
          actionLabel="Agregar primer artículo"
          onAction={() => setShowCreate(true)}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Agregar a Wishlist"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre de la prenda *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej. Nike Air Max 90"
          />

          {/* Category select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Categoría *</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Selecciona categoría</option>
              {Object.entries(CATEGORIAS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <Input
            label="URL del producto"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://tienda.com/prenda..."
            type="url"
          />

          <Input
            label="URL de imagen"
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            placeholder="https://imagen.com/foto.jpg"
            type="url"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio estimado"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              placeholder="$0.00"
              type="number"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Prioridad</label>
              <div className="flex gap-2">
                {PRIORIDADES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, prioridad: p.value })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      form.prioridad === p.value
                        ? `${p.color} border-current`
                        : 'bg-bg-alt text-text-muted border-border hover:border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Color, talla, tienda..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Agregar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
