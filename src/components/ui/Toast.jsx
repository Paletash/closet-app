import { listeners, toasts, notify } from '../../lib/toast'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-success-light text-success border-success/20',
  error: 'bg-error-light text-error border-error/20',
  warning: 'bg-warning-light text-warning border-warning/20',
  info: 'bg-primary-light text-primary border-primary/20',
}

export function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    listeners.add(setItems)
    return () => listeners.delete(setItems)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3
              rounded-xl border shadow-md
              animate-slide-up
              ${colors[t.type]}
            `}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => notify(toasts.filter((tt) => tt.id !== t.id))}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
