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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0D0D12' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#E8447A', borderTopColor: 'transparent' }}
          />
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
