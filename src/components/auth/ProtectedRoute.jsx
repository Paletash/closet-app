import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
