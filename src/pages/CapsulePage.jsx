import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Box, SlidersHorizontal, Info, Shirt, Shuffle, Layers } from 'lucide-react'
import { useClothingStore } from '../store/useClothingStore'
import { generateCapsule } from '../lib/capsuleEngine'
import { TEMPORADAS, CATEGORIAS } from '../utils/categories'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'

export default function CapsulePage() {
  const { clothes } = useClothingStore()
  const [targetSize, setTargetSize] = useState(30)
  const [temporada, setTemporada] = useState('')
  const [result, setResult] = useState(null)

  const handleGenerate = () => {
    const res = generateCapsule(clothes, { targetSize, temporada })
    setResult(res)
  }

  // Group capsule by category for display
  const groupedCapsule = useMemo(() => {
    if (!result) return {}
    const groups = {}
    result.capsule.forEach(item => {
      if (!groups[item.categoria]) groups[item.categoria] = []
      groups[item.categoria].push(item)
    })
    return groups
  }, [result])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Box className="w-6 h-6 text-primary" />
            Capsule Wardrobe
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Genera un armario cápsula minimalista con tus prendas más versátiles.
          </p>
        </div>
      </div>

      {!result ? (
        <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Configura tu Cápsula</h2>
              <p className="text-sm text-text-secondary">Ajusta los parámetros para generar tu selección ideal.</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-medium text-text-secondary">Tamaño del Armario</label>
                <span className="text-lg font-bold text-primary">{targetSize} prendas</span>
              </div>
              <input 
                type="range" 
                min="15" 
                max="50" 
                step="1" 
                value={targetSize} 
                onChange={(e) => setTargetSize(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>15 (Minimalista)</span>
                <span>30 (Estándar)</span>
                <span>50 (Extenso)</span>
              </div>
            </div>

            <div>
              <Select
                label="Temporada Objetivo (Opcional)"
                value={temporada}
                onChange={(e) => setTemporada(e.target.value)}
                options={[
                  { value: '', label: 'Todas las temporadas' },
                  ...TEMPORADAS
                ]}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full bg-gradient-to-r from-accent to-primary" 
            size="lg"
            disabled={clothes.length < 5}
          >
            <Shuffle className="w-5 h-5 mr-2" />
            {clothes.length < 5 ? 'Necesitas al menos 5 prendas' : 'Generar Armario Cápsula'}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-sm text-text-secondary font-medium">Prendas Seleccionadas</p>
              <p className="text-3xl font-bold text-text mt-1">{result.capsule.length}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-sm text-text-secondary font-medium">Outfits Posibles (est.)</p>
              <p className="text-3xl font-bold text-primary mt-1">~{result.stats.combinations}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-sm text-text-secondary font-medium">Estilos Cubiertos</p>
              <p className="text-3xl font-bold text-text mt-1">{result.stats.stylesCovered.length}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-sm text-text-secondary font-medium">Valor de la Cápsula</p>
              <p className="text-3xl font-bold text-success mt-1">${result.stats.totalValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 text-sm text-text">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p>
              Hemos seleccionado tus prendas más versátiles (colores neutros, atemporales y tus favoritas) 
              para crear este armario cápsula. Con solo {result.capsule.length} prendas puedes vestir diferente 
              por meses.
            </p>
          </div>

          {/* Categorized Grid */}
          <div className="space-y-8">
            {Object.keys(CATEGORIAS).map(catKey => {
              const items = groupedCapsule[catKey]
              if (!items || items.length === 0) return null
              const meta = CATEGORIAS[catKey]

              return (
                <div key={catKey}>
                  <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2 border-b border-border pb-2">
                    {meta.icon} {meta.label} <span className="text-text-muted text-sm font-normal">({items.length})</span>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {items.map(item => (
                      <Link 
                        key={item.id} 
                        to={`/closet/${item.id}`}
                        className="group relative aspect-square bg-bg-alt rounded-xl border border-border overflow-hidden hover:border-primary transition-colors"
                      >
                        <img 
                          src={item.foto_url} 
                          alt={item.subcategoria} 
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Excluded items (Marketplace segue) */}
          {result.excluded.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text">Prendas no incluidas ({result.excluded.length})</h3>
                  <p className="text-sm text-text-muted">Estas prendas son menos versátiles o redundantes para esta cápsula.</p>
                </div>
                <Link to="/marketplace" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  Ver opciones de donación <Layers className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                {result.excluded.map(item => (
                  <div key={item.id} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                    <img src={item.foto_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 pb-12">
            <Button variant="secondary" onClick={() => setResult(null)}>
              Volver a configurar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
