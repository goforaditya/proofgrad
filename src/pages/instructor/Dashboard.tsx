import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { useCreateSession, fetchInstructorSessions } from '@/hooks/useSession'
import type { Session } from '@/types'

const PHASE_COLORS: Record<string, string> = {
  lobby: '#9090B0',
  survey: '#635BFF',
  dataset: '#818CF8',
  analysis: '#A5B4FC',
  ended: '#9090B0',
}

export default function InstructorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createSession = useCreateSession()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!user) return
    const data = await fetchInstructorSessions(user.id)
    setSessions(data)
    setLoadingSessions(false)
  }, [user])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function handleCreate() {
    if (!title.trim() || creating) return
    setCreating(true)
    setError(null)

    const { session, error: err } = await createSession(title.trim())
    if (err || !session) {
      setError(err ?? 'Failed to create session')
      setCreating(false)
      return
    }

    setCreating(false)
    setShowCreate(false)
    setTitle('')
    navigate(`/instructor/session/${session.id}`)
  }

  const activeSessions = sessions.filter((s) => s.status === 'active')
  const pastSessions = sessions.filter((s) => s.status === 'ended')

  return (
    <AppShell showSidebar>
      <div className="max-w-4xl fade-in-up">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F0F0F7' }}>
            Welcome back, {user?.name ?? 'Instructor'}
          </h1>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            Manage your live sessions, surveys, and lecture notes from here.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            className="btn-liquid flex flex-col gap-2 p-6 rounded-xl text-left"
            onClick={() => setShowCreate(true)}
          >
            <span className="text-2xl">+</span>
            <span className="font-semibold">Create Session</span>
            <span className="text-sm opacity-75">Start a live lecture session</span>
          </button>

          <div className="glass flex flex-col gap-2 p-6">
            <span className="text-2xl" style={{ color: '#9090B0' }}>📄</span>
            <span className="font-semibold" style={{ color: '#F0F0F7' }}>Articles</span>
            <span className="text-sm" style={{ color: '#9090B0' }}>
              Write and publish blog articles
            </span>
          </div>
        </div>

        {/* Create session modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => { setShowCreate(false); setError(null) }}
            />
            {/* Modal */}
            <div className="glass-strong p-6 w-full max-w-md relative z-10 fade-in-up rounded-2xl">
              <h2 className="text-lg font-bold mb-1" style={{ color: '#F0F0F7' }}>
                Create a new session
              </h2>
              <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
                Students will join using a code or QR scan.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                  Session title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lecture 3 — Demand & Supply"
                  maxLength={100}
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                  }}
                />
              </div>

              {error && (
                <p className="text-sm mb-4" style={{ color: '#818CF8' }}>{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreate(false); setError(null) }}
                  className="btn-ghost flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !title.trim()}
                  className="btn-liquid flex-1 py-2.5"
                >
                  {creating ? 'Creating…' : 'Create →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active sessions */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
            Active Sessions
          </h2>
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <div className="liquid-spinner" />
            </div>
          ) : activeSessions.length === 0 ? (
            <div
              className="glass rounded-xl p-8 text-center"
              style={{ borderStyle: 'dashed' }}
            >
              <p className="text-sm" style={{ color: '#9090B0' }}>
                No active sessions. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/instructor/session/${s.id}`)}
                  className="glass p-4 text-left transition-all hover:scale-[1.02] hover:border-[#635BFF]/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate" style={{ color: '#F0F0F7' }}>
                      {s.title}
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${PHASE_COLORS[s.phase]}20`,
                        color: PHASE_COLORS[s.phase],
                      }}
                    >
                      {s.phase}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#9090B0' }}>
                    <span className="font-mono">{s.join_code}</span>
                    <span>·</span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
              Past Sessions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pastSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/instructor/session/${s.id}`)}
                  className="glass p-4 text-left opacity-60 hover:opacity-80 transition-opacity"
                >
                  <h3 className="font-semibold text-sm truncate mb-1" style={{ color: '#F0F0F7' }}>
                    {s.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#9090B0' }}>
                    <span className="font-mono">{s.join_code}</span>
                    <span>·</span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>Ended</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
