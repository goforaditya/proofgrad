import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  role?: UserRole
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="liquid-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="liquid-spinner" />
          <span className="text-sm" style={{ color: '#9090B0' }}>Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
