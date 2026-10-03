import PrivateImage from '../ui/PrivateImage'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useClothingStore } from '../../store/useClothingStore'
import { Camera, Upload, X, Sparkles, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import TagInput from '../ui/TagInput'
import { toast } from '../../lib/toast'
import { compressImage, createPreviewUrl, revokePreviewUrl } from '../../utils/helpers'
import { CATEGORIAS, SUBCATEGORIAS, COLORES, ESTILOS, TEMPORADAS } from '../../utils/categories'

/**
 * Convert a File to base64 string (without the data URI prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove "data:image/jpeg;base64," prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AddClothingForm() {
  const { user } = useAuthStore()
  const { addClothing, loading } = useClothingStore()
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [classified, setClassified] = useState(false)
  const [queue, setQueue] = useState([])
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState({
    categoria: '',
    subcategoria: '',
    color_principal: '',
    estilos: [],
    temporadas: [],
    marca: '',
    precio: '',
    notas: '',
    etiquetas: [],
  })

  // Extract unique tags from current clothes
  const existingTags = [...new Set(useClothingStore.getState().clothes.flatMap(c => c.etiquetas || []))]
  useEffect(() => () => { if (preview) revokePreviewUrl(preview) }, [preview])

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    const file = files[0]
    if (!file) return
    if (files.length > 20) return toast.error('Puedes seleccionar hasta 20 fotos por lote.')
    if (files.some(photo => !photo.type.startsWith('image/') || photo.size > 10 * 1024 * 1024)) return toast.error('Cada foto debe ser una imagen de hasta 10 MB.')
    setProcessing(true)
    try {
      const compressed = await compressImage(file)
      setImageFile(compressed)
      setClassified(false)
      setQueue(files.slice(1))
      setPreview(createPreviewUrl(compressed))
    } catch (error) { toast.error(error.message) }
    finally { setProcessing(false) }
  }

  const removeImage = () => {
    if (preview) revokePreviewUrl(preview)
    setPreview(null)
    setImageFile(null)
    setClassified(false)
    setQueue([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /**
   * AI Vision Classification — sends the image to the Edge Function
   */
  const handleClassify = async () => {
    if (!imageFile || classifying || loading || processing) return

    setClassifying(true)
    try {
      // Convert to base64
      const base64 = await fileToBase64(imageFile)

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('clasificar-prenda', {
        body: { imagen_base64: base64, mime_type: imageFile.type },
        timeout: 45000,
      })

      if (error) throw error

      if (data?.error) {
        toast.error(data.error)
        setClassifying(false)
        return
      }

      // Auto-fill form with AI results
      const updates = {}

      if (data.categoria) {
        updates.categoria = data.categoria
        // Also set subcategoria if valid for this category
        if (data.subcategoria) {
          const validSubs = (SUBCATEGORIAS[data.categoria] || []).map(s => s.toLowerCase())
          if (validSubs.includes(data.subcategoria.toLowerCase())) {
            updates.subcategoria = data.subcategoria.toLowerCase()
          }
        }
      }

      if (data.color_principal) {
        const validColor = COLORES.find(c => c.value === data.color_principal)
        if (validColor) updates.color_principal = data.color_principal
      }

      if (data.estilos?.length > 0) {
        updates.estilos = data.estilos
      }

      setForm((prev) => ({ ...prev, ...updates }))
      setClassified(true)

      const confidence = data.confianza ? `(${Math.round(data.confianza * 100)}% confianza)` : ''
      toast.success(`¡Prenda clasificada automáticamente! ${confidence}`)

    } catch (err) {
      console.error('Classification error:', err)
      let msg = 'Error al clasificar. Completa los campos manualmente.'
      
      // Attempt to read Supabase error safely
      if (err instanceof Error) {
        if (err.message && err.message !== 'Edge Function returned a non-2xx status code') {
          msg = `IA: ${err.message}`
        }
      }
      
      toast.error(msg)
    } finally {
      setClassifying(false)
    }
  }

  const toggleArrayField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading || classifying || processing) return

    if (!imageFile) {
      toast.error('Sube una foto de tu prenda')
      return
    }
    if (!form.categoria) {
      toast.error('Selecciona una categoría')
      return
    }


    try {
      toast.info('Subiendo prenda...', 2000)

      const result = await addClothing(
        {
          user_id: user.id,
          categoria: form.categoria,
          subcategoria: form.subcategoria || null,
          color_principal: form.color_principal || null,
          estilos: form.estilos.length > 0 ? form.estilos : null,
          temporadas: form.temporadas.length > 0 ? form.temporadas : null,
          marca: form.marca || null,
          precio: form.precio ? parseFloat(form.precio) : null,
          notas: form.notas || null,
          etiquetas: form.etiquetas.length > 0 ? form.etiquetas : null,
        },
        imageFile
      )


      if (result?.error) {
        console.error('addClothing returned error:', result.error)
        toast.error(`Error al subir la prenda: ${result.error?.message || 'Error desconocido'}`)
      } else {
        toast.success('¡Prenda agregada!')
        if (queue.length) {
          setProcessing(true)
          const [next, ...rest] = queue
          // Clear the saved photo before preparing the next one so retry cannot duplicate it.
          setImageFile(null)
          setPreview(null)
          setQueue(rest)
          setForm({ categoria: '', subcategoria: '', color_principal: '', estilos: [], temporadas: [], marca: '', precio: '', notas: '', etiquetas: [] })
          setClassified(false)
          try {
            const compressed = await compressImage(next)
            setImageFile(compressed)
            setPreview(createPreviewUrl(compressed))
          } catch (error) { toast.error(error.message); setQueue([]) }
          finally { setProcessing(false) }
        } else navigate('/closet')
      }
    } catch (err) {
      console.error('handleSubmit exception:', err)
      toast.error(`Error inesperado: ${err.message}`)
    }
  }

  const subcategoriaOptions = form.categoria
    ? (SUBCATEGORIAS[form.categoria] || []).map((s) => ({ value: s.toLowerCase(), label: s }))
    : []

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <p className="text-sm text-text-secondary">Una foto por prenda. Puedes elegir hasta 20 y revisar cada una antes de guardarla.</p>
      {queue.length > 0 && <p role="status" className="text-sm text-primary">Después de esta quedan {queue.length} fotos por revisar.</p>}
      {processing && <p role="status" className="text-sm text-primary">Preparando la foto…</p>}
      {/* Image upload */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Foto de la prenda *</p>
        {preview ? (
          <div className="relative w-full max-w-xs">
            <PrivateImage
              src={preview}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-2xl border border-border"
            />
            <button
              type="button"
              onClick={removeImage}
              disabled={classifying || loading || processing} aria-label="Quitar foto y cancelar lote"
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* AI Classify Button */}
            {!classified && (
              <button
                type="button"
                onClick={handleClassify}
                disabled={classifying || loading || processing}
                className={`
                  mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-sm font-semibold transition-all cursor-pointer
                  ${classifying
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-gradient-to-r from-accent to-primary text-white hover:shadow-md hover:shadow-primary/20 active:scale-[0.98]'
                  }
                `}
              >
                {classifying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Clasificar con IA
                  </>
                )}
              </button>
            )}
            {classified && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-success-light rounded-xl animate-slide-up">
                <Sparkles className="w-4 h-4 text-success" />
                <span className="text-xs font-semibold text-success">Clasificado automáticamente — revisa y ajusta si es necesario</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            {/* Camera button - primary on mobile, hidden on desktop */}
            <label className="flex-1 flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-primary/30 bg-primary-ghost rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all md:hidden">
              <Camera className="w-10 h-10 text-primary" />
              <span className="text-sm text-primary font-semibold">Tomar foto</span>
              <span className="text-xs text-text-muted">Abre la cámara directamente</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={processing || loading || classifying}
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* File upload button - secondary on mobile, primary on desktop */}
            <label className="flex-1 flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary-ghost transition-all">
              <Upload className="w-8 h-8 text-text-muted" />
              <span className="text-sm text-text-secondary font-medium">Subir foto</span>
              <span className="text-xs text-text-muted">JPG, PNG hasta 10MB</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple disabled={processing || loading || classifying}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Category */}
      <Select
        label="Categoría *"
        value={form.categoria}
        onChange={(e) => setForm({ ...form, categoria: e.target.value, subcategoria: '' })}
        options={Object.entries(CATEGORIAS).map(([value, { label, icon }]) => ({
          value,
          label,
          icon,
        }))}
        placeholder="Seleccionar categoría"
      />

      {/* Subcategory */}
      {form.categoria && subcategoriaOptions.length > 0 && (
        <Select
          label="Subcategoría"
          value={form.subcategoria}
          onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
          options={subcategoriaOptions}
          placeholder="Seleccionar tipo"
        />
      )}

      {/* Color */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Color principal</p>
        <div className="flex flex-wrap gap-2">
          {COLORES.map(({ value, label, hex }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, color_principal: form.color_principal === value ? '' : value })}
              title={label}
              className={`
                w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer
                hover:scale-110
                ${form.color_principal === value
                  ? 'border-primary ring-2 ring-primary/30 scale-110'
                  : 'border-border'
                }
              `}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Estilo</p>
        <div className="flex flex-wrap gap-2">
          {ESTILOS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleArrayField('estilos', value)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 cursor-pointer
                ${form.estilos.includes(value)
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
                }
              `}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Season */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Temporada</p>
        <div className="flex flex-wrap gap-2">
          {TEMPORADAS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleArrayField('temporadas', value)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 cursor-pointer
                ${form.temporadas.includes(value)
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
                }
              `}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Brand */}
        <Input
          label="Marca (opcional)"
          value={form.marca}
          onChange={(e) => setForm({ ...form, marca: e.target.value })}
          placeholder="Nike, Zara, H&M..."
        />

        {/* Price */}
        <Input
          label="Precio (opcional)"
          type="number"
          step="0.01"
          min="0"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          placeholder="Ej: 500"
          icon={<span className="text-text-muted">$</span>}
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Notas (opcional)</label>
        <textarea
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          placeholder="Detalles extra sobre esta prenda..."
          rows={3}
          className="w-full px-4 py-2.5 text-sm bg-surface border border-border rounded-xl text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Tags */}
      <TagInput 
        tags={form.etiquetas} 
        onChange={(etiquetas) => setForm({ ...form, etiquetas })} 
        existingUserTags={existingTags} 
      />

      {/* Submit */}
      <Button type="submit" loading={loading || processing} disabled={classifying} className="w-full" size="lg">
        {queue.length ? 'Guardar y revisar la siguiente' : 'Guardar prenda'}
      </Button>
    </form>
  )
}
