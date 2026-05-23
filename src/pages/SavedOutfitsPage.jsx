import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useOutfitStore } from '../store/useOutfitStore'
import { Heart, Trash2, Sparkles } from 'lucide-react'
import { CATEGORIAS, OCASIONES } from '../utils/categories'
import { formatDate } from '../utils/helpers'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from '../components/ui/Toast'

export default function SavedOutfitsPage() {
  const { user } = useAuthStore()
  const { outfits, loading, fetchOutfits, toggleFavorite, deleteOutfit } = useOutfitStore()

  useEffect(() => {
    if (user?.id) fetchOutfits(user.id)
  }, [user?.id, fetchOutfits])

  const handleDelete = async (id) => {
    const res = await deleteOutfit(id, user.id)
    if (res?.success) toast.success('Outfit eliminado')
    else toast.error('Error al eliminar')
  }

  if (loading && outfits.length === 0) {
    return <LoadingSpinner text="Cargando outfits..." />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-1">Outfits Guardados</h1>
      <p className="text-sm text-text-muted mb-6">{outfits.length} outfit{outfits.length !== 1 ? 's' : ''}</p>

      {outfits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {outfits.map((outfit) => {
            const ocasionObj = OCASIONES.find(o => o.value === outfit.ocasion)
            return (
              <div key={outfit.id} className="bg-surface rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {ocasionObj && (
                      <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-medium">
                        {ocasionObj.icon} {ocasionObj.label}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">{formatDate(outfit.creado_en)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleFavorite(outfit.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${outfit.es_favorito ? 'text-error' : 'text-text-muted hover:text-error'}`}>
                      <Heart className={`w-4 h-4 ${outfit.es_favorito ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => handleDelete(outfit.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(outfit.prendas || []).slice(0, 6).map((prenda) => (
                    <div key={prenda.id} className="aspect-square rounded-xl overflow-hidden bg-bg-alt border border-border">
                      <img src={prenda.foto_url} alt={prenda.subcategoria} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>

                {outfit.prendas?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {outfit.prendas.map(p => (
                      <span key={p.id} className="text-[10px] text-text-muted">
                        {CATEGORIAS[p.categoria]?.icon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No tienes outfits guardados"
          description="Genera un outfit y guárdalo para verlo aquí."
          actionLabel="Generar outfit"
          onAction={() => window.location.href = '/outfit/generate'}
        />
      )}
    </div>
  )
}
