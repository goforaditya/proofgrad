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
  ended: 'Session ended',
}

const PHASE_DESCRIPTIONS: Record<SessionPhase, string> = {
  lobby: 'The instructor will start the session soon. Hang tight!',
  survey: 'Fill out the survey before it closes.',
  dataset: 'The anonymised dataset is now available for viewing.',
  analysis: 'Build charts and explore the data with AI-powered tools.',
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
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  if (error || !session) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p style={{ color: '#818CF8' }}>{error ?? 'Session not found'}</p>
          <button
            onClick={() => navigate('/join')}
            className="mt-4 text-sm underline"
            style={{ color: '#635BFF' }}
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
      <div className="max-w-2xl mx-auto fade-in-up">
        {/* Session header */}
        <div className="glass p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>
              {session.title}
            </h1>
            <span className={phase === 'ended' ? 'badge-muted' : 'badge-glow'}>
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: '#9090B0' }}>
            <span style={{ color: '#635BFF' }}>●</span>
            Joined as <strong style={{ color: '#F0F0F7' }}>{displayName}</strong>
          </div>

          <div className="text-xs font-mono" style={{ color: '#9090B0' }}>
            Code: {session.join_code}
          </div>
        </div>

        {/* Phase status card */}
        <div className="glass p-8 text-center">
          {/* Phase indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {(['lobby', 'survey', 'dataset', 'analysis'] as SessionPhase[]).map((p) => {
              const phases: SessionPhase[] = ['lobby', 'survey', 'dataset', 'analysis']
              const pi = phases.indexOf(p)
              const ci = phases.indexOf(phase === 'ended' ? 'analysis' : phase)
              const isActive = p === phase
              const isPast = pi < ci || phase === 'ended'
              return (
                <div
                  key={p}
                  className={`phase-dot h-1.5 flex-1 max-w-12 ${
                    isActive ? 'active' : isPast ? 'past' : 'future'
                  }`}
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

          {/* Phase-specific actions */}
          {phase === 'lobby' && (
            <div className="mt-8 lobby-pulse" style={{ height: 80 }} />
          )}

          {phase === 'survey' && (
            <button
              className="btn-liquid mt-6 px-6 py-2.5"
              onClick={() => navigate(`/student/session/${sessionId}/survey`)}
            >
              Open survey →
            </button>
          )}

          {phase === 'dataset' && (
            <button
              className="btn-liquid mt-6 px-6 py-2.5"
              onClick={() => navigate(`/student/session/${sessionId}/dataset`)}
            >
              View dataset →
            </button>
          )}

          {phase === 'analysis' && (
            <div className="flex flex-col gap-3 mt-6">
              <button
                className="btn-liquid px-6 py-2.5"
                onClick={() => navigate(`/student/session/${sessionId}/analysis`)}
              >
                Open workspace →
              </button>
              <div className="flex gap-2 justify-center">
                <button
                  className="btn-ghost px-4 py-2 text-xs"
                  onClick={() => navigate(`/student/session/${sessionId}/cpi`)}
                >
                  📊 CPI Builder
                </button>
                <button
                  className="btn-ghost px-4 py-2 text-xs"
                  onClick={() => navigate(`/student/session/${sessionId}/export`)}
                >
                  📄 Export portfolio
                </button>
              </div>
            </div>
          )}

          {phase === 'ended' && (
            <div className="flex flex-col gap-3 mt-6">
              <button
                className="btn-ghost px-6 py-2.5"
                onClick={() => navigate(`/student/session/${sessionId}/export`)}
              >
                📄 Export portfolio
              </button>
              <button
                onClick={() => navigate('/join')}
                className="btn-ghost px-6 py-2.5"
              >
                Join another session
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
