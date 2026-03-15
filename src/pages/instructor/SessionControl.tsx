import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import AppShell from '@/components/layout/AppShell'
import {
  fetchSessionById,
  fetchSessionStudents,
  advancePhase,
  endSession,
} from '@/hooks/useSession'
import { broadcastSessionEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import type { Session, SessionStudent, SessionPhase } from '@/types'

const PHASE_ORDER: SessionPhase[] = ['lobby', 'survey', 'dataset', 'analysis', 'ended']

const PHASE_LABELS: Record<SessionPhase, string> = {
  lobby: 'Lobby',
  survey: 'Survey',
  dataset: 'Dataset',
  analysis: 'Analysis',
  ended: 'Ended',
}

export default function SessionControl() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<SessionStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)

  const joinUrl = session
    ? `${window.location.origin}/student/join?code=${session.join_code}`
    : ''

  const loadData = useCallback(async () => {
    if (!sessionId) return
    const { session: s, error: err } = await fetchSessionById(sessionId)
    if (err || !s) {
      setError(err ?? 'Session not found')
      setLoading(false)
      return
    }
    setSession(s)
    const stu = await fetchSessionStudents(sessionId)
    setStudents(stu)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime: listen for new students joining
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`session_students_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_students',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setStudents((prev) => [...prev, payload.new as SessionStudent])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  async function handleAdvance() {
    if (!session || advancing) return
    const idx = PHASE_ORDER.indexOf(session.phase)
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) return

    const nextPhase = PHASE_ORDER[idx + 1]
    setAdvancing(true)

    if (nextPhase === 'ended') {
      const { error: err } = await endSession(session.id)
      if (err) { setError(err); setAdvancing(false); return }
    } else {
      const { error: err } = await advancePhase(session.id, nextPhase)
      if (err) { setError(err); setAdvancing(false); return }
    }

    // Broadcast to connected students
    await broadcastSessionEvent(session.id, {
      type: 'phase_change',
      phase: nextPhase,
    })

    setSession((s) => s ? { ...s, phase: nextPhase, status: nextPhase === 'ended' ? 'ended' : s.status } : null)
    setAdvancing(false)
  }

  function copyCode() {
    if (session) navigator.clipboard.writeText(session.join_code)
  }

  function copyLink() {
    if (joinUrl) navigator.clipboard.writeText(joinUrl)
  }

  if (loading) {
    return (
      <AppShell showSidebar>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  if (error || !session) {
    return (
      <AppShell showSidebar>
        <div className="text-center py-20">
          <p style={{ color: '#818CF8' }}>{error ?? 'Session not found'}</p>
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="mt-4 text-sm underline"
            style={{ color: '#635BFF' }}
          >
            Back to dashboard
          </button>
        </div>
      </AppShell>
    )
  }

  const currentIdx = PHASE_ORDER.indexOf(session.phase)
  const isEnded = session.phase === 'ended'

  return (
    <AppShell showSidebar fullWidth>
      <div className="flex flex-col lg:flex-row h-full min-h-0">
        {/* Left: Session info + QR */}
        <div
          className="glass-sidebar w-full lg:w-80 flex-shrink-0 p-6 flex flex-col gap-6 overflow-y-auto"
        >
          <div className="fade-in-up">
            <h1 className="text-lg font-bold mb-1" style={{ color: '#F0F0F7' }}>
              {session.title}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#9090B0' }}>
              <span>Phase:</span>
              <span className={isEnded ? 'badge-muted' : 'badge-glow'}>
                {PHASE_LABELS[session.phase]}
              </span>
            </div>
          </div>

          {/* Join code */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#9090B0' }}>
              JOIN CODE
            </label>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-2xl tracking-widest font-bold glow-text"
              >
                {session.join_code}
              </span>
              <button
                onClick={copyCode}
                className="btn-ghost text-xs px-2 py-1"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Join link */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#9090B0' }}>
              JOIN LINK
            </label>
            <div className="flex items-center gap-2">
              <span
                className="glass-input px-3 py-1.5 text-xs font-mono truncate max-w-[260px] inline-block"
                style={{ color: '#F0F0F7' }}
              >
                {joinUrl}
              </span>
              <button
                onClick={copyLink}
                className="btn-ghost text-xs px-2 py-1 shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#9090B0' }}>
              QR CODE
            </label>
            <div className="qr-card inline-block">
              <QRCodeSVG value={joinUrl} size={180} level="M" />
            </div>
            <p className="text-xs mt-2" style={{ color: '#9090B0' }}>
              Scan to join instantly
            </p>
          </div>

          {/* Session management links */}
          {!isEnded && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/instructor/session/${sessionId}/survey`)}
                className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <span>📋</span> Manage surveys
              </button>
              <button
                onClick={() => navigate(`/instructor/session/${sessionId}/notes`)}
                className="btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <span>📝</span> Lecture notes
              </button>
            </div>
          )}

          {/* Phase control */}
          {!isEnded && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#9090B0' }}>
                PHASE CONTROL
              </label>
              <div className="flex flex-col gap-1.5 mb-4">
                {PHASE_ORDER.map((p, i) => {
                  const isActive = i === currentIdx
                  const isPast = i < currentIdx
                  return (
                    <div key={p} className="flex items-center gap-2 text-xs py-1">
                      <div
                        className={`phase-step-circle ${
                          isActive ? 'active' : isPast ? 'past' : 'future'
                        }`}
                      >
                        {isPast ? '✓' : i + 1}
                      </div>
                      <span
                        style={{ color: isActive ? '#F0F0F7' : '#9090B0' }}
                      >
                        {PHASE_LABELS[p]}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={handleAdvance}
                disabled={advancing || isEnded}
                className="btn-liquid w-full py-2.5"
                style={
                  currentIdx === PHASE_ORDER.length - 2
                    ? { background: 'linear-gradient(135deg, #4F46E5, #8B1A3E)' }
                    : undefined
                }
              >
                {advancing
                  ? 'Advancing…'
                  : currentIdx === PHASE_ORDER.length - 2
                  ? 'End session'
                  : `Advance to ${PHASE_LABELS[PHASE_ORDER[currentIdx + 1]]}`}
              </button>
            </div>
          )}
        </div>

        {/* Right: Students list */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
            Students ({students.length})
          </h2>

          {students.length === 0 ? (
            <div
              className="glass p-8 text-center"
              style={{ borderStyle: 'dashed' }}
            >
              <p className="text-lg mb-2" style={{ color: '#9090B0' }}>
                Waiting for students to join…
              </p>
              <p className="text-sm" style={{ color: '#9090B0' }}>
                Share the join code or display the QR code on screen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="glass flex items-center gap-3 px-4 py-3 fade-in-up"
                >
                  <div className="avatar-glow w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                    {s.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#F0F0F7' }}>
                      {s.nickname}
                    </div>
                    <div className="text-xs" style={{ color: '#9090B0' }}>
                      {s.is_guest ? 'Guest' : 'Registered'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
