import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Shirt, Eye, EyeOff } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../../lib/toast'

export default function RegisterForm() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { signUp, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nombre || !email || !password || !confirmPw) {
      toast.error('Por favor llena todos los campos')
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPw) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    const result = await signUp(email, password, nombre)
    if (result?.error) {
      toast.error(result.error.message || 'Error al crear cuenta')
    } else if (!result?.data?.session) {
      toast.info('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.', 8000)
      navigate('/login')
    } else {
      toast.success('¡Cuenta creada! Bienvenido a OutfitMe')
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left side - decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-light via-primary-light to-success-light items-center justify-center p-12">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-3">Únete a OutfitMe</h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Digitaliza tu guardarropa y descubre nuevas combinaciones de ropa todos los días.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text">OutfitMe</span>
          </div>

          <h2 className="text-2xl font-bold text-text mb-1">Crear cuenta</h2>
          <p className="text-text-secondary text-sm mb-8">
            Empieza a organizar tu closet
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
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
              label="Confirmar contraseña"
              type={showPw ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-error bg-error-light px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
          <p className="text-center text-xs text-text-muted mt-4"><Link to="/privacy" className="underline">Cómo usamos tus datos</Link></p>
        </div>
      </div>
    </div>
  )
}
