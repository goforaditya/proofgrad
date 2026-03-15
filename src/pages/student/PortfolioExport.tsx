import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { fetchSessionById } from '@/hooks/useSession'
import { fetchSessionSurveys, fetchSurveyResponses } from '@/hooks/useSurvey'
import { fetchAllLectureNotes } from '@/hooks/useLectureNotes'
import { buildDatasetColumns, computeStats, type DatasetColumn } from '@/hooks/useAnalysis'
import type { Session, LectureNote } from '@/types'

export default function PortfolioExport() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const portfolioRef = useRef<HTMLDivElement>(null)

  const [session, setSession] = useState<Session | null>(null)
  const [columns, setColumns] = useState<DatasetColumn[]>([])
  const [notes, setNotes] = useState<LectureNote[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // CTA Gate 2: require profile completion
  const needsProfile = user && !user.profile_completed

  const loadData = useCallback(async () => {
    if (!sessionId) return

    const [{ session: s }, surveys, allNotes] = await Promise.all([
      fetchSessionById(sessionId),
      fetchSessionSurveys(sessionId),
      fetchAllLectureNotes(sessionId),
    ])

    if (s) setSession(s)
    setNotes(allNotes)

    if (surveys.length > 0) {
      const latestSurvey = surveys[0]
      const responses = await fetchSurveyResponses(latestSurvey.id)
      const cols = buildDatasetColumns(latestSurvey.questions, responses)
      setColumns(cols)
    }

    setLoading(false)
  }, [sessionId])

  useEffect(() => { loadData() }, [loadData])

  async function handleExport() {
    if (!portfolioRef.current) return

    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(portfolioRef.current, {
        backgroundColor: '#0D0D12',
        scale: 2,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }

      const name = user?.name ?? 'student'
      const title = session?.title ?? 'session'
      pdf.save(`proofgrad-${name}-${title}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (needsProfile) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12 fade-in-up">
          <div className="glass-strong p-8 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
              Complete your profile
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
              Finish your profile to export your portfolio as a PDF.
            </p>
            <button
              onClick={() => navigate('/auth/complete-profile')}
              className="btn-liquid px-6 py-3 w-full mb-3"
            >
              Complete profile
            </button>
            <button
              onClick={() => navigate(`/student/session/${sessionId}`)}
              className="btn-ghost px-6 py-2.5 w-full"
            >
              ← Back to session
            </button>
          </div>
        </div>
      </AppShell>
    )
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

  const numericCols = columns.filter((c) => c.type === 'numeric')

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 fade-in-up">
          <button
            onClick={() => navigate(`/student/session/${sessionId}`)}
            className="text-xs mb-2 inline-block"
            style={{ color: '#9090B0' }}
          >
            ← Back to session
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
              Portfolio Export
            </h1>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-liquid px-5 py-2 text-sm"
            >
              {exporting ? 'Generating PDF…' : '📥 Download PDF'}
            </button>
          </div>
        </div>

        {/* Portfolio preview */}
        <div ref={portfolioRef} className="space-y-6">
          {/* Header card */}
          <div className="glass p-6 fade-in-up">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #635BFF, #4F46E5)', color: '#fff' }}
              >
                {(user?.name ?? 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>
                  {user?.name ?? 'Student'}
                </h2>
                <p className="text-sm" style={{ color: '#9090B0' }}>
                  {user?.email} · {user?.year_of_study ?? ''} · {user?.accommodation === 'hostel' ? 'Hostelite' : 'Day Scholar'}
                </p>
              </div>
            </div>
            <div className="text-sm" style={{ color: '#9090B0' }}>
              <strong style={{ color: '#F0F0F7' }}>{session?.title ?? 'Session'}</strong>
              <span className="mx-2">·</span>
              Proofgrad Portfolio
            </div>
          </div>

          {/* Dataset summary */}
          {numericCols.length > 0 && (
            <div className="glass p-6 fade-in-up">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0F0F7' }}>
                📊 Dataset Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {numericCols.map((col) => {
                  const stats = computeStats(col.values as number[])
                  return (
                    <div
                      key={col.index}
                      className="rounded-xl p-3"
                      style={{ background: 'rgba(99, 91, 255, 0.04)', border: '1px solid rgba(99, 91, 255, 0.08)' }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: '#635BFF' }}>
                        {col.label}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: '#9090B0' }}>
                        <span>Mean: <strong style={{ color: '#F0F0F7' }}>{stats.mean.toFixed(1)}</strong></span>
                        <span>Median: <strong style={{ color: '#F0F0F7' }}>{stats.median.toFixed(1)}</strong></span>
                        <span>Std Dev: <strong style={{ color: '#F0F0F7' }}>{stats.stdDev.toFixed(1)}</strong></span>
                        <span>Range: <strong style={{ color: '#F0F0F7' }}>{stats.min}–{stats.max}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lecture notes */}
          {notes.length > 0 && (
            <div className="glass p-6 fade-in-up">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#F0F0F7' }}>
                📝 Lecture Notes
              </h3>
              <div className="space-y-4">
                {notes.map((n) => (
                  <div key={n.id}>
                    <div className="text-xs font-medium mb-1" style={{ color: '#635BFF' }}>
                      {n.phase.charAt(0).toUpperCase() + n.phase.slice(1)} Phase
                    </div>
                    {n.content.concept && (
                      <p className="text-sm mb-1" style={{ color: '#F0F0F7' }}>{n.content.concept}</p>
                    )}
                    {n.content.formula && (
                      <p className="text-xs font-mono mb-1" style={{ color: '#A5B4FC' }}>{n.content.formula}</p>
                    )}
                    {n.content.task && (
                      <p className="text-xs" style={{ color: '#9090B0' }}>Task: {n.content.task}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-xs" style={{ color: '#9090B0' }}>
              Generated by Proofgrad · {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
