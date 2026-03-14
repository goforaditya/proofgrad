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
import { subscribeToSession, broadcastSessionEvent } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import type { Session, SessionStudent, SessionPhase } from '@/types'

const PHASE_ORDER: SessionPhase[] = ['lobby', 'survey', 'dataset', 'analysis', 'quiz', 'ended']

const PHASE_LABELS: Record<SessionPhase, string> = {
  lobby: 'Lobby',
  survey: 'Survey',
  dataset: 'Dataset',
  analysis: 'Analysis',
  quiz: 'Quiz',
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

  if (loading) {
    return (
      <AppShell showSidebar>
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
      <AppShell showSidebar>
        <div className="text-center py-20">
          <p style={{ color: '#FF6BA8' }}>{error ?? 'Session not found'}</p>
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="mt-4 text-sm underline"
            style={{ color: '#E8447A' }}
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
          className="w-full lg:w-80 flex-shrink-0 p-6 flex flex-col gap-6 overflow-y-auto"
          style={{ backgroundColor: '#1A1A26', borderRight: '1px solid #2E2E45' }}
        >
          <div>
            <h1 className="text-lg font-bold mb-1" style={{ color: '#F0F0F7' }}>
              {session.title}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#9090B0' }}>
              <span>Phase:</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: isEnded ? '#2E2E45' : '#E8447A22',
                  color: isEnded ? '#9090B0' : '#E8447A',
                }}
              >
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
                className="font-mono text-2xl tracking-widest font-bold"
                style={{ color: '#FF9EC8' }}
              >
                {session.join_code}
              </span>
              <button
                onClick={copyCode}
                className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: '#2E2E45', color: '#9090B0' }}
                title="Copy code"
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
            <div className="bg-white p-3 rounded-xl inline-block">
              <QRCodeSVG value={joinUrl} size={180} level="M" />
            </div>
            <p className="text-xs mt-2" style={{ color: '#9090B0' }}>
              Students scan to join instantly
            </p>
          </div>

          {/* Phase control */}
          {!isEnded && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#9090B0' }}>
                PHASE CONTROL
              </label>
              <div className="flex flex-col gap-1.5 mb-4">
                {PHASE_ORDER.map((p, i) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 text-xs py-1"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: i <= currentIdx ? '#E8447A' : '#2E2E45',
                        color: i <= currentIdx ? '#fff' : '#9090B0',
                      }}
                    >
                      {i < currentIdx ? '✓' : i + 1}
                    </div>
                    <span
                      style={{ color: i === currentIdx ? '#F0F0F7' : '#9090B0' }}
                    >
                      {PHASE_LABELS[p]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAdvance}
                disabled={advancing || isEnded}
                className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: currentIdx === PHASE_ORDER.length - 2 ? '#C42E60' : '#E8447A',
                  color: '#fff',
                }}
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
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: '#1A1A26', border: '1px dashed #2E2E45' }}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#E8447A22', color: '#E8447A' }}
                  >
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
