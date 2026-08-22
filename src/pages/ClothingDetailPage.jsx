import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useClothingStore } from '../store/useClothingStore'
import { useMarketplaceStore } from '../store/useMarketplaceStore'
import { ArrowLeft, Trash2, Edit3, Store, Heart } from 'lucide-react'
import { CATEGORIAS, SUBCATEGORIAS, COLORES, ESTILOS, TEMPORADAS } from '../utils/categories'
import { formatDate } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import TagInput from '../components/ui/TagInput'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../components/ui/Toast'

export default function ClothingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clothes, deleteClothing, updateClothing, toggleDirty } = useClothingStore()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  const [showSell, setShowSell] = useState(false)
  const [sellForm, setSellForm] = useState({ precio: '', plataforma: '' })
  
  const { markForSale, markForDonation } = useMarketplaceStore()
  
  const item = clothes.find((c) => c.id === id)

  const [editForm, setEditForm] = useState({
    categoria: '',
    subcategoria: '',
    color_principal: '',
    estilos: [],
    temporadas: [],
    marca: '',
    precio: '',
    notas: '',
    etiquetas: [],
  })

  useEffect(() => {
    if (item) {
      setEditForm({
        categoria: item.categoria || '',
        subcategoria: item.subcategoria || '',
        color_principal: item.color_principal || '',
        estilos: item.estilos || [],
        temporadas: item.temporadas || [],
        marca: item.marca || '',
        precio: item.precio || '',
        notas: item.notas || '',
        etiquetas: item.etiquetas || [],
      })
    }
  }, [item, showEdit])

  const toggleArrayField = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  if (!item) {
    return <LoadingSpinner text="Cargando prenda..." />
  }

  const colorObj = COLORES.find((c) => c.value === item.color_principal)

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const result = await deleteClothing(item.id)
      if (result?.success) {
        toast.success('Prenda eliminada')
        navigate('/closet')
      } else {
        toast.error(result?.error?.message || 'Error al eliminar')
      }
    } catch (err) {
      console.error('[handleDelete] Caught error:', err)
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.categoria) {
      toast.error('Selecciona una categoría')
      return
    }

    try {
      setUpdating(true)
      const result = await updateClothing(item.id, {
        categoria: editForm.categoria,
        subcategoria: editForm.subcategoria || null,
        color_principal: editForm.color_principal || null,
        estilos: editForm.estilos.length > 0 ? editForm.estilos : null,
        temporadas: editForm.temporadas.length > 0 ? editForm.temporadas : null,
        marca: editForm.marca || null,
        precio: editForm.precio ? parseFloat(editForm.precio) : null,
        notas: editForm.notas || null,
        etiquetas: editForm.etiquetas.length > 0 ? editForm.etiquetas : null,
      })

      if (result?.error) {
        toast.error('Error al actualizar la prenda')
      } else {
        toast.success('Prenda actualizada con éxito')
        setShowEdit(false)
      }
    } catch (err) {
      console.error('[handleUpdate] Caught error:', err)
      toast.error('Error al actualizar la prenda')
    } finally {
      setUpdating(false)
    }
  }

  const subcategoriaOptions = editForm.categoria
    ? (SUBCATEGORIAS[editForm.categoria] || []).map((s) => ({ value: s.toLowerCase(), label: s }))
    : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/closet" className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-text flex-1">Detalle de prenda</h1>
        <div className="flex gap-1">
          <button onClick={() => setShowSell(true)} className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-muted hover:text-primary cursor-pointer" title="Vender prenda">
            <Store className="w-5 h-5" />
          </button>
          <button onClick={() => {
            if (window.confirm('¿Marcar esta prenda como donada/archivada? Ya no aparecerá en tu clóset activo.')) {
              markForDonation(item.id).then((ok) => { if (ok) navigate('/marketplace') })
            }
          }} className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-muted hover:text-primary cursor-pointer" title="Donar prenda">
            <Heart className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleDirty(item.id, !item.sucia).then(() => toast.success(item.sucia ? 'Marcada como limpia' : 'Marcada como sucia'))}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              item.sucia
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : 'hover:bg-bg-alt text-text-muted hover:text-amber-500'
            }`}
            title={item.sucia ? 'Marcar como limpia' : 'Marcar como sucia'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18l-1.5 14a2 2 0 0 1-2 1.83H6.5a2 2 0 0 1-2-1.83L3 6z" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <circle cx="12" cy="14" r="3" />
            </svg>
          </button>
          <button onClick={() => setShowEdit(true)} className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-muted hover:text-primary cursor-pointer" title="Editar prenda">
            <Edit3 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl hover:bg-error-light transition-colors text-text-muted hover:text-error cursor-pointer" title="Eliminar prenda">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="md:flex md:gap-6">
        <div className="md:w-1/2 mb-6 md:mb-0">
          <img src={item.foto_url} alt={item.subcategoria || item.categoria} className="w-full aspect-square object-cover rounded-2xl border border-border" />
        </div>
        <div className="md:w-1/2 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-text">{item.subcategoria || CATEGORIAS[item.categoria]?.label}</h2>
            <p className="text-text-secondary">{CATEGORIAS[item.categoria]?.icon} {CATEGORIAS[item.categoria]?.label}</p>
          </div>
          {colorObj && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: colorObj.hex }} />
              <span className="text-sm text-text-secondary">{colorObj.label}</span>
            </div>
          )}
          {item.estilos?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">Estilos</p>
              <div className="flex flex-wrap gap-1.5">
                {item.estilos.map((e) => { const s = ESTILOS.find((x) => x.value === e); return (<span key={e} className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-medium">{s?.icon} {s?.label || e}</span>) })}
              </div>
            </div>
          )}
          {item.temporadas?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">Temporadas</p>
              <div className="flex flex-wrap gap-1.5">
                {item.temporadas.map((t) => { const s = TEMPORADAS.find((x) => x.value === t); return (<span key={t} className="px-2.5 py-1 rounded-full bg-bg-alt text-text-secondary text-xs font-medium">{s?.icon} {s?.label || t}</span>) })}
              </div>
            </div>
          )}
          {item.etiquetas?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-1">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5">
                {item.etiquetas.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">#{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            {item.marca && (<div><p className="text-xs font-medium text-text-muted mb-0.5">Marca</p><p className="text-sm text-text">{item.marca}</p></div>)}
            {item.precio && (
              <div>
                <p className="text-xs font-medium text-text-muted mb-0.5">Precio</p>
                <p className="text-sm font-semibold text-text">${item.precio}</p>
              </div>
            )}
            {item.precio && (
              <div>
                <p className="text-xs font-medium text-text-muted mb-0.5">Costo por Uso</p>
                <p className={`text-sm font-bold ${
                  (item.precio / Math.max(1, item.veces_usado || 1)) < 50 ? 'text-success' :
                  (item.precio / Math.max(1, item.veces_usado || 1)) < 150 ? 'text-warning' : 'text-error'
                }`}>
                  ${(item.precio / Math.max(1, item.veces_usado || 1)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          {item.notas && (<div><p className="text-xs font-medium text-text-muted mb-0.5">Notas</p><p className="text-sm text-text-secondary">{item.notas}</p></div>)}
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-xs text-text-muted">Agregada el {formatDate(item.creado_en)}</p>
            <p className="text-xs text-text-muted bg-surface border border-border px-2 py-1 rounded-full">{item.veces_usado || 0} usos</p>
            <p className={`text-xs font-medium px-2 py-1 rounded-full ${
              item.sucia
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
            }`}>
              {item.sucia ? '🧺 Sucia' : '✨ Limpia'}
            </p>
          </div>
        </div>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar prenda" size="sm">
        <p className="text-sm text-text-secondary mb-6">¿Estás seguro de que quieres eliminar esta prenda? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Eliminar</Button>
        </div>
      </Modal>

      {/* Modal Vender */}
      <Modal isOpen={showSell} onClose={() => setShowSell(false)} title="Vender Prenda" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Ponle precio y elige dónde quieres venderla.</p>
          
          <Input
            label="Precio de Venta ($)"
            type="number"
            value={sellForm.precio}
            onChange={(e) => setSellForm({ ...sellForm, precio: e.target.value })}
            placeholder="Ej: 350"
          />
          
          <Select
            label="Plataforma"
            value={sellForm.plataforma}
            onChange={(e) => setSellForm({ ...sellForm, plataforma: e.target.value })}
            options={[
              { value: 'vinted', label: 'Vinted' },
              { value: 'mercadolibre', label: 'Mercado Libre' },
              { value: 'facebook', label: 'Facebook Marketplace' },
              { value: 'otro', label: 'Otro' }
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowSell(false)} className="flex-1">Cancelar</Button>
            <Button onClick={async () => {
              if (!sellForm.precio) return toast.error('Ingresa un precio')
              const ok = await markForSale(item.id, sellForm.precio, sellForm.plataforma)
              if (ok) {
                setShowSell(false)
                navigate('/marketplace')
              }
            }} className="flex-1">
              Poner en Venta
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar prenda" size="md">
        <form onSubmit={handleUpdate} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <Select
            label="Categoría *"
            value={editForm.categoria}
            onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value, subcategoria: '' })}
            options={Object.entries(CATEGORIAS).map(([value, { label, icon }]) => ({
              value,
              label,
              icon,
            }))}
            placeholder="Seleccionar categoría"
          />

          {editForm.categoria && subcategoriaOptions.length > 0 && (
            <Select
              label="Subcategoría"
              value={editForm.subcategoria}
              onChange={(e) => setEditForm({ ...editForm, subcategoria: e.target.value })}
              options={subcategoriaOptions}
              placeholder="Seleccionar tipo"
            />
          )}

          {/* Color */}
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Color principal</p>
            <div className="flex flex-wrap gap-2">
              {COLORES.map(({ value, label, hex }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, color_principal: editForm.color_principal === value ? '' : value })}
                  title={label}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer
                    hover:scale-110
                    ${editForm.color_principal === value
                      ? 'border-primary ring-2 ring-primary/30 scale-110'
                      : 'border-border'
                    }
                  `}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Estilo</p>
            <div className="flex flex-wrap gap-2">
              {ESTILOS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleArrayField('estilos', value)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 cursor-pointer
                    ${editForm.estilos.includes(value)
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
                    }
                  `}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Temporada</p>
            <div className="flex flex-wrap gap-2">
              {TEMPORADAS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleArrayField('temporadas', value)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 cursor-pointer
                    ${editForm.temporadas.includes(value)
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
                    }
                  `}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <Input
              label="Marca (opcional)"
              value={editForm.marca}
              onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
              placeholder="Nike, Zara, H&M..."
            />

            {/* Price */}
            <Input
              label="Precio (opcional)"
              type="number"
              step="0.01"
              min="0"
              value={editForm.precio}
              onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
              placeholder="Ej: 500"
              icon={<span className="text-text-muted">$</span>}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Notas (opcional)</label>
            <textarea
              value={editForm.notas}
              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
              placeholder="Detalles extra sobre esta prenda..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <TagInput 
            tags={editForm.etiquetas} 
            onChange={(etiquetas) => setEditForm({ ...editForm, etiquetas })} 
            existingUserTags={[...new Set(clothes.flatMap(c => c.etiquetas || []))]} 
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEdit(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={updating} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
