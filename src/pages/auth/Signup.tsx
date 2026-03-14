import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/types'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // CTA Gate 1 context: ?redirect=analysis&session=XYZ
  const redirectParam = searchParams.get('redirect')
  const sessionParam = searchParams.get('session')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { error: err } = await signUp(email, password, name, role)

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    // Redirect based on context
    if (redirectParam === 'analysis' && sessionParam) {
      navigate(`/student/analysis?session=${sessionParam}`, { replace: true })
    } else if (role === 'instructor') {
      navigate('/instructor/dashboard', { replace: true })
    } else {
      navigate('/student/join', { replace: true })
    }
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
            Create your account
          </h2>

          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: '#0D0D12' }}>
            {(['student', 'instructor'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: role === r ? '#E8447A' : 'transparent',
                  color: role === r ? '#fff' : '#9090B0',
                }}
              >
                {r === 'student' ? "I'm a Student" : "I'm an Instructor"}
              </button>
            ))}
          </div>

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
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#9090B0' }}
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Satya Nadella"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
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
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
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
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#9090B0' }}>
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-medium hover:underline"
              style={{ color: '#E8447A' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
