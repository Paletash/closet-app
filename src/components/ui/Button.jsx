import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-primary text-text-inverse hover:bg-primary-hover shadow-sm',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-hover shadow-xs',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-alt',
  danger:
    'bg-error text-text-inverse hover:opacity-90 shadow-sm',
  accent:
    'bg-primary-light text-primary hover:bg-primary/15',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
}

const Button = forwardRef(
  ({ children, variant = 'primary', size = 'md', loading, disabled, className = '', icon: Icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
          cursor-pointer
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
