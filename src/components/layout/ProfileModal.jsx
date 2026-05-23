import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import { toast } from '../ui/Toast'
import { ESTILOS } from '../../utils/categories'

const TALLAS_SUPERIOR = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
]

import { Camera, User } from 'lucide-react'
import { compressImage } from '../../utils/helpers'

export default function ProfileModal({ isOpen, onClose }) {
  const { profile, updateProfile, uploadAvatar, user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    estilo: '',
    talla_superior: '',
    talla_inferior: '',
    talla_calzado: '',
  })

  // Sync profile data when modal opens
  useEffect(() => {
    if (profile) {
      setForm({
        nombre: profile.nombre || '',
        estilo: profile.estilo || '',
        talla_superior: profile.talla_superior || '',
        talla_inferior: profile.talla_inferior || '',
        talla_calzado: profile.talla_calzado || '',
      })
    }
  }, [profile, isOpen])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Compress the avatar image (resizes to max 800px and converts to lightweight JPEG)
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
      estilo: form.estilo || null,
      talla_superior: form.talla_superior || null,
      talla_inferior: form.talla_inferior || null,
      talla_calzado: form.talla_calzado || null,
    })

    setLoading(false)
    if (result?.error) {
      toast.error('Error al actualizar el perfil')
    } else {
      toast.success('¡Perfil actualizado con éxito!')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar mi Perfil" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center justify-center gap-2 pb-4 border-b border-border/50">
          <div className="relative group w-24 h-24 rounded-full bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center shadow-inner">
            {profile?.foto_url ? (
              <img src={profile.foto_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-text-muted">Haz clic para cambiar tu foto de perfil</p>
        </div>

        {/* Email read-only */}
        <div>
          <p className="text-xs font-medium text-text-muted mb-0.5">Email de la cuenta</p>
          <p className="text-sm font-semibold text-text-secondary bg-bg-alt px-3 py-2 rounded-xl">
            {user?.email}
          </p>
        </div>

        <Input
          label="Nombre *"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Tu nombre"
          required
        />

        <Select
          label="Estilo preferido"
          value={form.estilo}
          onChange={(e) => setForm({ ...form, estilo: e.target.value })}
          options={ESTILOS}
          placeholder="Ninguno seleccionado"
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Talla Superior"
            value={form.talla_superior}
            onChange={(e) => setForm({ ...form, talla_superior: e.target.value })}
            options={TALLAS_SUPERIOR}
            placeholder="-"
          />
          <Input
            label="Talla Inferior"
            value={form.talla_inferior}
            onChange={(e) => setForm({ ...form, talla_inferior: e.target.value })}
            placeholder="30, 32, M..."
          />
          <Input
            label="Talla Calzado"
            value={form.talla_calzado}
            onChange={(e) => setForm({ ...form, talla_calzado: e.target.value })}
            placeholder="27, 28, 9..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
