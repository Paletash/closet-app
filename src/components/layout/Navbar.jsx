import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { Shirt, LogOut, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const { profile, user, signOut } = useAuthStore()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthPage = ['/login', '/register'].includes(location.pathname)
  if (isAuthPage) return null

  const displayName = profile?.nombre || user?.email?.split('@')[0] || 'Usuario'

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border/50 safe-top pwa-standalone-top">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shirt className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-text tracking-tight">
              OutfitMe
            </span>
          </Link>

          {/* Desktop nav - hidden, logout is in sidebar */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-text-secondary">
              {displayName}
            </span>
          </div>

          {/* Mobile menu toggle & Theme */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-bg-alt transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-surface animate-slide-up">
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary font-medium w-full text-left py-2 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.foto_url ? (
                    <img src={profile.foto_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
                Mi Perfil ({displayName})
              </Link>
              
              <button
                onClick={() => { signOut(); setMenuOpen(false) }}
                className="flex items-center gap-2 text-sm text-error hover:text-error font-medium w-full text-left py-2 border-t border-border/50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
