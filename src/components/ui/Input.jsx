import { forwardRef } from 'react'

const Input = forwardRef(
  ({ label, error, className = '', id, type = 'text', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full px-4 py-2.5 text-sm
            bg-surface border border-border rounded-xl
            text-text placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error/20 focus:border-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
