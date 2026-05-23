import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { ToastContainer } from './components/ui/Toast'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'

// Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ClosetPage = lazy(() => import('./pages/ClosetPage'))
const AddClothingPage = lazy(() => import('./pages/AddClothingPage'))
const ClothingDetailPage = lazy(() => import('./pages/ClothingDetailPage'))
const OutfitGeneratorPage = lazy(() => import('./pages/OutfitGeneratorPage'))
const SavedOutfitsPage = lazy(() => import('./pages/SavedOutfitsPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const TripsPage = lazy(() => import('./pages/TripsPage'))
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const LookDelDiaPage = lazy(() => import('./pages/LookDelDiaPage'))

function OnboardingGuard({ children }) {
  const { profile, loading } = useAuthStore()
  if (loading) return <LoadingSpinner size="lg" />
  if (profile && !profile.onboarding_completado) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export default function App() {
  const { initialize, loading, session } = useAuthStore()

  useEffect(() => {
    let subscription
    const init = async () => {
      subscription = await initialize()
    }
    init()
    return () => subscription?.unsubscribe?.()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Cargando OutfitMe..." />
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-bg"><LoadingSpinner size="lg" text="Cargando módulo..." /></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={session ? <Navigate to="/" replace /> : <RegisterPage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
          } />

          {/* Protected routes with layout */}
          <Route path="/" element={
            <ProtectedRoute><OnboardingGuard><Layout><DashboardPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/closet" element={
            <ProtectedRoute><OnboardingGuard><Layout><ClosetPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/closet/add" element={
            <ProtectedRoute><OnboardingGuard><Layout><AddClothingPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/closet/:id" element={
            <ProtectedRoute><OnboardingGuard><Layout><ClothingDetailPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/outfit/generate" element={
            <ProtectedRoute><OnboardingGuard><Layout><OutfitGeneratorPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/outfits" element={
            <ProtectedRoute><OnboardingGuard><Layout><SavedOutfitsPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/stats" element={
            <ProtectedRoute><OnboardingGuard><Layout><StatsPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute><OnboardingGuard><Layout><CalendarPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute><OnboardingGuard><Layout><TripsPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute><OnboardingGuard><Layout><TripDetailPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><OnboardingGuard><Layout><WishlistPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />
          <Route path="/look" element={
            <ProtectedRoute><OnboardingGuard><Layout><LookDelDiaPage /></Layout></OnboardingGuard></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
