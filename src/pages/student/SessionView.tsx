import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { fetchSessionById } from '@/hooks/useSession'
import { subscribeToSession } from '@/lib/realtime'
import type { Session, SessionPhase } from '@/types'

const PHASE_LABELS: Record<SessionPhase, string> = {
  lobby: 'Waiting for instructor…',
  survey: 'Survey is live!',
  dataset: 'Dataset released',
  analysis: 'Analysis time',
  quiz: 'Quiz in progress!',
  ended: 'Session ended',
}

const PHASE_DESCRIPTIONS: Record<SessionPhase, string> = {
  lobby: 'The instructor will start the session soon. Hang tight!',
  survey: 'Fill out the survey before it closes.',
  dataset: 'The anonymised dataset is now available for viewing.',
  analysis: 'Build charts and explore the data with AI-powered tools.',
  quiz: 'Answer the quiz questions to test your understanding.',
  ended: 'This session has concluded. Thank you for participating!',
}

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user, guestState } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName = user?.name ?? guestState?.nickname ?? 'Student'

  const loadSession = useCallback(async () => {
    if (!sessionId) return
    const { session: s, error: err } = await fetchSessionById(sessionId)
    if (err || !s) {
      setError(err ?? 'Session not found')
      setLoading(false)
      return
    }
    setSession(s)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Subscribe to realtime phase changes
  useEffect(() => {
    if (!sessionId) return

    const unsub = subscribeToSession(sessionId, (event) => {
      if (event.type === 'phase_change') {
        setSession((s) =>
          s ? { ...s, phase: event.phase, status: event.phase === 'ended' ? 'ended' : s.status } : null
        )
      }
    })

    return unsub
  }, [sessionId])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#E8447A', borderTopColor: 'transparent' }}
          />
        </div>
      </AppShell>
    )
  }

  if (error || !session) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p style={{ color: '#FF6BA8' }}>{error ?? 'Session not found'}</p>
          <button
            onClick={() => navigate('/student/join')}
            className="mt-4 text-sm underline"
            style={{ color: '#E8447A' }}
          >
            Join a different session
          </button>
        </div>
      </AppShell>
    )
  }

  const phase = session.phase

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        {/* Session header */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>
              {session.title}
            </h1>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: phase === 'ended' ? '#2E2E45' : '#E8447A22',
                color: phase === 'ended' ? '#9090B0' : '#E8447A',
              }}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: '#9090B0' }}>
            <span style={{ color: '#E8447A' }}>●</span>
            Joined as <strong style={{ color: '#F0F0F7' }}>{displayName}</strong>
          </div>

          <div className="text-xs font-mono" style={{ color: '#9090B0' }}>
            Code: {session.join_code}
          </div>
        </div>

        {/* Phase status card */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
        >
          {/* Phase indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {(['lobby', 'survey', 'dataset', 'analysis', 'quiz'] as SessionPhase[]).map((p) => {
              const phases: SessionPhase[] = ['lobby', 'survey', 'dataset', 'analysis', 'quiz']
              const pi = phases.indexOf(p)
              const ci = phases.indexOf(phase === 'ended' ? 'quiz' : phase)
              const isActive = p === phase
              const isPast = pi < ci || phase === 'ended'
              return (
                <div
                  key={p}
                  className="h-1.5 rounded-full flex-1 max-w-12"
                  style={{
                    backgroundColor: isActive ? '#E8447A' : isPast ? '#E8447A66' : '#2E2E45',
                  }}
                />
              )
            })}
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
            {PHASE_LABELS[phase]}
          </h2>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            {PHASE_DESCRIPTIONS[phase]}
          </p>

          {/* Phase-specific actions (stubs for future phases) */}
          {phase === 'lobby' && (
            <div className="mt-8">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse"
                style={{ backgroundColor: '#E8447A22' }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: '#E8447A44' }}
                />
              </div>
            </div>
          )}

          {phase === 'survey' && (
            <button
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E8447A', color: '#fff' }}
              disabled
              title="Survey form ships in Phase 3"
            >
              Open survey →
            </button>
          )}

          {phase === 'dataset' && (
            <button
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E8447A', color: '#fff' }}
              disabled
              title="Dataset view ships in Phase 4"
            >
              View dataset →
            </button>
          )}

          {phase === 'analysis' && (
            <button
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E8447A', color: '#fff' }}
              disabled
              title="Analysis workspace ships in Phase 4"
            >
              Open workspace →
            </button>
          )}

          {phase === 'quiz' && (
            <button
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#E8447A', color: '#fff' }}
              disabled
              title="Quiz ships in Phase 5"
            >
              Start quiz →
            </button>
          )}

          {phase === 'ended' && (
            <button
              onClick={() => navigate('/student/join')}
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#2E2E45', color: '#9090B0' }}
            >
              Join another session
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
