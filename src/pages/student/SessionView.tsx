import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { fetchSessionById } from '@/hooks/useSession'
import { subscribeToSession } from '@/lib/realtime'
import type { Session } from '@/types'

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user, guestState, refreshUser } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Profile nudge modal state
  const [showProfileNudge, setShowProfileNudge] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [snapchat, setSnapchat] = useState(user?.snapchat ?? '')
  const [instagram, setInstagram] = useState(user?.instagram ?? '')
  const [linkedin, setLinkedin] = useState(user?.linkedin ?? '')

  const displayName = user?.name ?? guestState?.nickname ?? 'User'

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

  // Show profile nudge when session ends for logged-in users with incomplete profiles
  useEffect(() => {
    if (session?.phase === 'ended' && user && !user.profile_completed) {
      setShowProfileNudge(true)
    }
  }, [session?.phase, user])

  async function handleProfileSave() {
    if (!user) return
    // Require at least one social field
    if (!snapchat.trim() && !instagram.trim() && !linkedin.trim()) {
      setProfileError('Please add at least one social profile to complete your profile.')
      return
    }
    setProfileError(null)
    setProfileSaving(true)
    await supabase
      .from('users')
      .update({
        snapchat: snapchat || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        profile_completed: true,
      })
      .eq('id', user.id)
    await refreshUser()
    setProfileSaving(false)
    setShowProfileNudge(false)
  }

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
            <span className={phase === 'ended' ? 'badge-muted' : phase === 'active' ? 'badge-glow' : 'badge-muted'}>
              {phase === 'active' ? 'Live' : phase.charAt(0).toUpperCase() + phase.slice(1)}
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

        {/* Phase content */}
        <div className="glass p-8 text-center">
          {phase === 'lobby' && (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
                Waiting for instructor…
              </h2>
              <p className="text-sm" style={{ color: '#9090B0' }}>
                The instructor will start the session soon. Hang tight!
              </p>
              <div className="mt-8 lobby-pulse" style={{ height: 80 }} />
            </>
          )}

          {phase === 'active' && (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
                Session is live! 🚀
              </h2>
              <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
                Survey, dataset, and analysis are all available. Jump into any activity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <button
                  onClick={() => navigate(`/student/session/${sessionId}/survey`)}
                  className="glass p-4 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                    Survey
                  </div>
                  <div className="text-xs" style={{ color: '#9090B0' }}>
                    Fill out the live survey
                  </div>
                </button>

                <button
                  onClick={() => navigate(`/student/session/${sessionId}/dataset`)}
                  className="glass p-4 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                    Dataset
                  </div>
                  <div className="text-xs" style={{ color: '#9090B0' }}>
                    View live responses
                  </div>
                </button>

                <button
                  onClick={() => navigate(`/student/session/${sessionId}/analysis`)}
                  className="glass p-4 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <div className="text-2xl mb-2">✨</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: '#F0F0F7' }}>
                    Analysis
                  </div>
                  <div className="text-xs" style={{ color: '#9090B0' }}>
                    Charts & AI insights
                  </div>
                </button>
              </div>

              <div className="flex gap-2 justify-center mt-4">
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
            </>
          )}

          {phase === 'ended' && (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
                Session ended
              </h2>
              <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
                This session has concluded. Thank you for participating!
              </p>
              <div className="flex flex-col gap-3">
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
                {!user && (
                  <button
                    onClick={() => navigate(`/auth/signup?redirect=session&session=${sessionId}`)}
                    className="btn-liquid px-6 py-2.5 mt-2"
                  >
                    Create account to save your work
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile completion nudge modal */}
      {showProfileNudge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div className="glass-strong p-8 max-w-md w-full fade-in-up">
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🎉</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
                Great session!
              </h2>
              <p className="text-sm" style={{ color: '#9090B0' }}>
                Complete your profile to unlock PDF exports, connect with peers,
                and get personalized insights. Add at least one social profile.
              </p>
            </div>

            {profileError && (
              <div className="alert-error mb-4 px-4 py-3 text-sm">
                {profileError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>
                  Snapchat
                </label>
                <input
                  type="text"
                  value={snapchat}
                  onChange={(e) => setSnapchat(e.target.value)}
                  placeholder="@username"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@username"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9090B0' }}>
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="btn-liquid w-full py-2.5 mb-3"
            >
              {profileSaving ? 'Saving…' : 'Complete Profile'}
            </button>
            <button
              onClick={() => setShowProfileNudge(false)}
              className="btn-ghost w-full py-2 text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
