import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

// Auth pages
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import CompleteProfile from '@/pages/auth/CompleteProfile'

// Layout
import ProtectedRoute from '@/components/layout/ProtectedRoute'

// Instructor pages
import InstructorDashboard from '@/pages/instructor/Dashboard'
import SessionControl from '@/pages/instructor/SessionControl'

// Student pages
import JoinSession from '@/pages/student/JoinSession'
import SessionView from '@/pages/student/SessionView'

function RootRedirect() {
  const { user, loading, guestState } = useAuth()

  if (loading) return null

  if (user?.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />
  if (user?.role === 'student' || guestState) return <Navigate to="/student/join" replace />
  return <Navigate to="/auth/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes (public) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route
          path="/auth/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        {/* Instructor routes (protected, instructor only) */}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/session/:sessionId"
          element={
            <ProtectedRoute role="instructor">
              <SessionControl />
            </ProtectedRoute>
          }
        />

        {/* Student routes (public — guests allowed) */}
        <Route path="/student/join" element={<JoinSession />} />
        <Route path="/student/session/:sessionId" element={<SessionView />} />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

function Unauthorized() {
  return (
    <div className="liquid-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="liquid-orb-3" />
      <div className="glass-strong p-8 text-center relative z-[1] fade-in-up max-w-sm">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>Access Denied</h1>
        <p className="text-sm mb-4" style={{ color: '#9090B0' }}>
          You don't have permission to view this page.
        </p>
        <a href="/" className="text-sm font-medium" style={{ color: '#E8447A' }}>← Go home</a>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="liquid-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="liquid-orb-3" />
      <div className="glass-strong p-8 text-center relative z-[1] fade-in-up max-w-sm">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>404 — Page Not Found</h1>
        <a href="/" className="text-sm font-medium" style={{ color: '#E8447A' }}>← Go home</a>
      </div>
    </div>
  )
}
