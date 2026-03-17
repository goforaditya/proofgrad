import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    const { error: err } = await signUp(email, password, name, 'student')

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    // Redirect based on context
    if (redirectParam === 'analysis' && sessionParam) {
      navigate(`/student/session/${sessionParam}/analysis`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="liquid-bg min-h-screen flex items-center justify-center px-4">
      {/* Floating orb */}
      <div className="liquid-orb-3" />

      <div className="w-full max-w-md relative z-[1] fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="glow-text text-3xl font-bold">Proofgrad</h1>
          <p className="mt-2 text-sm" style={{ color: '#9090B0' }}>
            AI-powered data collection &amp; analysis
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong p-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#F0F0F7' }}>
            Create your account
          </h2>

          {error && (
            <div className="alert-error mb-4 px-4 py-3 text-sm">
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
                className="glass-input w-full px-4 py-2.5 text-sm"
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
                minLength={8}
                placeholder="Min. 8 characters"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-liquid w-full py-2.5"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#9090B0' }}>
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-medium hover:underline"
              style={{ color: '#635BFF' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
