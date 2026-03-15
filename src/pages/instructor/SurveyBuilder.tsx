import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import QuestionBuilder from '@/components/survey/QuestionBuilder'
import {
  createSurvey,
  fetchSessionSurveys,
  activateSurvey,
  deactivateSurvey,
  getResponseCount,
} from '@/hooks/useSurvey'
import { fetchSessionById, advancePhase } from '@/hooks/useSession'
import { broadcastSessionEvent, subscribeToResponseCount } from '@/lib/realtime'
import type { Session, Survey, SurveyQuestion } from '@/types'

const DEFAULT_QUESTION: SurveyQuestion = {
  type: 'number',
  label: '',
}

export default function SurveyBuilder() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Builder state
  const [title, setTitle] = useState('Screen Time Survey')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { type: 'number', label: 'How many hours of screen time did you have yesterday?' },
    { type: 'slider', label: 'Rate your sleep quality (0-100)', min: 0, max: 100, step: 1 },
    { type: 'mcq', label: 'What is your primary social media platform?', options: ['Instagram', 'YouTube', 'WhatsApp', 'X (Twitter)', 'Other'] },
    { type: 'scale', label: 'How productive were you yesterday?', min: 1, max: 10 },
    { type: 'screenshot', label: 'Upload your screen time screenshot' },
  ])
  const [creating, setCreating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)

  // Live survey state
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)
  const [responseCount, setResponseCount] = useState(0)
  const [launching, setLaunching] = useState(false)
  const [closing, setClosing] = useState(false)

  const loadData = useCallback(async () => {
    if (!sessionId) return
    const { session: s } = await fetchSessionById(sessionId)
    if (!s) { setError('Session not found'); setLoading(false); return }
    setSession(s)

    const survs = await fetchSessionSurveys(sessionId)
    setSurveys(survs)

    const active = survs.find((sv) => sv.is_active)
    if (active) {
      setActiveSurvey(active)
      const count = await getResponseCount(active.id)
      setResponseCount(count)
    }

    setLoading(false)
  }, [sessionId])

  useEffect(() => { loadData() }, [loadData])

  // Realtime response counter
  useEffect(() => {
    if (!activeSurvey) return
    const unsub = subscribeToResponseCount(activeSurvey.id, (count) => {
      setResponseCount(count)
    })
    return unsub
  }, [activeSurvey])

  // --- Question CRUD ---
  function addQuestion() {
    setQuestions((q) => [...q, { ...DEFAULT_QUESTION }])
  }

  function updateQuestion(idx: number, updated: SurveyQuestion) {
    setQuestions((q) => q.map((qq, i) => (i === idx ? updated : qq)))
  }

  function removeQuestion(idx: number) {
    setQuestions((q) => q.filter((_, i) => i !== idx))
  }

  function moveQuestion(from: number, to: number) {
    setQuestions((q) => {
      const arr = [...q]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  // --- Create survey ---
  async function handleCreate() {
    if (!sessionId || !title.trim() || questions.length === 0) return
    // Validate all questions have labels
    const invalid = questions.find((q) => !q.label.trim())
    if (invalid) { setError('All questions must have a label.'); return }

    setCreating(true)
    setError(null)
    const { survey, error: err } = await createSurvey(sessionId, title.trim(), questions)
    if (err || !survey) { setError(err ?? 'Failed to create survey'); setCreating(false); return }

    setSurveys((s) => [survey, ...s])
    setShowBuilder(false)
    setCreating(false)
  }

  // --- Launch / close survey ---
  async function handleLaunch(survey: Survey) {
    if (!session) return
    setLaunching(true)
    setError(null)

    const { error: err } = await activateSurvey(survey.id)
    if (err) { setError(err); setLaunching(false); return }

    // Move session to survey phase if needed
    if (session.phase !== 'survey') {
      await advancePhase(session.id, 'survey')
      await broadcastSessionEvent(session.id, { type: 'phase_change', phase: 'survey' })
      setSession((s) => s ? { ...s, phase: 'survey' } : null)
    }

    // Broadcast survey launch
    await broadcastSessionEvent(session.id, { type: 'survey_launched', surveyId: survey.id })

    setActiveSurvey({ ...survey, is_active: true })
    setResponseCount(0)
    setLaunching(false)
  }

  async function handleClose() {
    if (!activeSurvey || !session) return
    setClosing(true)

    const { error: err } = await deactivateSurvey(activeSurvey.id)
    if (err) { setError(err); setClosing(false); return }

    // Move to dataset phase
    await advancePhase(session.id, 'dataset')
    await broadcastSessionEvent(session.id, { type: 'phase_change', phase: 'dataset' })
    setSession((s) => s ? { ...s, phase: 'dataset' } : null)

    setActiveSurvey(null)
    setClosing(false)
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

  return (
    <AppShell showSidebar>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 fade-in-up">
          <div>
            <button
              onClick={() => navigate(`/instructor/session/${sessionId}`)}
              className="text-xs mb-2 inline-block"
              style={{ color: '#9090B0' }}
            >
              ← Back to session
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
              Survey Manager
            </h1>
            <p className="text-sm" style={{ color: '#9090B0' }}>
              {session?.title}
            </p>
          </div>
          {!activeSurvey && !showBuilder && (
            <button onClick={() => setShowBuilder(true)} className="btn-liquid px-4 py-2.5 text-sm">
              + New survey
            </button>
          )}
        </div>

        {error && (
          <div className="alert-error px-4 py-3 text-sm mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Active survey card */}
        {activeSurvey && (
          <div className="glass-strong p-6 mb-6 fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-glow">LIVE</span>
                  <h2 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>
                    {activeSurvey.title}
                  </h2>
                </div>
                <p className="text-sm" style={{ color: '#9090B0' }}>
                  {activeSurvey.questions.length} questions
                </p>
              </div>
            </div>

            {/* Response counter */}
            <div
              className="rounded-xl p-4 mb-4 text-center"
              style={{ background: 'rgba(99, 91, 255, 0.06)', border: '1px solid rgba(232,68,122,0.12)' }}
            >
              <div className="text-4xl font-bold mb-1 glow-text">{responseCount}</div>
              <div className="text-xs" style={{ color: '#9090B0' }}>responses received</div>
            </div>

            <button
              onClick={handleClose}
              disabled={closing}
              className="btn-liquid w-full py-2.5"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #8B1A3E)' }}
            >
              {closing ? 'Closing…' : 'Close survey & release dataset'}
            </button>
          </div>
        )}

        {/* Survey builder */}
        {showBuilder && !activeSurvey && (
          <div className="fade-in-up mb-6">
            <div className="glass-strong p-6 mb-4">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#F0F0F7' }}>
                Build your survey
              </h2>

              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
                  SURVEY TITLE
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Screen Time Survey"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-4">
              {questions.map((q, i) => (
                <QuestionBuilder
                  key={i}
                  question={q}
                  index={i}
                  onChange={updateQuestion}
                  onRemove={removeQuestion}
                  onMoveUp={i > 0 ? () => moveQuestion(i, i - 1) : undefined}
                  onMoveDown={i < questions.length - 1 ? () => moveQuestion(i, i + 1) : undefined}
                />
              ))}
            </div>

            <button onClick={addQuestion} className="btn-ghost w-full py-3 text-sm mb-4">
              + Add question
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBuilder(false)}
                className="btn-ghost flex-1 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || questions.length === 0}
                className="btn-liquid flex-1 py-2.5"
              >
                {creating ? 'Creating…' : 'Save survey'}
              </button>
            </div>
          </div>
        )}

        {/* Saved surveys list */}
        {!showBuilder && !activeSurvey && (
          <div className="flex flex-col gap-3">
            {surveys.length === 0 ? (
              <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
                <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No surveys yet</p>
                <p className="text-sm" style={{ color: '#9090B0' }}>
                  Create a survey to collect data from your students.
                </p>
              </div>
            ) : (
              surveys.map((sv) => (
                <div key={sv.id} className="glass p-4 flex items-center justify-between fade-in-up">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: '#F0F0F7' }}>
                      {sv.title}
                    </h3>
                    <p className="text-xs" style={{ color: '#9090B0' }}>
                      {sv.questions.length} questions · Created {new Date(sv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLaunch(sv)}
                    disabled={launching}
                    className="btn-liquid px-4 py-2 text-xs"
                  >
                    {launching ? 'Launching…' : 'Launch'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
