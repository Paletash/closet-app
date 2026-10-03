import PrivateImage from '../ui/PrivateImage'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIAS, COLORES } from '../../utils/categories'
import { useClothingStore } from '../../store/useClothingStore'

// Inline laundry basket SVG icon (no lucide equivalent)
function LaundryIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18l-1.5 14a2 2 0 0 1-2 1.83H6.5a2 2 0 0 1-2-1.83L3 6z" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  )
}

const ClothingCard = memo(function ClothingCard({ item }) {
  const colorObj = COLORES.find((c) => c.value === item.color_principal)
  const { toggleDirty } = useClothingStore()
  const [toggling, setToggling] = useState(false)
  const isDirty = item.sucia === true

  const handleToggleDirty = async (e) => {
    e.preventDefault()  // Prevent Link navigation
    e.stopPropagation()
    if (toggling) return
    setToggling(true)
    await toggleDirty(item.id, !isDirty)
    setToggling(false)
  }

  return (
    <Link
      to={`/closet/${item.id}`}
      className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all duration-200 relative"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-bg-alt relative">
        <PrivateImage
          src={item.foto_url}
          alt={item.subcategoria || item.categoria}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isDirty ? 'opacity-50 grayscale-[40%]' : ''}`}
          loading="lazy"
          decoding="async"
        />

        {/* Color dot */}
        {colorObj && (
          <div
            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: colorObj.hex }}
            title={colorObj.label}
          />
        )}

        {/* Dirty overlay badge */}
        {isDirty && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
            <LaundryIcon className="w-3 h-3" />
            Sucia
          </div>
        )}

        {/* Toggle dirty button */}
        <button
          onClick={handleToggleDirty}
          disabled={toggling}
          title={isDirty ? 'Marcar como limpia' : 'Marcar como sucia'}
          className={`
            absolute bottom-2 right-2 p-1.5 rounded-full shadow-md transition-all duration-200 cursor-pointer
            ${isDirty
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-white/80 text-text-muted hover:bg-white hover:text-amber-500 backdrop-blur-sm'
            }
            ${toggling ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <LaundryIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-text truncate">
          {item.subcategoria || CATEGORIAS[item.categoria]?.label}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-text-muted">
            {CATEGORIAS[item.categoria]?.icon} {CATEGORIAS[item.categoria]?.label}
          </p>
          {item.marca && (
            <p className="text-xs text-text-muted truncate max-w-[80px]">
              {item.marca}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
})

export default ClothingCard

