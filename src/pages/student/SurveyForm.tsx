import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import QuestionRenderer from '@/components/survey/QuestionRenderer'
import { useAuth } from '@/lib/auth'
import {
  fetchActiveSurvey,
  submitSurveyResponse,
  hasStudentResponded,
  uploadScreenshot,
} from '@/hooks/useSurvey'
import { broadcastSessionEvent } from '@/lib/realtime'
import type { Survey, AnswerMap } from '@/types'

export default function SurveyForm() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user, guestState } = useAuth()

  const sessionStudentId = guestState?.sessionStudentId ?? null

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [screenshotFiles, setScreenshotFiles] = useState<Record<number, File>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrResults, setOcrResults] = useState<Record<number, string>>({})

  const loadSurvey = useCallback(async () => {
    if (!sessionId) return
    const { survey: s, error: err } = await fetchActiveSurvey(sessionId)
    if (err || !s) {
      setError(err ?? 'No active survey found')
      setLoading(false)
      return
    }
    setSurvey(s)

    // Check if already responded
    if (sessionStudentId) {
      const already = await hasStudentResponded(s.id, sessionStudentId)
      if (already) setSubmitted(true)
    }

    setLoading(false)
  }, [sessionId, sessionStudentId])

  useEffect(() => { loadSurvey() }, [loadSurvey])

  function handleAnswer(index: number, value: string | number) {
    setAnswers((prev) => ({ ...prev, [index]: value }))
  }

  function handleScreenshotFile(index: number, file: File) {
    setScreenshotFiles((prev) => ({ ...prev, [index]: file }))
    runOCR(index, file)
  }

  async function runOCR(index: number, file: File) {
    setOcrProcessing(true)
    try {
      // Dynamic import to keep bundle light
      const Tesseract = await import('tesseract.js')
      const result = await Tesseract.recognize(file, 'eng', {
        logger: () => {}, // suppress logs
      })
      const text = result.data.text
      setOcrResults((prev) => ({ ...prev, [index]: text }))

      // Try to extract total screen time from OCR text
      const extracted = extractScreenTime(text)
      if (extracted !== null) {
        setAnswers((prev) => ({ ...prev, [index]: extracted }))
      } else {
        setAnswers((prev) => ({ ...prev, [index]: text }))
      }
    } catch {
      // OCR failed, just store the file reference
      setAnswers((prev) => ({ ...prev, [index]: 'screenshot_uploaded' }))
    } finally {
      setOcrProcessing(false)
    }
  }

  // Extract screen time in hours from OCR text
  function extractScreenTime(text: string): number | null {
    // Match patterns like "7h 23m", "7 hr 23 min", "7:23", "7 hours", etc.
    const patterns = [
      /(\d+)\s*h(?:ours?|r(?:s)?)?\s*(\d+)\s*m(?:in(?:utes?)?)?/i,
      /(\d+)\s*:\s*(\d+)/,
      /(\d+)\s*h(?:ours?|r(?:s)?)?/i,
    ]

    for (const pat of patterns) {
      const match = text.match(pat)
      if (match) {
        const hours = parseInt(match[1], 10)
        const minutes = match[2] ? parseInt(match[2], 10) : 0
        return Math.round((hours + minutes / 60) * 10) / 10
      }
    }
    return null
  }

  async function handleSubmit() {
    if (!survey || !sessionStudentId || submitting) return

    // Validate required answers
    const unanswered = survey.questions.findIndex((q, i) => {
      if (q.type === 'screenshot') return false // optional
      return answers[i] === undefined || answers[i] === ''
    })
    if (unanswered >= 0) {
      setError(`Please answer question ${unanswered + 1}`)
      return
    }

    setSubmitting(true)
    setError(null)

    // Build a local copy of answers that we'll mutate for screenshots
    const finalAnswers: AnswerMap = { ...answers }

    // Upload screenshots first
    for (const [idx, file] of Object.entries(screenshotFiles)) {
      const { url, error: uploadErr } = await uploadScreenshot(file, sessionId!, sessionStudentId)
      if (url) {
        finalAnswers[idx] = JSON.stringify({
          url,
          ocr_text: ocrResults[Number(idx)] ?? null,
          extracted_value: answers[Number(idx)],
        })
      }
      if (uploadErr) {
        console.warn('Screenshot upload failed:', uploadErr)
      }
    }

    const { error: err } = await submitSurveyResponse(survey.id, sessionStudentId, finalAnswers)
    if (err) {
      setError(err)
      setSubmitting(false)
      return
    }

    // Broadcast updated count
    try {
      await broadcastSessionEvent(sessionId!, {
        type: 'survey_launched',
        surveyId: survey.id,
      })
    } catch {
      // Non-critical
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  const displayName = user?.name ?? guestState?.nickname ?? 'Student'

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  if (submitted) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 text-center fade-in-up">
          <div className="glass-strong p-8">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
              Response submitted!
            </h1>
            <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
              Your answers have been recorded. Wait for the instructor to release the dataset.
            </p>
            <button
              onClick={() => navigate(`/student/session/${sessionId}`)}
              className="btn-ghost px-6 py-2.5"
            >
              ← Back to session
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!survey) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="glass p-8">
            <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No active survey</p>
            <p className="text-sm mb-4" style={{ color: '#9090B0' }}>
              The survey may have closed or hasn't been launched yet.
            </p>
            <button
              onClick={() => navigate(`/student/session/${sessionId}`)}
              className="btn-ghost px-6 py-2.5"
            >
              ← Back to session
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const progress = survey.questions.length > 0
    ? Math.round((Object.keys(answers).length / survey.questions.length) * 100)
    : 0

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 fade-in-up">
          <button
            onClick={() => navigate(`/student/session/${sessionId}`)}
            className="text-xs mb-2 inline-block"
            style={{ color: '#9090B0' }}
          >
            ← Back to session
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>
                {survey.title}
              </h1>
              <p className="text-xs" style={{ color: '#9090B0' }}>
                Answering as <strong style={{ color: '#E8447A' }}>{displayName}</strong>
              </p>
            </div>
            <span className="badge-glow">LIVE</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 fade-in-up">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: '#9090B0' }}>
            <span>{Object.keys(answers).length} of {survey.questions.length} answered</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(46, 46, 69, 0.6)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #E8447A, #FF6BA8)',
                boxShadow: '0 0 10px rgba(232,68,122,0.3)',
              }}
            />
          </div>
        </div>

        {error && (
          <div className="alert-error px-4 py-3 text-sm mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
          </div>
        )}

        {/* Questions */}
        <div className="flex flex-col gap-4 mb-6">
          {survey.questions.map((q, i) => (
            <QuestionRenderer
              key={i}
              question={q}
              index={i}
              value={(answers[i] as string | number) ?? null}
              onChange={handleAnswer}
              onScreenshotFile={handleScreenshotFile}
            />
          ))}
        </div>

        {/* OCR processing indicator */}
        {ocrProcessing && (
          <div className="glass p-4 mb-4 flex items-center gap-3 fade-in-up">
            <div className="liquid-spinner" style={{ width: 20, height: 20 }} />
            <span className="text-sm" style={{ color: '#9090B0' }}>
              Extracting screen time from screenshot…
            </span>
          </div>
        )}

        {/* OCR results display */}
        {Object.keys(ocrResults).length > 0 && (
          <div className="glass p-4 mb-4 fade-in-up">
            <p className="text-xs font-medium mb-2" style={{ color: '#E8447A' }}>
              📊 Extracted from screenshot
            </p>
            {Object.entries(ocrResults).map(([idx, text]) => {
              const extracted = extractScreenTime(text)
              return (
                <div key={idx} className="text-xs mb-1" style={{ color: '#9090B0' }}>
                  {extracted !== null
                    ? `Screen time: ${extracted} hours`
                    : 'Could not extract screen time automatically. The raw text has been saved.'}
                </div>
              )
            })}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || ocrProcessing}
          className="btn-liquid w-full py-3 text-base"
        >
          {submitting ? 'Submitting…' : 'Submit response'}
        </button>
      </div>
    </AppShell>
  )
}
