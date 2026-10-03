import PrivateImage from '../ui/PrivateImage'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, ShirtIcon, PlusCircle, Sparkles, BarChart3, CalendarDays, Luggage, Heart, Camera, User, LogOut, Settings, Box } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
const links = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/closet', icon: ShirtIcon, label: 'Mi Closet' },
  { to: '/closet/add', icon: PlusCircle, label: 'Agregar Prenda' },
  { to: '/outfit/generate', icon: Sparkles, label: 'Generar Outfit' },
  { to: '/capsule', icon: Box, label: 'Capsule Wardrobe' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/trips', icon: Luggage, label: 'Modo Maleta' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/look', icon: Camera, label: 'Look del Día' },
  { to: '/stats', icon: BarChart3, label: 'Estadísticas' },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile, user, signOut } = useAuthStore()
  
  const isAuthPage = ['/login', '/register', '/onboarding'].includes(location.pathname)
  if (isAuthPage) return null

  const displayName = profile?.nombre || user?.email || 'Usuario'

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-surface h-[calc(100dvh-3.5rem)] sticky top-14">
        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to))

            return (
              <NavLink
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-primary/8 text-primary'
                    : 'text-text-secondary hover:text-text hover:bg-bg-alt'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'text-primary' : ''}`} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Profile & Logout section at bottom */}
        <div className="border-t border-border p-3 space-y-1">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left hover:bg-bg-alt transition-all duration-200 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden group-hover:bg-primary/20 transition-colors">
              {profile?.foto_url ? (
                <PrivateImage src={profile.foto_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors">{displayName}</p>
              <p className="text-xs text-text-muted truncate">Editar perfil</p>
            </div>
            <Settings className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
          </NavLink>
          
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error-light transition-all duration-200 w-full cursor-pointer group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-105" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
