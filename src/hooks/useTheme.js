import { useState, useEffect, useCallback } from 'react'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('outfitme_theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* SSR or restricted storage */ }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Save to local storage
    localStorage.setItem('outfitme_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
  }, [])

  return { theme, toggleTheme, setTheme }
}

