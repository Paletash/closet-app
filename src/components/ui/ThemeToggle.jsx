import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer border border-border
        ${isDark ? 'bg-surface' : 'bg-surface'}
      `}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`
          flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 shadow-sm
          ${isDark ? 'translate-x-7 bg-primary text-white' : 'translate-x-1 bg-white text-primary'}
        `}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" />
        ) : (
          <Sun className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  )
}
