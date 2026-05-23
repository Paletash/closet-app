import { NavLink, useLocation } from 'react-router-dom'
import { Home, ShirtIcon, PlusCircle, Sparkles, CalendarDays } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/closet', icon: ShirtIcon, label: 'Closet' },
  { to: '/closet/add', icon: PlusCircle, label: 'Agregar' },
  { to: '/outfit/generate', icon: Sparkles, label: 'Outfit' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
]

export default function BottomNav() {
  const location = useLocation()
  const isAuthPage = ['/login', '/register', '/onboarding'].includes(location.pathname)
  if (isAuthPage) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 safe-bottom safe-left safe-right">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to !== '/' && location.pathname.startsWith(to))

          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 group min-h-[44px]"
            >
              <div className={`
                p-2 rounded-2xl transition-all duration-300 ease-out
                ${isActive
                  ? 'bg-primary/12 text-primary scale-110'
                  : 'text-text-muted group-hover:text-text group-active:scale-95'
                }
              `}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`
                text-[10px] font-medium transition-all duration-200
                ${isActive ? 'text-primary font-semibold' : 'text-text-muted'}
              `}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
