import { X } from 'lucide-react'
import { CATEGORIAS, COLORES, ESTILOS, TEMPORADAS } from '../../utils/categories'
import { useClothingStore } from '../../store/useClothingStore'

export default function ClothingFilters() {
  const { filters, setFilters, clearFilters, clothes } = useClothingStore()
  const hasFilters = filters.categoria || filters.color || filters.estilo || filters.temporada || filters.tag || (filters.iaMatches && filters.iaMatches.length > 0)

  const existingTags = [...new Set(clothes.flatMap(c => c.etiquetas || []))]

  const FilterChip = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
        transition-all duration-200 cursor-pointer
        ${active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-surface border border-border text-text-secondary hover:border-primary/30 hover:text-text'
        }
      `}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3 mb-6">
      {/* Search */}
      <input
        type="text"
        placeholder="Buscar prenda..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />

      {/* AI Filters */}
      {filters.iaMatches && filters.iaMatches.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Búsqueda Visual</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="✨ Resultados IA"
              active={true}
              onClick={() => setFilters({ iaMatches: null })}
            />
          </div>
        </div>
      )}

      {/* Category filters */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Categoría</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIAS).map(([key, { label, icon }]) => (
            <FilterChip
              key={key}
              label={`${icon} ${label}`}
              active={filters.categoria === key}
              onClick={() => setFilters({ categoria: filters.categoria === key ? null : key })}
            />
          ))}
        </div>
      </div>

      {/* Color filters */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORES.map(({ value, label, hex }) => (
            <button
              key={value}
              onClick={() => setFilters({ color: filters.color === value ? null : value })}
              title={label}
              className={`
                w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer
                hover:scale-110
                ${filters.color === value
                  ? 'border-primary ring-2 ring-primary/30 scale-110'
                  : 'border-border hover:border-text-muted'
                }
              `}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>

      {/* Style filters */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Estilo</p>
        <div className="flex flex-wrap gap-2">
          {ESTILOS.map(({ value, label, icon }) => (
            <FilterChip
              key={value}
              label={`${icon} ${label}`}
              active={filters.estilo === value}
              onClick={() => setFilters({ estilo: filters.estilo === value ? null : value })}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      {existingTags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {existingTags.map(tag => (
              <FilterChip
                key={tag}
                label={`#${tag}`}
                active={filters.tag === tag}
                onClick={() => setFilters({ tag: filters.tag === tag ? null : tag })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer pt-1"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
