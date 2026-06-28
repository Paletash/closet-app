import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setThemeState] = useState('light')

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('outfitme_theme')
    
    if (savedTheme) {
      setThemeState(savedTheme)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setThemeState(prefersDark ? 'dark' : 'light')
    }
  }, [])

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

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
  }

  return { theme, toggleTheme, setTheme }
}
