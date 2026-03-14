import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // After login, redirect to where they came from or role-based default
  const from = (location.state as { from?: string })?.from

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

    // user state updates asynchronously via onAuthStateChange
    // We redirect after a tick to let context update
    setTimeout(() => {
      if (from) {
        navigate(from, { replace: true })
      } else if (user?.role === 'instructor') {
        navigate('/instructor/dashboard', { replace: true })
      } else {
        navigate('/student/join', { replace: true })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0D0D12' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#E8447A' }}>Proofgrad</h1>
          <p className="mt-2 text-sm" style={{ color: '#9090B0' }}>
            AI-powered economics learning platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#F0F0F7' }}>
            Sign in to your account
          </h2>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: '#2E1A24', color: '#FF6BA8', border: '1px solid #C42E60' }}
            >
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
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0D0D12',
                  border: '1px solid #2E2E45',
                  color: '#F0F0F7',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
                onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
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
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0D0D12',
                  border: '1px solid #2E2E45',
                  color: '#F0F0F7',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
                onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#E8447A', color: '#fff' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#9090B0' }}>
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="font-medium hover:underline"
              style={{ color: '#E8447A' }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
