import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(
  ({ label, error, options = [], placeholder = 'Seleccionar...', className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-4 py-2.5 text-sm appearance-none
              bg-surface border border-border rounded-xl
              text-text
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
              ${error ? 'border-error focus:ring-error/20 focus:border-error' : ''}
              ${className}
            `}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon && typeof opt.icon === 'string' ? `${opt.icon} ` : ''}{opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-error mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
