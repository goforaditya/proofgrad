import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { fetchSessionByCode, joinSession, buildGuestState } from '@/hooks/useSession'

export default function JoinSession() {
  const { user, setGuestSession, guestState } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [code, setCode] = useState(searchParams.get('code') ?? '')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  // If already in a session (guest state), offer to rejoin
  const hasExistingSession = !!guestState

  // Auto-join if ?code= param and user is authenticated
  useEffect(() => {
    const autoCode = searchParams.get('code')
    if (autoCode && user) {
      setCode(autoCode)
    }
  }, [searchParams, user])

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Please enter a session code.')
      return
    }

    const displayName = user?.name ?? nickname.trim()
    if (!displayName) {
      setError('Please enter a nickname.')
      return
    }

    setJoining(true)

    // 1. Validate session code
    const { session, error: sessionErr } = await fetchSessionByCode(trimmedCode)
    if (sessionErr || !session) {
      setError(sessionErr ?? 'Session not found.')
      setJoining(false)
      return
    }

    // 2. Join session
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

    // 3. Store guest state if not authenticated
    if (!user) {
      setGuestSession(buildGuestState(session, student))
    }

    // 4. Navigate to session view
    navigate(`/student/session/${session.id}`)
  }

  function handleRejoin() {
    if (guestState) {
      navigate(`/student/session/${guestState.sessionId}`)
    }
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
          Join a Session
        </h1>
        <p className="text-sm mb-8" style={{ color: '#9090B0' }}>
          Enter the code your instructor gave you, or scan the QR code.
        </p>

        {/* Existing session banner */}
        {hasExistingSession && (
          <button
            onClick={handleRejoin}
            className="w-full mb-6 px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-colors hover:opacity-90"
            style={{ backgroundColor: '#E8447A22', border: '1px solid #E8447A44', color: '#FF9EC8' }}
          >
            <div>
              <span className="font-medium">Rejoin as </span>
              <span className="font-bold" style={{ color: '#F0F0F7' }}>{guestState!.nickname}</span>
              <span className="ml-2 font-mono text-xs" style={{ color: '#9090B0' }}>{guestState!.joinCode}</span>
            </div>
            <span>→</span>
          </button>
        )}

        {(user || guestState) && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45', color: '#9090B0' }}
          >
            <span style={{ color: '#E8447A' }}>●</span>
            Signed in as{' '}
            <strong style={{ color: '#F0F0F7' }}>
              {user?.name ?? guestState?.nickname}
            </strong>
          </div>
        )}

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: '#2E1A24', color: '#FF6BA8', border: '1px solid #C42E60' }}
          >
            {error}
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
              className="w-full px-4 py-3 rounded-xl text-lg font-mono text-center outline-none tracking-widest uppercase"
              style={{
                backgroundColor: '#1A1A26',
                border: '1px solid #2E2E45',
                color: '#F0F0F7',
                letterSpacing: '0.25em',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
              onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
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
                required={!user}
                placeholder="e.g. EconNerd42"
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1A1A26',
                  border: '1px solid #2E2E45',
                  color: '#F0F0F7',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
                onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={joining}
            className="w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: '#E8447A', color: '#fff' }}
          >
            {joining ? 'Joining…' : 'Join session →'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
