import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { toast } from '../components/ui/Toast'
import { ESTILOS, COLORES } from '../utils/categories'
import { Camera, User, LogOut, ChevronLeft, Bell } from 'lucide-react'
import { compressImage } from '../utils/helpers'
import { useNotifications } from '../hooks/useNotifications'

const TALLAS_SUPERIOR = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, updateProfile, uploadAvatar, user, signOut } = useAuthStore()
  const { isSupported, isEnabled, toggleEnabled } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Derive initial form from profile — re-create only when profile reference changes
  const initialForm = useMemo(() => ({
    nombre: profile?.nombre || '',
    estilos_favoritos: profile?.estilos_favoritos || (profile?.estilo ? [profile.estilo] : []),
    colores_favoritos: profile?.colores_favoritos || [],
    talla_superior: profile?.talla_superior || '',
    talla_inferior: profile?.talla_inferior || '',
    talla_calzado: profile?.talla_calzado || '',
  }), [profile])

  const [form, setForm] = useState(initialForm)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const result = await uploadAvatar(compressed)

      if (result?.error) {
        toast.error('Error al subir la foto de perfil: ' + result.error)
      } else {
        toast.success('¡Foto de perfil actualizada!')
      }
    } catch (err) {
      toast.error('Error al procesar la imagen: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setLoading(true)
    const result = await updateProfile({
      nombre: form.nombre,
      estilo: form.estilos_favoritos[0] || null, // Keep retro-compatibility with 'estilo' column if still used somewhere
      estilos_favoritos: form.estilos_favoritos,
      colores_favoritos: form.colores_favoritos,
      talla_superior: form.talla_superior || null,
      talla_inferior: form.talla_inferior || null,
      talla_calzado: form.talla_calzado || null,
    })

    setLoading(false)
    if (result?.error) {
      toast.error('Error al actualizar el perfil')
    } else {
      toast.success('¡Perfil actualizado con éxito!')
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleColor = (colorValue) => {
    setForm(prev => {
      const isSelected = prev.colores_favoritos.includes(colorValue)
      if (isSelected) {
        return { ...prev, colores_favoritos: prev.colores_favoritos.filter(c => c !== colorValue) }
      } else {
        return { ...prev, colores_favoritos: [...prev.colores_favoritos, colorValue] }
      }
    })
  }

  const toggleEstilo = (estiloValue) => {
    setForm(prev => {
      const isSelected = prev.estilos_favoritos.includes(estiloValue)
      if (isSelected) {
        return { ...prev, estilos_favoritos: prev.estilos_favoritos.filter(e => e !== estiloValue) }
      } else {
        return { ...prev, estilos_favoritos: [...prev.estilos_favoritos, estiloValue] }
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text hover:bg-bg-alt transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Mi Perfil</h1>
          <p className="text-sm text-text-muted">Gestiona tus datos y preferencias</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 md:p-8 space-y-8">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group w-28 h-28 rounded-full bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center shadow-inner">
            {profile?.foto_url ? (
              <img src={profile.foto_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-0">
              <Camera className="w-8 h-8 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-text-muted">Haz clic para cambiar tu foto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos Personales */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text border-b border-border/50 pb-2">Datos Personales</h2>
            
            <div>
              <p className="text-xs font-medium text-text-muted mb-1.5">Email de la cuenta (solo lectura)</p>
              <p className="text-sm font-medium text-text-secondary bg-bg-alt px-4 py-2.5 rounded-xl border border-border/50">
                {user?.email}
              </p>
            </div>

            <Input
              label="Nombre completo *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Tu nombre"
              required
            />
          </section>

          {/* Medidas y Tallas */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text border-b border-border/50 pb-2">Mis Tallas</h2>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Select
                label="Superior"
                value={form.talla_superior}
                onChange={(e) => setForm({ ...form, talla_superior: e.target.value })}
                options={TALLAS_SUPERIOR}
                placeholder="-"
              />
              <Input
                label="Inferior"
                value={form.talla_inferior}
                onChange={(e) => setForm({ ...form, talla_inferior: e.target.value })}
                placeholder="Ej. 32"
              />
              <Input
                label="Calzado"
                value={form.talla_calzado}
                onChange={(e) => setForm({ ...form, talla_calzado: e.target.value })}
                placeholder="Ej. 27"
              />
            </div>
          </section>

          {/* Preferencias de Estilo */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text border-b border-border/50 pb-2">Preferencias de Estilo</h2>
            
            <div>
              <p className="text-sm font-medium text-text-secondary mb-3">Estilos favoritos</p>
              <div className="flex flex-wrap gap-2">
                {ESTILOS.map((estilo) => {
                  const isSelected = form.estilos_favoritos.includes(estilo.value)
                  return (
                    <button
                      key={estilo.value}
                      type="button"
                      onClick={() => toggleEstilo(estilo.value)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer
                        ${isSelected 
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                          : 'bg-bg-alt text-text-secondary border border-border hover:border-primary/50'
                        }
                      `}
                    >
                      {estilo.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-text-secondary mb-3">Colores que más uso</p>
              <div className="flex flex-wrap gap-2">
                {COLORES.map((color) => {
                  const isSelected = form.colores_favoritos.includes(color.value)
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => toggleColor(color.value)}
                      title={color.label}
                      className={`
                        w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105 border border-border/50 shadow-sm'}
                      `}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${color.value === 'blanco' || color.value === 'beige' || color.value === 'amarillo' ? 'bg-black/60' : 'bg-white'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Preferencias de Notificaciones */}
          {isSupported && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-text border-b border-border/50 pb-2">Notificaciones</h2>
              
              <div className="flex items-center justify-between p-4 bg-bg-alt rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">Sugerencias mañaneras</p>
                    <p className="text-xs text-text-muted mt-0.5">Te avisaremos si hace mucho frío o calor (7-9 AM)</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleEnabled(!isEnabled)}
                  className={`
                    relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none
                    ${isEnabled ? 'bg-primary' : 'bg-border'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out
                      ${isEnabled ? 'translate-x-8' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Guardar todos los cambios
            </Button>
            
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors w-full sm:w-auto mt-4 sm:mt-0 sm:ml-auto cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
