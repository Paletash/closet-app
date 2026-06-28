import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useClothingStore } from '../../store/useClothingStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { compressImage, createPreviewUrl, revokePreviewUrl } from '../../utils/helpers'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function VisualSearchModal({ isOpen, onClose }) {
  const { setFiltersFromVisualSearch } = useClothingStore()
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const compressed = await compressImage(file)
    setImageFile(compressed)

    if (preview) revokePreviewUrl(preview)
    setPreview(createPreviewUrl(compressed))
  }

  const handleRemoveImage = () => {
    if (preview) revokePreviewUrl(preview)
    setPreview(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSearch = async () => {
    if (!imageFile) return

    setAnalyzing(true)
    try {
      const base64 = await fileToBase64(imageFile)

      const { data, error } = await supabase.functions.invoke('analizar-inspiracion', {
        body: { imagen_base64: base64 },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (!data?.prendas_detectadas || data.prendas_detectadas.length === 0) {
        toast.error('No pudimos detectar prendas en la imagen')
        setAnalyzing(false)
        return
      }

      setFiltersFromVisualSearch(data)
      toast.success('Búsqueda aplicada. Mostrando prendas similares.')
      
      // Cleanup & Close
      handleRemoveImage()
      onClose()
    } catch (err) {
      console.error('Visual Search Error:', err)
      toast.error(err.message || 'Error al analizar la imagen')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Búsqueda por Foto" size="md">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Sube una foto de un outfit que te guste. La IA analizará las prendas y filtrará tu clóset para mostrarte ropa similar que ya tienes.
        </p>

        {!preview ? (
          <div className="flex flex-col md:flex-row gap-3">
            <label className="flex-1 flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-primary/30 bg-primary-ghost rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all md:hidden">
              <Camera className="w-10 h-10 text-primary" />
              <span className="text-sm text-primary font-semibold">Tomar foto</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>
            <label className="flex-1 flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary-ghost transition-all">
              <Upload className="w-8 h-8 text-text-muted" />
              <span className="text-sm text-text-secondary font-medium">Subir foto de inspiración</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="relative w-full aspect-square md:aspect-video rounded-2xl border border-border overflow-hidden bg-bg-alt">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSearch} 
            disabled={!preview || analyzing} 
            loading={analyzing} 
            className="flex-1 bg-gradient-to-r from-accent to-primary"
          >
            {analyzing ? (
              <>Analizando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Buscar prendas</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
