import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Shirt, Eye, EyeOff } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { toast } from '../components/ui/Toast'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { updatePassword, signOut, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)

    if (result?.error) {
      toast.error('Error al actualizar la contraseña: ' + result.error.message)
    } else {
      toast.success('¡Contraseña actualizada exitosamente! Inicia sesión con tu nueva contraseña')
      await signOut()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shirt className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-text">OutfitMe</span>
        </div>

        <h2 className="text-2xl font-bold text-text mb-1">Nueva Contraseña</h2>
        <p className="text-text-secondary text-sm mb-8">
          Ingresa tu nueva contraseña para recuperar tu acceso
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Nueva Contraseña"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-9 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label="Confirmar Contraseña"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-error bg-error-light px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Guardar Contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}
