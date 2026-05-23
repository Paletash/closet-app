import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text }) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-text-muted">{text}</p>}
    </div>
  )
}
