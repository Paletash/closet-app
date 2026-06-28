import { useState, useMemo } from 'react'
import { Store, Heart, Package, Copy, Check, RotateCcw } from 'lucide-react'
import { useClothingStore } from '../store/useClothingStore'
import { useMarketplaceStore } from '../store/useMarketplaceStore'
import Button from '../components/ui/Button'
import { toast } from '../components/ui/Toast'

export default function MarketplacePage() {
  const { clothes } = useClothingStore()
  const { generateListing, unmark } = useMarketplaceStore()
  const [activeTab, setActiveTab] = useState('sugerencias')
  const [copiedId, setCopiedId] = useState(null)

  const itemsEnVenta = useMemo(() => clothes.filter(c => c.estado === 'en_venta'), [clothes])
  const itemsDonados = useMemo(() => clothes.filter(c => c.estado === 'donada'), [clothes])
  const sugerencias = useMemo(() => clothes.filter(c => (c.estado || 'activa') === 'activa' && (c.veces_usado || 0) === 0), [clothes])

  const handleCopyListing = (prenda) => {
    const text = generateListing(prenda)
    navigator.clipboard.writeText(text)
    setCopiedId(prenda.id)
    toast.success('Anuncio copiado al portapapeles')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRestaurar = async (id) => {
    await unmark(id)
  }

  const renderTabs = () => (
    <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-6">
      {[
        { id: 'sugerencias', label: 'Sugerencias para Donar', icon: Heart, count: sugerencias.length },
        { id: 'en_venta', label: 'En Venta', icon: Store, count: itemsEnVenta.length },
        { id: 'donadas', label: 'Donadas / Archivadas', icon: Package, count: itemsDonados.length }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
            ${activeTab === tab.id 
              ? 'bg-primary text-white shadow-md shadow-primary/20' 
              : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-bg-alt'
            }
          `}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )

  const renderGrid = (items, emptyMessage, isActionable = false) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 px-4 bg-surface border border-border rounded-2xl">
          <Package className="w-12 h-12 text-border mx-auto mb-3" />
          <p className="text-text-secondary">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden group">
            <div className="aspect-square relative bg-bg-alt">
              <img src={item.foto_url} alt={item.subcategoria} className="w-full h-full object-cover" />
              {activeTab === 'en_venta' && (
                <div className="absolute top-2 right-2 bg-success text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                  ${item.precio_venta?.toFixed(2) || '0.00'}
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-text truncate">{item.marca || item.subcategoria}</p>
                <p className="text-xs text-text-muted">{item.categoria}</p>
              </div>
              
              {activeTab === 'sugerencias' && (
                <p className="text-xs text-error font-medium">Nunca se ha usado</p>
              )}
              
              {activeTab === 'en_venta' && (
                <Button 
                  size="sm" 
                  className="w-full text-xs" 
                  variant="secondary"
                  onClick={() => handleCopyListing(item)}
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedId === item.id ? 'Copiado' : 'Copiar Anuncio'}
                </Button>
              )}
              
              {activeTab !== 'sugerencias' && (
                <Button 
                  size="sm" 
                  className="w-full text-xs bg-bg-alt hover:bg-border text-text-secondary border-none" 
                  onClick={() => handleRestaurar(item.id)}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restaurar al clóset
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          Marketplace & Donaciones
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Libera espacio en tu clóset vendiendo o donando la ropa que ya no usas.
        </p>
      </div>

      {renderTabs()}

      {activeTab === 'sugerencias' && renderGrid(sugerencias, '¡Excelente! Usas todas tus prendas regularmente.')}
      {activeTab === 'en_venta' && renderGrid(itemsEnVenta, 'No tienes prendas en venta actualmente.', true)}
      {activeTab === 'donadas' && renderGrid(itemsDonados, 'Aún no has donado ni archivado prendas.', true)}
    </div>
  )
}
