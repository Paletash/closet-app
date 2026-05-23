import { memo } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIAS, COLORES } from '../../utils/categories'

const ClothingCard = memo(function ClothingCard({ item }) {
  const colorObj = COLORES.find((c) => c.value === item.color_principal)

  return (
    <Link
      to={`/closet/${item.id}`}
      className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-bg-alt relative">
        <img
          src={item.foto_url}
          alt={item.subcategoria || item.categoria}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Color dot */}
        {colorObj && (
          <div
            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: colorObj.hex }}
            title={colorObj.label}
          />
        )}
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
