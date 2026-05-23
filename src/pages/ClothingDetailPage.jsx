import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useClothingStore } from '../store/useClothingStore'
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react'
import { CATEGORIAS, COLORES, ESTILOS, TEMPORADAS } from '../utils/categories'
import { formatDate } from '../utils/helpers'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../components/ui/Toast'

export default function ClothingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clothes, deleteClothing } = useClothingStore()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const item = clothes.find((c) => c.id === id)

  if (!item) {
    return <LoadingSpinner text="Cargando prenda..." />
  }

  const colorObj = COLORES.find((c) => c.value === item.color_principal)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteClothing(item.id)
    if (result?.success) {
      toast.success('Prenda eliminada')
      navigate('/closet')
    } else {
      toast.error('Error al eliminar')
    }
    setDeleting(false)
    setShowDelete(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/closet" className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-text flex-1">Detalle de prenda</h1>
        <button onClick={() => setShowDelete(true)} className="p-2 rounded-xl hover:bg-error-light transition-colors text-text-muted hover:text-error cursor-pointer">
          <Trash2 className="w-5 h-5" />
        </button>
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
          {item.marca && (<div><p className="text-xs font-medium text-text-muted mb-0.5">Marca</p><p className="text-sm text-text">{item.marca}</p></div>)}
          {item.notas && (<div><p className="text-xs font-medium text-text-muted mb-0.5">Notas</p><p className="text-sm text-text-secondary">{item.notas}</p></div>)}
          <p className="text-xs text-text-muted">Agregada el {formatDate(item.creado_en)}</p>
        </div>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar prenda" size="sm">
        <p className="text-sm text-text-secondary mb-6">¿Estás seguro de que quieres eliminar esta prenda? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
