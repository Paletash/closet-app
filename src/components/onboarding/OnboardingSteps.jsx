import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Shirt, Sparkles, ChevronRight, Check, Camera, Compass } from 'lucide-react'
import Button from '../ui/Button'
import { toast } from '../ui/Toast'
import { ESTILOS } from '../../utils/categories'

const steps = ['Bienvenida', 'Estilo', 'Listo']

export default function OnboardingSteps() {
  const [step, setStep] = useState(0)
  const [selectedEstilo, setSelectedEstilo] = useState('')
  const { profile, updateProfile } = useAuthStore()
  const navigate = useNavigate()

  const handleComplete = async () => {
    const result = await updateProfile({
      estilo: selectedEstilo || null,
      onboarding_completado: true,
    })

    if (result?.error) {
      toast.error('Error al guardar perfil')
      return
    }

    toast.success('¡Todo listo! Bienvenido a OutfitMe')
    navigate('/')
  }

  const handleSkip = async () => {
    await updateProfile({ onboarding_completado: true })
    navigate('/')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-primary w-10' : 'bg-border w-6'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shirt className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-3">
              ¡Hola, {profile?.nombre || 'Bienvenido'}!
            </h1>
            <p className="text-text-secondary text-lg mb-2 leading-relaxed">
              Bienvenido a <strong>OutfitMe</strong>
            </p>
            <p className="text-text-muted mb-10 max-w-sm mx-auto">
              Tu closet inteligente que te ayuda a organizar tu ropa y
              crear outfits increíbles todos los días.
            </p>

            <div className="space-y-3 text-left max-w-xs mx-auto mb-10">
              {[
                { icon: <Camera className="w-5 h-5 text-primary" />, text: 'Sube fotos de tu ropa' },
                { icon: <Shirt className="w-5 h-5 text-primary" />, text: 'Organiza por categoría y estilo' },
                { icon: <Sparkles className="w-5 h-5 text-primary" />, text: 'Recibe sugerencias de outfits' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-text">{text}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => setStep(1)} size="lg" className="w-full max-w-xs">
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Style preference */}
        {step === 1 && (
          <div className="text-center animate-slide-up">
            <h2 className="text-2xl font-bold text-text mb-2">
              ¿Cuál es tu estilo?
            </h2>
            <p className="text-text-secondary mb-8">
              Esto nos ayuda a darte mejores sugerencias
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-10">
              {ESTILOS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedEstilo(value)}
                  className={`
                    p-5 rounded-2xl border-2 transition-all duration-200
                    flex flex-col items-center gap-3 cursor-pointer
                    hover:scale-[1.02] active:scale-[0.98]
                    ${selectedEstilo === value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-border/80'
                    }
                  `}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    selectedEstilo === value ? 'bg-primary/10 text-primary' : 'bg-bg-alt text-text-secondary'
                  }`}>
                    {/* Cloned React icon to adjust classes dynamically */}
                    {React.cloneElement(icon, { className: 'w-6 h-6 m-0' })}
                  </div>
                  <span className={`text-sm font-semibold ${
                    selectedEstilo === value ? 'text-primary' : 'text-text'
                  }`}>
                    {label}
                  </span>
                  {selectedEstilo === value && (
                    <Check className="w-4 h-4 text-primary mt-1" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button onClick={() => setStep(2)} size="lg" className="w-full">
                Continuar <ChevronRight className="w-4 h-4" />
              </Button>
              <button
                onClick={handleSkip}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer py-2"
              >
                Saltar por ahora
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Ready */}
        {step === 2 && (
          <div className="text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-success-light flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-3">
              ¡Todo listo!
            </h2>
            <p className="text-text-secondary mb-10 max-w-sm mx-auto">
              Tu closet está listo. Empieza subiendo tu primera prenda
              para comenzar a crear outfits increíbles.
            </p>

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button onClick={handleComplete} size="lg" className="w-full">
                Ir a mi closet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
