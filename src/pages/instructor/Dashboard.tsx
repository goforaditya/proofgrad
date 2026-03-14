import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { useCreateSession, fetchInstructorSessions } from '@/hooks/useSession'
import type { Session } from '@/types'

const PHASE_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  survey: 'Survey',
  dataset: 'Dataset',
  analysis: 'Analysis',
  quiz: 'Quiz',
  ended: 'Ended',
}

export default function InstructorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createSession = useCreateSession()

  const [sessions, setSessions] = useState<Session[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!user) return
    const data = await fetchInstructorSessions(user.id)
    setSessions(data)
  }, [user])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    setError(null)

    const { session, error: err } = await createSession(title.trim())
    if (err) {
      setError(err)
      setCreating(false)
      return
    }

    setTitle('')
    setShowCreate(false)
    setCreating(false)

    if (session) {
      navigate(`/instructor/session/${session.id}`)
    }
  }

  return (
    <AppShell showSidebar>
      <div className="max-w-4xl">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F0F0F7' }}>
            Welcome back, {user?.name ?? 'Instructor'}
          </h1>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            Manage your live sessions, surveys, and quizzes from here.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col gap-2 p-6 rounded-xl text-left transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#E8447A', color: '#fff' }}
          >
            <span className="text-2xl">+</span>
            <span className="font-semibold">Create Session</span>
            <span className="text-sm opacity-75">Start a live lecture session</span>
          </button>

          <div
            className="flex flex-col gap-2 p-6 rounded-xl"
            style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
          >
            <span className="text-2xl" style={{ color: '#9090B0' }}>📄</span>
            <span className="font-semibold" style={{ color: '#F0F0F7' }}>Articles</span>
            <span className="text-sm" style={{ color: '#9090B0' }}>
              Write and publish blog articles
            </span>
          </div>
        </div>

        {/* Create session modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#F0F0F7' }}>
                Create a new session
              </h3>

              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#2E1A24', color: '#FF6BA8', border: '1px solid #C42E60' }}
                >
                  {error}
                </div>
              )}

              <label className="block text-sm font-medium mb-1.5" style={{ color: '#9090B0' }}>
                Session title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lecture 3 — Demand & Supply"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-4"
                style={{ backgroundColor: '#0D0D12', border: '1px solid #2E2E45', color: '#F0F0F7' }}
                onFocus={(e) => (e.target.style.borderColor = '#E8447A')}
                onBlur={(e) => (e.target.style.borderColor = '#2E2E45')}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowCreate(false); setError(null) }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: '#9090B0' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !title.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#E8447A', color: '#fff' }}
                >
                  {creating ? 'Creating…' : 'Create session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions list */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#F0F0F7' }}>
            Your Sessions
          </h2>

          {sessions.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: '#1A1A26', border: '1px dashed #2E2E45' }}
            >
              <p className="text-sm" style={{ color: '#9090B0' }}>
                No sessions yet. Create your first session to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/instructor/session/${s.id}`)}
                  className="flex items-center justify-between p-4 rounded-xl text-left transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#1A1A26', border: '1px solid #2E2E45' }}
                >
                  <div>
                    <div className="font-medium text-sm" style={{ color: '#F0F0F7' }}>
                      {s.title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#9090B0' }}>
                      Code: <span className="font-mono" style={{ color: '#FF9EC8' }}>{s.join_code}</span>
                      <span className="mx-2">·</span>
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: s.status === 'ended' ? '#2E2E45' : '#E8447A22',
                      color: s.status === 'ended' ? '#9090B0' : '#E8447A',
                    }}
                  >
                    {PHASE_LABELS[s.phase] ?? s.phase}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
