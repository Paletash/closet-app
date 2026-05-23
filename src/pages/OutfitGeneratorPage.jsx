import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useClothingStore } from '../store/useClothingStore'
import { useOutfitStore } from '../store/useOutfitStore'
import { useWeather } from '../hooks/useWeather'
import { generateOutfits } from '../lib/outfitEngine'
import { supabase } from '../lib/supabase'
import { Sparkles, RefreshCw, Save, ChevronLeft, ChevronRight, Zap, Cpu, MessageSquare, Lightbulb } from 'lucide-react'
import { OCASIONES, TEMPORADAS, CATEGORIAS, COLORES } from '../utils/categories'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import WeatherCard from '../components/weather/WeatherCard'
import { toast } from '../components/ui/Toast'

export default function OutfitGeneratorPage() {
  const { user, profile } = useAuthStore()
  const { clothes, fetchClothes } = useClothingStore()
  const { saveOutfit } = useOutfitStore()
  const { weather, loading: weatherLoading, error: weatherError, locationDenied, refetch: refetchWeather } = useWeather()

  const [ocasion, setOcasion] = useState('')
  const [temporada, setTemporada] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [results, setResults] = useState(null)
  const [aiResponse, setAiResponse] = useState(null) // { razon, tip_estilo }
  const [currentIdx, setCurrentIdx] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id && clothes.length === 0) fetchClothes(user.id)
  }, [user?.id, clothes.length, fetchClothes])

  const generateWithAI = async () => {
    try {
      // Prepare simplified clothing data for the AI
      const prendasParaIA = clothes.map(p => ({
        id: p.id,
        categoria: p.categoria,
        subcategoria: p.subcategoria,
        color_principal: p.color_principal,
        estilos: p.estilos,
        temporadas: p.temporadas,
      }))

      const { data, error } = await supabase.functions.invoke('generar-outfit', {
        body: {
          prendas: prendasParaIA,
          ocasion: ocasion || 'casual',
          clima: weather ? { temperatura: weather.temperatura, descripcion: weather.descripcion } : null,
          estilo_usuario: profile?.estilo || null,
        },
      })

      if (error) throw error
      if (data?.fallback) throw new Error('Fallback requested')
      if (data?.error) throw new Error(data.error)

      // Map AI-selected IDs to actual clothes
      const selectedIds = data.prendas_seleccionadas || []
      const selectedItems = selectedIds
        .map(id => clothes.find(c => c.id === id))
        .filter(Boolean)

      if (selectedItems.length < 2) {
        throw new Error('La IA no seleccionó suficientes prendas válidas')
      }

      setResults({
        outfits: [{ items: selectedItems, score: 0.95, prendaIds: selectedItems.map(i => i.id) }],
        error: null,
      })
      setAiResponse({ razon: data.razon, tip_estilo: data.tip_estilo })
      setCurrentIdx(0)
      return true
    } catch (err) {
      console.warn('AI generation failed, falling back to rules:', err.message)
      return false
    }
  }

  const generateWithRules = () => {
    const res = generateOutfits(clothes, { ocasion, temporada }, 3)
    setResults(res)
    setAiResponse(null)
    setCurrentIdx(0)
    if (res.error) toast.warning(res.error)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setAiResponse(null)

    if (useAI) {
      const aiSuccess = await generateWithAI()
      if (!aiSuccess) {
        toast.info('IA no disponible, usando reglas inteligentes')
        generateWithRules()
      }
    } else {
      // Small delay for UI feedback
      await new Promise(r => setTimeout(r, 600))
      generateWithRules()
    }

    setGenerating(false)
  }

  const handleSave = async () => {
    const outfit = results?.outfits[currentIdx]
    if (!outfit) return
    setSaving(true)
    const res = await saveOutfit(user.id, outfit.prendaIds, ocasion || 'casual', !!aiResponse)
    if (res?.error) toast.error('Error al guardar')
    else toast.success('¡Outfit guardado!')
    setSaving(false)
  }

  const currentOutfit = results?.outfits?.[currentIdx]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-1">Generar Outfit</h1>
      <p className="text-sm text-text-muted mb-6">Crea combinaciones inteligentes con tu ropa</p>

      {/* Weather Widget */}
      <div className="mb-4">
        <WeatherCard
          weather={weather}
          loading={weatherLoading}
          error={weatherError}
          locationDenied={locationDenied}
          onRefresh={refetchWeather}
        />
      </div>

      {/* Parameters */}
      <div className="bg-surface rounded-2xl border border-border p-5 mb-6 space-y-4">
        {/* AI Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-text">Motor de sugerencias</span>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`
              relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer
              ${useAI ? 'bg-primary' : 'bg-border'}
            `}
          >
            <span className={`
              inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300
              ${useAI ? 'translate-x-8' : 'translate-x-1'}
            `} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-1 -mt-2">
          {useAI ? (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Zap className="w-3 h-3" /> IA activada (Llama 3.3 70B)
            </span>
          ) : (
            <span className="text-xs text-text-muted font-medium">Reglas inteligentes (local)</span>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Ocasión</p>
          <div className="flex flex-wrap gap-2">
            {OCASIONES.map(({ value, label, icon }) => (
              <button key={value} onClick={() => setOcasion(ocasion === value ? '' : value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${ocasion === value ? 'bg-primary text-white' : 'bg-bg-alt text-text-secondary hover:text-text border border-border'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {!useAI && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Temporada</p>
            <div className="flex flex-wrap gap-2">
              {TEMPORADAS.filter(t => t.value !== 'todas').map(({ value, label, icon }) => (
                <button key={value} onClick={() => setTemporada(temporada === value ? '' : value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${temporada === value ? 'bg-primary text-white' : 'bg-bg-alt text-text-secondary hover:text-text border border-border'}`}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleGenerate} loading={generating} icon={useAI ? Zap : Sparkles} className="w-full" size="lg">
          {useAI ? 'Generar con IA' : 'Generar outfit'}
        </Button>
      </div>

      {/* Results */}
      {generating && (
        <LoadingSpinner text={useAI ? 'La IA está analizando tu closet...' : 'Creando combinaciones...'} />
      )}

      {results && !generating && (
        <>
          {results.outfits.length > 0 ? (
            <div className="animate-bounce-in">
              {/* Navigation */}
              {results.outfits.length > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="p-2 rounded-xl hover:bg-bg-alt disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-text-secondary font-medium">
                    Opción {currentIdx + 1} de {results.outfits.length}
                  </span>
                  <button onClick={() => setCurrentIdx(Math.min(results.outfits.length - 1, currentIdx + 1))} disabled={currentIdx === results.outfits.length - 1} className="p-2 rounded-xl hover:bg-bg-alt disabled:opacity-30 cursor-pointer transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Outfit display */}
              {currentOutfit && (
                <div className="bg-surface rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text">Tu outfit</h3>
                    {aiResponse ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Generado por IA
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success-light text-success">
                        {Math.round(currentOutfit.score * 100)}% compatible
                      </span>
                    )}
                  </div>

                  {/* Clothes grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {currentOutfit.items.map((item) => {
                      const colorObj = COLORES.find(c => c.value === item.color_principal)
                      return (
                        <div key={item.id} className="text-center">
                          <div className="aspect-square rounded-xl overflow-hidden bg-bg-alt border border-border mb-2">
                            <img src={item.foto_url} alt={item.subcategoria} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs font-medium text-text truncate">{item.subcategoria || CATEGORIAS[item.categoria]?.label}</p>
                          <p className="text-[10px] text-text-muted">{CATEGORIAS[item.categoria]?.label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* AI Explanation */}
                  {aiResponse && (
                    <div className="space-y-3 mb-5">
                      {aiResponse.razon && (
                        <div className="flex gap-2.5 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-text-secondary">{aiResponse.razon}</p>
                        </div>
                      )}
                      {aiResponse.tip_estilo && (
                        <div className="flex gap-2.5 p-3 bg-accent-light rounded-xl border border-accent/10">
                          <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <p className="text-sm text-text-secondary">{aiResponse.tip_estilo}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleGenerate} icon={RefreshCw} className="flex-1">Regenerar</Button>
                    <Button onClick={handleSave} loading={saving} icon={Save} className="flex-1">Guardar</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No se pudo generar un outfit"
              description={results.error || 'Necesitas más prendas para crear combinaciones.'}
              actionLabel="Agregar prendas"
              onAction={() => window.location.href = '/closet/add'}
            />
          )}
        </>
      )}
    </div>
  )
}
