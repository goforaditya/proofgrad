import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import {
  fetchSessionByCode,
  joinSession,
  buildGuestState,
} from '@/hooks/useSession'

export default function JoinSession() {
  const { guestState, user, setGuestSession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill code from QR scan URL param
  useEffect(() => {
    const qrCode = searchParams.get('code')
    if (qrCode) {
      setCode(qrCode.toUpperCase().trim())
    }
  }, [searchParams])

  // If guest already has a session, offer to rejoin
  useEffect(() => {
    if (guestState?.sessionId) {
      // Automatically redirect to their active session
      navigate(`/student/session/${guestState.sessionId}`, { replace: true })
    }
  }, [guestState, navigate])

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (joining) return
    setError(null)
    setJoining(true)

    const trimmedCode = code.toUpperCase().trim()
    const displayName = user?.name ?? nickname.trim()

    if (!trimmedCode) {
      setError('Please enter a session code.')
      setJoining(false)
      return
    }

    if (!displayName) {
      setError('Please enter a nickname.')
      setJoining(false)
      return
    }

    // 1. Look up session by code
    const { session, error: fetchErr } = await fetchSessionByCode(trimmedCode)
    if (fetchErr || !session) {
      setError(fetchErr ?? 'Session not found. Check the code and try again.')
      setJoining(false)
      return
    }

    // 2. Join the session
    const { student, error: joinErr } = await joinSession(
      session.id,
      displayName,
      user?.id
    )
    if (joinErr || !student) {
      setError(joinErr ?? 'Failed to join session.')
      setJoining(false)
      return
    }

    // 3. If guest (no user), set guest state
    if (!user) {
      const guest = buildGuestState(session, student)
      setGuestSession(guest)
    }

    // 4. Navigate to session view
    setJoining(false)
    navigate(`/student/session/${session.id}`)
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto mt-8 fade-in-up">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
          Join a Session
        </h1>
        <p className="text-sm mb-8" style={{ color: '#9090B0' }}>
          Enter the session code or scan the QR code to join.
        </p>

        {user && (
          <div className="glass mb-6 px-4 py-3 text-sm flex items-center gap-2">
            <span style={{ color: '#635BFF' }}>●</span>
            <span style={{ color: '#9090B0' }}>
              Signed in as{' '}
              <strong style={{ color: '#F0F0F7' }}>
                {user.name}
              </strong>
            </span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Session code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. ABC123"
              maxLength={8}
              className="glass-input w-full px-4 py-3 text-lg font-mono text-center tracking-widest uppercase"
              style={{ letterSpacing: '0.25em' }}
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Your nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                placeholder="e.g. EconNerd42"
                maxLength={30}
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
          )}

          {error && (
            <div className="alert-error text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={joining}
            className="btn-liquid w-full py-3"
          >
            {joining ? 'Joining…' : 'Join session →'}
          </button>
        </form>

        {!user && (
          <p className="text-center text-xs mt-6" style={{ color: '#9090B0' }}>
            Already have an account?{' '}
            <a
              href="/auth/login"
              className="font-medium"
              style={{ color: '#635BFF' }}
            >
              Sign in
            </a>
          </p>
        )}
      </div>
    </AppShell>
  )
}
