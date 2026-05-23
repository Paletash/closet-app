import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useClothingStore } from '../store/useClothingStore'
import { useOutfitStore } from '../store/useOutfitStore'
import { BarChart3, ShirtIcon, Heart, Sparkles, TrendingUp, Palette, Tag, ArrowRight, Recycle, AlertTriangle } from 'lucide-react'
import { CATEGORIAS, COLORES, ESTILOS } from '../utils/categories'

export default function StatsPage() {
  const { user } = useAuthStore()
  const { clothes, fetchClothes } = useClothingStore()
  const { outfits, fetchOutfits } = useOutfitStore()

  useEffect(() => {
    if (user?.id) {
      fetchClothes(user.id)
      fetchOutfits(user.id)
    }
  }, [user?.id, fetchClothes, fetchOutfits])

  const stats = useMemo(() => {
    // Category distribution
    const categoryCounts = {}
    for (const item of clothes) {
      categoryCounts[item.categoria] = (categoryCounts[item.categoria] || 0) + 1
    }

    // Color distribution
    const colorCounts = {}
    for (const item of clothes) {
      if (item.color_principal) {
        colorCounts[item.color_principal] = (colorCounts[item.color_principal] || 0) + 1
      }
    }

    // Style distribution
    const styleCounts = {}
    for (const item of clothes) {
      if (item.estilos?.length) {
        for (const s of item.estilos) {
          styleCounts[s] = (styleCounts[s] || 0) + 1
        }
      }
    }

    // Season distribution
    const seasonCounts = {}
    for (const item of clothes) {
      if (item.temporadas?.length) {
        for (const t of item.temporadas) {
          seasonCounts[t] = (seasonCounts[t] || 0) + 1
        }
      }
    }

    // Outfit stats
    const favoriteOutfits = outfits.filter(o => o.es_favorito).length
    const aiOutfits = outfits.filter(o => o.generado_por_ia).length

    return {
      totalClothes: clothes.length,
      categoryCounts,
      colorCounts,
      styleCounts,
      seasonCounts,
      totalOutfits: outfits.length,
      favoriteOutfits,
      aiOutfits,
      // Sustainability
      neverUsed: clothes.filter(c => (c.veces_usado || 0) === 0),
      leastUsed: [...clothes].filter(c => (c.veces_usado || 0) > 0).sort((a, b) => (a.veces_usado || 0) - (b.veces_usado || 0)).slice(0, 5),
      utilizationPct: clothes.length > 0
        ? Math.round((clothes.filter(c => (c.veces_usado || 0) > 0).length / clothes.length) * 100)
        : 0,
    }
  }, [clothes, outfits])

  const maxCategoryCount = Math.max(...Object.values(stats.categoryCounts), 1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Estadísticas
          </h1>
          <p className="text-sm text-text-muted mt-1">Resumen de tu guardarropa</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger-children">
        {[
          { icon: ShirtIcon, label: 'Prendas', value: stats.totalClothes, color: 'bg-primary/8 text-primary' },
          { icon: Sparkles, label: 'Outfits', value: stats.totalOutfits, color: 'bg-accent-light text-accent' },
          { icon: Heart, label: 'Favoritos', value: stats.favoriteOutfits, color: 'bg-error-light text-error' },
          { icon: TrendingUp, label: 'Con IA', value: stats.aiOutfits, color: 'bg-success-light text-success' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface rounded-2xl border border-border p-4 text-center hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-text">{value}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Category Distribution */}
      <div className="bg-surface rounded-2xl border border-border p-5 mb-6">
        <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
          <ShirtIcon className="w-4 h-4 text-primary" />
          Prendas por categoría
        </h3>
        {Object.keys(stats.categoryCounts).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats.categoryCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const catInfo = CATEGORIAS[cat]
                const pct = Math.round((count / stats.totalClothes) * 100)
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-text-secondary font-medium truncate flex items-center gap-1.5">
                      {catInfo?.label || cat}
                    </div>
                    <div className="flex-1 h-6 bg-bg-alt rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((count / maxCategoryCount) * 100, 12)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted w-10 text-right">{pct}%</span>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Sin datos aún</p>
        )}
      </div>

      {/* Color & Style Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Color Distribution */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Colores dominantes
          </h3>
          {Object.keys(stats.colorCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.colorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([color, count]) => {
                  const colorInfo = COLORES.find(c => c.value === color)
                  return (
                    <div key={color} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-alt rounded-full">
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: colorInfo?.hex || '#888' }}
                      />
                      <span className="text-xs font-medium text-text-secondary">
                        {colorInfo?.label || color}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted">{count}</span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Sin datos aún</p>
          )}
        </div>

        {/* Style Distribution */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Estilos en tu closet
          </h3>
          {Object.keys(stats.styleCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.styleCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([style, count]) => {
                  const styleInfo = ESTILOS.find(s => s.value === style)
                  const pct = Math.round((count / stats.totalClothes) * 100)
                  return (
                    <div key={style} className="px-3 py-1.5 bg-primary/8 rounded-full">
                      <span className="text-xs font-medium text-primary">
                        {styleInfo?.label || style} · {pct}%
                      </span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Sin datos aún</p>
          )}
        </div>
      </div>

      {/* Sustainability Section */}
      {clothes.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
            <Recycle className="w-4 h-4 text-success" />
            Índice de sostenibilidad
          </h3>

          {/* Utilization gauge */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="35" fill="none"
                  stroke={stats.utilizationPct >= 70 ? 'var(--color-success)' : stats.utilizationPct >= 40 ? 'var(--color-warning)' : 'var(--color-error)'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(stats.utilizationPct / 100) * 220} 220`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-text">{stats.utilizationPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text">Aprovechamiento del closet</p>
              <p className="text-xs text-text-muted mt-0.5">
                {stats.utilizationPct >= 70
                  ? '¡Excelente! Aprovechas bien tu guardarropa.'
                  : stats.utilizationPct >= 40
                    ? 'Tienes ropa sin usar. ¡Explora combinaciones nuevas!'
                    : 'Muchas prendas sin estrenar. Es hora de darles uso.'}
              </p>
            </div>
          </div>

          {/* Never used clothes */}
          {stats.neverUsed.length > 0 && (
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-text">
                  {stats.neverUsed.length} prenda{stats.neverUsed.length !== 1 ? 's' : ''} sin usar
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {stats.neverUsed.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    to={`/closet/${item.id}`}
                    className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-bg-alt border border-border hover:border-primary/40 transition-colors"
                  >
                    <img src={item.foto_url} alt={item.subcategoria} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                ))}
                {stats.neverUsed.length > 8 && (
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-bg-alt border border-border flex items-center justify-center">
                    <span className="text-[10px] font-bold text-text-muted">+{stats.neverUsed.length - 8}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outfits Guardados Quick Link */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text flex items-center gap-2">
              <Heart className="w-4 h-4 text-error" />
              Outfits guardados
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Tienes {stats.totalOutfits} outfit{stats.totalOutfits !== 1 ? 's' : ''} guardado{stats.totalOutfits !== 1 ? 's' : ''}, {stats.favoriteOutfits} favorito{stats.favoriteOutfits !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/outfits" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
