import { useAuth } from '@/features/auth/hooks/useAuth'
import { Navigate, Outlet } from 'react-router-dom'

export function PublicRoute() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
