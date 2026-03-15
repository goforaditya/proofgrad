import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * Hidden instructor login page.
 * Not linked anywhere in the public UI — instructors access it directly via /auth/instructor.
 * After login, validates that the user has the 'instructor' role.
 */
export default function InstructorLogin() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: err } = await signIn(email, password)

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    // Wait for auth state to update, then verify instructor role
    setTimeout(() => {
      if (user?.role === 'instructor') {
        navigate('/instructor/dashboard', { replace: true })
      } else {
        // Even if not recognized yet (async), redirect to dashboard —
        // ProtectedRoute will handle the role check
        navigate('/instructor/dashboard', { replace: true })
      }
    }, 100)
  }

  return (
    <div className="liquid-bg min-h-screen flex items-center justify-center px-4">
      <div className="liquid-orb-3" />

      <div className="w-full max-w-md relative z-[1] fade-in-up">
        <div className="text-center mb-8">
          <h1 className="glow-text text-3xl font-bold">Proofgrad</h1>
          <p className="mt-2 text-sm" style={{ color: '#9090B0' }}>
            Instructor Portal
          </p>
        </div>

        <div className="glass-strong p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#F0F0F7' }}>
            Instructor sign in
          </h2>

          {error && (
            <div className="alert-error mb-4 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#9090B0' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="instructor@example.com"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#9090B0' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-liquid w-full py-2.5"
            >
              {loading ? 'Signing in...' : 'Sign in as Instructor'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#9090B0' }}>
            Not an instructor?{' '}
            <Link
              to="/auth/login"
              className="font-medium hover:underline"
              style={{ color: '#635BFF' }}
            >
              Regular sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
