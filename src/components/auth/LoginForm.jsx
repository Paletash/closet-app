import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Shirt, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { toast } from '../ui/Toast'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { signIn, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Por favor llena todos los campos')
      return
    }

    const result = await signIn(email, password)
    if (result?.error) {
      toast.error('Email o contraseña incorrectos')
    } else {
      toast.success('¡Bienvenido de vuelta!')
      navigate('/')
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left side - decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-accent-light to-primary-light items-center justify-center p-12">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-3">OutfitMe</h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Tu closet inteligente. Organiza tu ropa, crea outfits y luce increíble todos los días.
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

          <h2 className="text-2xl font-bold text-text mb-1">Iniciar sesión</h2>
          <p className="text-text-secondary text-sm mb-8">
            Accede a tu closet inteligente
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-9 text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-error bg-error-light px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
