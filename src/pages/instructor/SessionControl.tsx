import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import AppShell from '@/components/layout/AppShell'
import QuestionBuilder from '@/components/survey/QuestionBuilder'
import {
  fetchSessionById,
  fetchSessionStudents,
  startSession,
  endSession,
} from '@/hooks/useSession'
import {
  createSurvey,
  fetchSessionSurveys,
  fetchSurveyResponses,
  activateSurvey,
  deactivateSurvey,
  getResponseCount,
  importCSVData,
  deleteSurvey,
} from '@/hooks/useSurvey'
import {
  buildDatasetColumns,
  generateLocalSuggestions,
  computeStats,
  computeLinearRegression,
  buildHistogramBins,
  buildCategoryCount,
  type DatasetColumn,
} from '@/hooks/useAnalysis'
import { broadcastSessionEvent, subscribeToResponseCount } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import type { Session, SessionStudent, Survey, SurveyQuestion, AnalysisSuggestion, ChartType } from '@/types'

// Chart components
import HistogramChart from '@/components/analysis/HistogramChart'
import BarChartView from '@/components/analysis/BarChartView'
import ScatterChartView from '@/components/analysis/ScatterChart'
import PieChartView from '@/components/analysis/PieChartView'
import LineChartView from '@/components/analysis/LineChartView'
import DemandCurve from '@/components/analysis/DemandCurve'
import ChartCard from '@/components/analysis/ChartCard'

type Tab = 'students' | 'surveys' | 'data' | 'analytics'

const STATUS_LABELS: Record<string, string> = {
  lobby: 'Lobby',
  active: 'Live',
  ended: 'Ended',
}

const TAB_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: 'students', label: 'Students', icon: '👥' },
  { key: 'surveys', label: 'Surveys', icon: '📋' },
  { key: 'data', label: 'Data', icon: '📊' },
  { key: 'analytics', label: 'Analytics', icon: '✨' },
]

const DEFAULT_QUESTION: SurveyQuestion = { type: 'number', label: '' }

interface ActiveChart {
  id: string
  chartType: ChartType
  title: string
  xField: string
  yField?: string
}

interface DataRow {
  rowNum: number
  nickname: string
  sessionStudentId: string
  values: (string | number)[]
}

const CHART_ICONS: Record<ChartType, string> = {
  histogram: '📊',
  bar: '📈',
  scatter: '⚬',
  pie: '🥧',
  line: '📉',
  demand: '💰',
}

export default function SessionControl() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  // Core state
  const [session, setSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<SessionStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const [showQR, setShowQR] = useState(false)

  // Survey state
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [surveyTitle, setSurveyTitle] = useState('Screen Time & Attention Economy Survey')
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    // Section 1: Demographics
    { type: 'number', label: 'Age', helpText: 'Enter your age in years (e.g., 20).', min: 16, max: 30, section: 'Demographics & Human Capital Constraints' },
    { type: 'mcq', label: 'Gender at Birth', options: ['Female', 'Male', 'Prefer not to say'] },
    { type: 'mcq', label: 'Current Semester', options: ['1st', '2nd', '3rd', '4th', '5th', '6th'] },
    { type: 'mcq', label: 'Living Situation', options: ['Hostel Resident', 'Day Scholar (Commuter)'] },
    { type: 'number', label: 'Current CGPA', helpText: 'Enter your current CGPA on a 10-point scale (e.g., 8.2).', min: 0, max: 10, step: 0.1 },
    { type: 'number', label: 'Average Nightly Sleep (hours)', helpText: 'On average, how many hours do you sleep per night? Use decimals if needed (e.g., 6.5).', min: 2, max: 14, step: 0.5 },
    // Section 2: Attention Economy
    { type: 'mcq', label: 'Primary Device Operating System', options: ['iOS (iPhone)', 'Android', 'Other'], section: 'The Attention Economy (Device Analytics)' },
    { type: 'time', label: 'Total Screen Time Yesterday', helpText: "Open your phone's Screen Time (iOS) or Digital Wellbeing (Android) and enter your total screen time for yesterday." },
    { type: 'number', label: 'Total Device Pickups / Times Unlocked', helpText: 'How many times did you pick up or unlock your phone yesterday?', min: 0 },
    { type: 'number', label: 'Total Notifications Received', helpText: 'How many total notifications did you receive yesterday?', min: 0 },
    // Section 3: App-Level Utility
    { type: 'text', label: 'Top App #1 (Most Used)', helpText: 'Name of the app (e.g., Instagram, YouTube, WhatsApp).', section: 'App-Level Utility' },
    { type: 'number', label: 'Time Spent on Top App #1 (minutes)', helpText: 'Convert the time to total minutes (e.g., 1 hour 15 mins = 75).', min: 0 },
    { type: 'text', label: 'Top App #2', helpText: 'Name of the second most used app.' },
    { type: 'number', label: 'Time Spent on Top App #2 (minutes)', min: 0 },
    { type: 'text', label: 'Top App #3', helpText: 'Name of the third most used app.' },
    { type: 'number', label: 'Time Spent on Top App #3 (minutes)', min: 0 },
    { type: 'text', label: 'Top App #4', helpText: 'Name of the fourth most used app.' },
    { type: 'number', label: 'Time Spent on Top App #4 (minutes)', min: 0 },
  ])
  const [creating, setCreating] = useState(false)
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)
  const [responseCount, setResponseCount] = useState(0)
  const [launching, setLaunching] = useState(false)
  const [closing, setClosing] = useState(false)
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Data tab state
  const [dataSurvey, setDataSurvey] = useState<Survey | null>(null)
  const [dataRows, setDataRows] = useState<DataRow[]>([])
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [dataLoading, setDataLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analytics tab state
  const [analysisSurvey, setAnalysisSurvey] = useState<Survey | null>(null)
  const [columns, setColumns] = useState<DatasetColumn[]>([])
  const [suggestions, setSuggestions] = useState<AnalysisSuggestion[]>([])
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([])
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [customType, setCustomType] = useState<ChartType>('histogram')
  const [customX, setCustomX] = useState('')
  const [customY, setCustomY] = useState('')
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const joinUrl = session
    ? `${window.location.origin}/join?code=${session.join_code}`
    : ''

  // ---- Load core data ----
  const loadData = useCallback(async () => {
    if (!sessionId) return
    const { session: s, error: err } = await fetchSessionById(sessionId)
    if (err || !s) { setError(err ?? 'Session not found'); setLoading(false); return }
    setSession(s)

    const [stu, survs] = await Promise.all([
      fetchSessionStudents(sessionId),
      fetchSessionSurveys(sessionId),
    ])
    setStudents(stu)
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

  // Realtime: new students
  useEffect(() => {
    if (!sessionId) return
    const channel = supabase
      .channel(`session_students_${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_students',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setStudents((prev) => [...prev, payload.new as SessionStudent])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Realtime: response counter
  useEffect(() => {
    if (!activeSurvey) return
    const unsub = subscribeToResponseCount(activeSurvey.id, (count) => {
      setResponseCount(count)
    })
    return unsub
  }, [activeSurvey])

  // ---- Session controls ----
  async function handleStart() {
    if (!session || acting) return
    setActing(true)
    const { error: err } = await startSession(session.id)
    if (err) { setError(err); setActing(false); return }
    await broadcastSessionEvent(session.id, { type: 'phase_change', phase: 'active' })
    setSession((s) => s ? { ...s, phase: 'active' } : null)
    setActing(false)
  }

  async function handleEnd() {
    if (!session || acting) return
    setActing(true)
    const { error: err } = await endSession(session.id)
    if (err) { setError(err); setActing(false); return }
    await broadcastSessionEvent(session.id, { type: 'phase_change', phase: 'ended' })
    setSession((s) => s ? { ...s, phase: 'ended', status: 'ended' } : null)
    setActing(false)
  }

  // ---- Survey CRUD ----
  function addQuestion() { setQuestions((q) => [...q, { ...DEFAULT_QUESTION }]) }
  function updateQuestion(idx: number, updated: SurveyQuestion) {
    setQuestions((q) => q.map((qq, i) => (i === idx ? updated : qq)))
  }
  function removeQuestion(idx: number) { setQuestions((q) => q.filter((_, i) => i !== idx)) }
  function moveQuestion(from: number, to: number) {
    setQuestions((q) => {
      const arr = [...q]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr
    })
  }

  async function handleCreateSurvey() {
    if (!sessionId || !surveyTitle.trim() || questions.length === 0) return
    const invalid = questions.find((q) => !q.label.trim())
    if (invalid) { setError('All questions must have a label.'); return }
    setCreating(true); setError(null)
    const { survey, error: err } = await createSurvey(sessionId, surveyTitle.trim(), questions)
    if (err || !survey) { setError(err ?? 'Failed to create survey'); setCreating(false); return }
    setSurveys((s) => [survey, ...s])
    setShowBuilder(false)
    setCreating(false)
  }

  async function handleLaunchSurvey(survey: Survey) {
    if (!session) return
    setLaunching(true); setError(null)
    const { error: err } = await activateSurvey(survey.id)
    if (err) { setError(err); setLaunching(false); return }
    await broadcastSessionEvent(session.id, { type: 'survey_launched', surveyId: survey.id })
    setActiveSurvey({ ...survey, is_active: true })
    setResponseCount(0)
    setLaunching(false)
  }

  async function handleCloseSurvey() {
    if (!activeSurvey || !session) return
    setClosing(true)
    const { error: err } = await deactivateSurvey(activeSurvey.id)
    if (err) { setError(err); setClosing(false); return }
    setActiveSurvey(null)
    setClosing(false)
  }

  async function handleDeleteSurvey(surveyId: string) {
    setDeletingSurveyId(surveyId)
    setError(null)
    const { error: err } = await deleteSurvey(surveyId)
    if (err) { setError(err); setDeletingSurveyId(null); setConfirmDeleteId(null); return }
    setSurveys((prev) => prev.filter((s) => s.id !== surveyId))
    if (dataSurvey?.id === surveyId) { setDataSurvey(null); setDataRows([]) }
    if (analysisSurvey?.id === surveyId) { setAnalysisSurvey(null); setColumns([]); setActiveCharts([]) }
    setDeletingSurveyId(null)
    setConfirmDeleteId(null)
  }

  // ---- Data tab ----
  const loadSurveyData = useCallback(async (targetSurvey: Survey) => {
    setDataLoading(true)
    setDataSurvey(targetSurvey)
    setSortCol(null)

    const [responses, studs] = await Promise.all([
      fetchSurveyResponses(targetSurvey.id),
      fetchSessionStudents(sessionId!),
    ])

    const studentMap = new Map(studs.map((s) => [s.id, s]))
    const rows: DataRow[] = responses.map((r, i) => {
      const student = studentMap.get(r.session_student_id)
      const values = targetSurvey.questions.map((q: SurveyQuestion, qi: number) => {
        const val = r.answers[qi]
        if (val === undefined || val === null) return '—'
        if (q.type === 'screenshot') {
          try {
            const parsed = JSON.parse(String(val))
            return parsed.extracted_value ?? parsed.ocr_text ?? 'uploaded'
          } catch { return typeof val === 'string' && val.length > 50 ? 'uploaded' : val }
        }
        return val
      })
      return { rowNum: i + 1, nickname: student?.nickname ?? `Student ${i + 1}`, sessionStudentId: r.session_student_id, values: values as (string | number)[] }
    })

    setDataRows(rows)
    setDataLoading(false)
  }, [sessionId])

  // Load data tab when switching to it
  useEffect(() => {
    if (activeTab === 'data' && surveys.length > 0 && !dataSurvey) {
      loadSurveyData(surveys[0])
    }
  }, [activeTab, surveys, dataSurvey, loadSurveyData])

  function downloadCSV() {
    if (!dataSurvey) return
    const headers = dataSurvey.questions.map((q) => q.label)
    const csvRows = [headers.join(',')]
    for (const row of dataRows) {
      const vals = row.values.map((v) => {
        const s = String(v)
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
        return s
      })
      csvRows.push(vals.join(','))
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataSurvey.title.replace(/\s+/g, '_')}_data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !sessionId) return
    setImporting(true); setError(null)
    try {
      const text = await file.text()
      const { survey, error: err } = await importCSVData(sessionId, text, file.name.replace(/\.csv$/i, ''))
      if (err) { setError(err); setImporting(false); return }
      if (survey) {
        setSurveys((prev) => [survey, ...prev])
        await loadSurveyData(survey)
      }
    } catch {
      setError('Failed to parse CSV file.')
    }
    setImporting(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(colIdx); setSortDir('asc') }
  }

  const sortedRows = sortCol !== null
    ? [...dataRows].sort((a, b) => {
        const av = a.values[sortCol]; const bv = b.values[sortCol]
        const numA = typeof av === 'number' ? av : parseFloat(String(av))
        const numB = typeof bv === 'number' ? bv : parseFloat(String(bv))
        if (!isNaN(numA) && !isNaN(numB)) return sortDir === 'asc' ? numA - numB : numB - numA
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    : dataRows

  // ---- Analytics tab ----
  const loadAnalytics = useCallback(async (targetSurvey: Survey) => {
    setAnalyticsLoading(true)
    setAnalysisSurvey(targetSurvey)
    setActiveCharts([])

    const responses = await fetchSurveyResponses(targetSurvey.id)
    const cols = buildDatasetColumns(targetSurvey.questions, responses)
    setColumns(cols)
    setSuggestions(generateLocalSuggestions(cols))
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'analytics' && surveys.length > 0 && !analysisSurvey) {
      loadAnalytics(surveys[0])
    }
  }, [activeTab, surveys, analysisSurvey, loadAnalytics])

  function getColumn(label: string) { return columns.find((c) => c.label === label) }

  function addChart(s: AnalysisSuggestion) {
    setActiveCharts((prev) => [...prev, {
      id: `${s.chartType}-${s.xField}-${Date.now()}`,
      chartType: s.chartType, title: s.title, xField: s.xField ?? '', yField: s.yField,
    }])
  }

  function addCustomChart() {
    if (!customX) return
    const title = customType === 'scatter' && customY
      ? `${customX} vs ${customY}`
      : `${customType.charAt(0).toUpperCase() + customType.slice(1)} of ${customX}`
    addChart({ chartType: customType, title, description: '', xField: customX, yField: customY || undefined })
    setShowChartBuilder(false); setCustomX(''); setCustomY('')
  }

  function removeChart(id: string) { setActiveCharts((prev) => prev.filter((c) => c.id !== id)) }

  function getChartDataForInterpretation(chart: ActiveChart): Record<string, unknown>[] {
    const col = getColumn(chart.xField)
    if (!col) return []
    if (chart.chartType === 'histogram') return buildHistogramBins(col.values as number[]) as Record<string, unknown>[]
    if (['bar', 'pie', 'line'].includes(chart.chartType)) return buildCategoryCount(col.values) as Record<string, unknown>[]
    return []
  }

  function getChartStats(chart: ActiveChart) {
    const col = getColumn(chart.xField)
    if (!col) return undefined
    if (chart.chartType === 'histogram' && col.type === 'numeric') {
      const stats = computeStats(col.values as number[])
      return { mean: stats.mean, median: stats.median }
    }
    if (chart.chartType === 'scatter' && chart.yField) {
      const yCol = getColumn(chart.yField)
      if (yCol && col.type === 'numeric' && yCol.type === 'numeric') {
        const reg = computeLinearRegression(col.values as number[], yCol.values as number[])
        return { r: reg.r, rSquared: reg.rSquared }
      }
    }
    return undefined
  }

  // ---- Loading / Error ----
  if (loading) {
    return (
      <AppShell showSidebar>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  if (error && !session) {
    return (
      <AppShell showSidebar>
        <div className="text-center py-20">
          <p style={{ color: '#818CF8' }}>{error}</p>
          <button onClick={() => navigate('/instructor/dashboard')} className="mt-4 text-sm underline" style={{ color: '#635BFF' }}>
            Back to dashboard
          </button>
        </div>
      </AppShell>
    )
  }

  if (!session) return null

  const isEnded = session.phase === 'ended'
  const isLobby = session.phase === 'lobby'
  const isActive = session.phase === 'active'

  return (
    <AppShell showSidebar fullWidth>
      <div className="flex flex-col h-full min-h-0">
        {/* ===== Top bar ===== */}
        <div className="flex-shrink-0 px-6 pt-5 pb-0 fade-in-up">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <button
                onClick={() => navigate('/instructor/dashboard')}
                className="text-xs mb-2 inline-block"
                style={{ color: '#9090B0' }}
              >
                ← Back to dashboard
              </button>
              <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
                {session.title}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: '#9090B0' }}>
                <span className={isEnded ? 'badge-muted' : isActive ? 'badge-glow' : 'badge-muted'}>
                  {STATUS_LABELS[session.phase] ?? session.phase}
                </span>
                <span className="font-mono text-sm tracking-widest font-bold glow-text cursor-pointer" onClick={() => navigator.clipboard.writeText(session.join_code)} title="Click to copy">
                  {session.join_code}
                </span>
                <button onClick={() => setShowQR(!showQR)} className="text-xs underline" style={{ color: '#635BFF' }}>
                  {showQR ? 'Hide QR' : 'Show QR'}
                </button>
                <span className="text-xs">{students.length} student{students.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {isLobby && (
                <button onClick={handleStart} disabled={acting} className="btn-liquid px-5 py-2 text-sm">
                  {acting ? 'Starting…' : '🚀 Start Session'}
                </button>
              )}
              {isActive && (
                <button onClick={handleEnd} disabled={acting} className="btn-liquid px-5 py-2 text-sm" style={{ background: 'linear-gradient(135deg, #4F46E5, #8B1A3E)' }}>
                  {acting ? 'Ending…' : 'End session'}
                </button>
              )}
            </div>
          </div>

          {/* QR Code (collapsible) */}
          {showQR && (
            <div className="mb-4 flex items-center gap-4 fade-in-up">
              <div className="qr-card inline-block">
                <QRCodeSVG value={joinUrl} size={140} level="M" />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9090B0' }}>Join link</p>
                <p className="text-xs font-mono mb-2" style={{ color: '#F0F0F7' }}>{joinUrl}</p>
                <button onClick={() => navigator.clipboard.writeText(joinUrl)} className="btn-ghost text-xs px-3 py-1">
                  Copy link
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="alert-error px-4 py-3 text-sm mb-4">
              {error}
              <button onClick={() => setError(null)} className="ml-2 font-bold">✕</button>
            </div>
          )}

          {/* ===== Tab bar ===== */}
          <div className="flex border-b" style={{ borderColor: '#2E2E45' }}>
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.key ? '#F0F0F7' : '#9090B0',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span>{tab.icon}</span>
                  {tab.label}
                </span>
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, #E8447A, #635BFF)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Tab content ===== */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ----- Students Tab ----- */}
          {activeTab === 'students' && (
            <div className="fade-in-up">
              {students.length === 0 ? (
                <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
                  <p className="text-lg mb-2" style={{ color: '#9090B0' }}>Waiting for students to join…</p>
                  <p className="text-sm" style={{ color: '#9090B0' }}>Share the join code or display the QR code on screen.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {students.map((s) => (
                    <div key={s.id} className="glass flex items-center gap-3 px-4 py-3 fade-in-up">
                      <div className="avatar-glow w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                        {s.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#F0F0F7' }}>{s.nickname}</div>
                        <div className="text-xs" style={{ color: '#9090B0' }}>{s.is_guest ? 'Guest' : 'Registered'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----- Surveys Tab ----- */}
          {activeTab === 'surveys' && (
            <div className="max-w-3xl fade-in-up">
              {/* Active survey card */}
              {activeSurvey && (
                <div className="glass-strong p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-glow">LIVE</span>
                        <h2 className="text-lg font-bold" style={{ color: '#F0F0F7' }}>{activeSurvey.title}</h2>
                      </div>
                      <p className="text-sm" style={{ color: '#9090B0' }}>{activeSurvey.questions.length} questions</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 mb-4 text-center" style={{ background: 'rgba(99, 91, 255, 0.06)', border: '1px solid rgba(232,68,122,0.12)' }}>
                    <div className="text-4xl font-bold mb-1 glow-text">{responseCount}</div>
                    <div className="text-xs" style={{ color: '#9090B0' }}>responses received</div>
                  </div>
                  <button onClick={handleCloseSurvey} disabled={closing} className="btn-liquid w-full py-2.5" style={{ background: 'linear-gradient(135deg, #4F46E5, #8B1A3E)' }}>
                    {closing ? 'Closing…' : 'Close survey'}
                  </button>
                </div>
              )}

              {/* Survey builder */}
              {showBuilder && (
                <div className="mb-6">
                  <div className="glass-strong p-6 mb-4">
                    <h2 className="text-lg font-bold mb-4" style={{ color: '#F0F0F7' }}>Build your survey</h2>
                    <div className="mb-4">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>SURVEY TITLE</label>
                      <input type="text" value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="e.g. Screen Time Survey" className="glass-input w-full px-4 py-2.5 text-sm" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mb-4">
                    {questions.map((q, i) => (
                      <QuestionBuilder
                        key={i} question={q} index={i}
                        onChange={updateQuestion} onRemove={removeQuestion}
                        onMoveUp={i > 0 ? () => moveQuestion(i, i - 1) : undefined}
                        onMoveDown={i < questions.length - 1 ? () => moveQuestion(i, i + 1) : undefined}
                      />
                    ))}
                  </div>
                  <button onClick={addQuestion} className="btn-ghost w-full py-3 text-sm mb-4">+ Add question</button>
                  <div className="flex gap-3">
                    <button onClick={() => setShowBuilder(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                    <button onClick={handleCreateSurvey} disabled={creating || !surveyTitle.trim() || questions.length === 0} className="btn-liquid flex-1 py-2.5">
                      {creating ? 'Creating…' : 'Save survey'}
                    </button>
                  </div>
                </div>
              )}

              {/* Header + new survey button */}
              {!showBuilder && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#F0F0F7' }}>Surveys</h2>
                  <button onClick={() => setShowBuilder(true)} className="btn-liquid px-4 py-2 text-sm">+ New survey</button>
                </div>
              )}

              {/* Saved surveys list */}
              {!showBuilder && (() => {
                const otherSurveys = surveys.filter((sv) => sv.id !== activeSurvey?.id)
                return (
                <div className="flex flex-col gap-3">
                  {otherSurveys.length === 0 ? (
                    <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
                      <p className="text-sm" style={{ color: '#9090B0' }}>
                        {surveys.length === 0 ? 'No surveys yet. Create one to collect data.' : 'No other surveys.'}
                      </p>
                    </div>
                  ) : (
                    otherSurveys.map((sv) => (
                      <div key={sv.id} className="glass p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: '#F0F0F7' }}>{sv.title}</h3>
                          <p className="text-xs" style={{ color: '#9090B0' }}>
                            {sv.questions.length} questions · Created {new Date(sv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDataSurvey(null); setActiveTab('data'); setTimeout(() => loadSurveyData(sv), 0) }}
                            className="btn-ghost px-3 py-1.5 text-xs"
                          >
                            View data
                          </button>
                          {!activeSurvey && (
                            <button onClick={() => handleLaunchSurvey(sv)} disabled={launching} className="btn-liquid px-4 py-1.5 text-xs">
                              {launching ? 'Launching…' : 'Launch'}
                            </button>
                          )}
                          {confirmDeleteId === sv.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDeleteSurvey(sv.id)}
                                disabled={deletingSurveyId === sv.id}
                                className="px-3 py-1.5 text-xs rounded-lg font-medium"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                              >
                                {deletingSurveyId === sv.id ? 'Deleting…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn-ghost px-2 py-1.5 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(sv.id)}
                              className="px-2 py-1.5 text-xs rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                              style={{ color: '#9090B0' }}
                              title="Delete survey and all responses"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                )
              })()}
            </div>
          )}

          {/* ----- Data Tab ----- */}
          {activeTab === 'data' && (
            <div className="fade-in-up">
              {/* Header controls */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  {surveys.length > 1 ? (
                    <select
                      className="glass-select text-sm px-3 py-2"
                      value={dataSurvey?.id ?? ''}
                      onChange={(e) => {
                        const s = surveys.find((sv) => sv.id === e.target.value)
                        if (s) loadSurveyData(s)
                      }}
                    >
                      {surveys.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  ) : dataSurvey ? (
                    <p className="text-sm" style={{ color: '#9090B0' }}>
                      {dataSurvey.title} · {dataRows.length} responses
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2 items-center">
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVImport} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="btn-ghost px-4 py-2 text-xs"
                  >
                    {importing ? 'Importing…' : '⬆ Import CSV'}
                  </button>
                  {dataSurvey && dataRows.length > 0 && (
                    <button onClick={downloadCSV} className="btn-ghost px-4 py-2 text-xs">⬇ Download CSV</button>
                  )}
                  {dataSurvey && dataRows.length > 0 && (
                    <button
                      onClick={() => {
                        setAnalysisSurvey(null)
                        setActiveTab('analytics')
                        setTimeout(() => loadAnalytics(dataSurvey), 0)
                      }}
                      className="btn-liquid px-4 py-2 text-xs"
                    >
                      ✨ Analyse data
                    </button>
                  )}
                  {dataRows.length > 0 && <span className="badge-glow">{dataRows.length} rows</span>}
                </div>
              </div>

              {/* Data table */}
              {dataLoading ? (
                <div className="flex justify-center py-12"><div className="liquid-spinner" /></div>
              ) : !dataSurvey || dataRows.length === 0 ? (
                <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
                  <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No data yet</p>
                  <p className="text-sm" style={{ color: '#9090B0' }}>
                    Launch a survey to collect responses, or import a CSV file.
                  </p>
                </div>
              ) : (
                <div className="glass overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'rgba(13, 13, 18, 0.5)' }}>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#9090B0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#9090B0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Nickname</th>
                          {dataSurvey.questions.map((q, i) => (
                            <th
                              key={i}
                              onClick={() => handleSort(i)}
                              className="px-4 py-3 text-left text-xs font-medium cursor-pointer hover:text-white transition-colors"
                              style={{ color: '#9090B0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                              title={q.label}
                            >
                              <span className="flex items-center gap-1">
                                {q.label.length > 30 ? q.label.slice(0, 28) + '…' : q.label}
                                {sortCol === i && <span style={{ color: '#635BFF' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map((row) => (
                          <tr key={row.rowNum} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9090B0' }}>{row.rowNum}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#F0F0F7' }}>{row.nickname}</td>
                            {row.values.map((val, vi) => (
                              <td key={vi} className="px-4 py-3" style={{ color: '#9090B0' }}>
                                {typeof val === 'number' ? val : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----- Analytics Tab ----- */}
          {activeTab === 'analytics' && (
            <div className="fade-in-up max-w-7xl">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                  {surveys.length > 1 ? (
                    <select
                      className="glass-select text-sm px-3 py-2"
                      value={analysisSurvey?.id ?? ''}
                      onChange={(e) => {
                        const s = surveys.find((sv) => sv.id === e.target.value)
                        if (s) loadAnalytics(s)
                      }}
                    >
                      {surveys.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  ) : analysisSurvey ? (
                    <p className="text-sm" style={{ color: '#9090B0' }}>
                      {analysisSurvey.title} · {columns.length} variables · {columns[0]?.values.length ?? 0} responses
                    </p>
                  ) : null}
                </div>
                <button onClick={() => setShowChartBuilder(!showChartBuilder)} className="btn-liquid px-4 py-2 text-xs">
                  + New chart
                </button>
              </div>

              {analyticsLoading ? (
                <div className="flex justify-center py-12"><div className="liquid-spinner" /></div>
              ) : !analysisSurvey || columns.length === 0 ? (
                <div className="glass p-8 text-center" style={{ borderStyle: 'dashed' }}>
                  <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No data to analyse</p>
                  <p className="text-sm" style={{ color: '#9090B0' }}>Collect survey responses or import CSV data first.</p>
                </div>
              ) : (
                <>
                  {/* Custom chart builder */}
                  {showChartBuilder && (
                    <div className="glass p-5 mb-6">
                      <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0F0F7' }}>Build a chart</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>Chart type</label>
                          <select className="glass-select w-full px-3 py-2 text-sm" value={customType} onChange={(e) => setCustomType(e.target.value as ChartType)}>
                            <option value="histogram">Histogram</option>
                            <option value="bar">Bar chart</option>
                            <option value="scatter">Scatter plot</option>
                            <option value="pie">Pie chart</option>
                            <option value="line">Line chart</option>
                            <option value="demand">Demand curve</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>{customType === 'scatter' ? 'X variable' : 'Variable'}</label>
                          <select className="glass-select w-full px-3 py-2 text-sm" value={customX} onChange={(e) => setCustomX(e.target.value)}>
                            <option value="">Select…</option>
                            {columns.map((c) => <option key={c.index} value={c.label}>{c.label} ({c.type})</option>)}
                          </select>
                        </div>
                        {customType === 'scatter' && (
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>Y variable</label>
                            <select className="glass-select w-full px-3 py-2 text-sm" value={customY} onChange={(e) => setCustomY(e.target.value)}>
                              <option value="">Select…</option>
                              {columns.filter((c) => c.label !== customX).map((c) => <option key={c.index} value={c.label}>{c.label} ({c.type})</option>)}
                            </select>
                          </div>
                        )}
                        <div className="flex items-end">
                          <button onClick={addCustomChart} disabled={!customX || (customType === 'scatter' && !customY)} className="btn-liquid px-4 py-2 text-sm w-full">
                            Add chart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {activeCharts.length === 0 && suggestions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#9090B0' }}>Suggested analyses</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {suggestions.map((s, i) => (
                          <button key={i} onClick={() => addChart(s)} className="glass p-4 text-left hover:border-[rgba(232,68,122,0.3)] transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{CHART_ICONS[s.chartType]}</span>
                              <span className="text-xs font-semibold" style={{ color: '#F0F0F7' }}>{s.title}</span>
                            </div>
                            <p className="text-xs" style={{ color: '#9090B0' }}>{s.description}</p>
                            <span className="text-[10px] mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#635BFF' }}>Click to generate →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active charts */}
                  {activeCharts.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                        {suggestions.filter((s) => !activeCharts.some((c) => c.xField === s.xField && c.chartType === s.chartType)).map((s, i) => (
                          <button key={i} onClick={() => addChart(s)} className="badge-glow text-xs px-3 py-1 cursor-pointer hover:bg-[rgba(232,68,122,0.2)] transition-colors">
                            {CHART_ICONS[s.chartType]} {s.title}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeCharts.map((chart) => {
                          const col = getColumn(chart.xField)
                          if (!col) return null
                          return (
                            <div key={chart.id} className="relative">
                              <button onClick={() => removeChart(chart.id)} className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: 'rgba(46,46,69,0.6)', color: '#9090B0' }} title="Remove chart">✕</button>
                              <ChartCard title={chart.title} chartType={chart.chartType} chartData={getChartDataForInterpretation(chart)} stats={getChartStats(chart)}>
                                {chart.chartType === 'histogram' && col.type === 'numeric' && <HistogramChart values={col.values as number[]} label={col.label} />}
                                {chart.chartType === 'bar' && <BarChartView values={col.values} label={col.label} />}
                                {chart.chartType === 'scatter' && chart.yField && (() => {
                                  const yCol = getColumn(chart.yField!)
                                  if (!yCol) return <p style={{ color: '#9090B0' }}>Y column not found</p>
                                  return <ScatterChartView xValues={col.values as number[]} yValues={yCol.values as number[]} xLabel={col.label} yLabel={yCol.label} />
                                })()}
                                {chart.chartType === 'pie' && <PieChartView values={col.values} label={col.label} />}
                                {chart.chartType === 'line' && <LineChartView values={col.values} label={col.label} />}
                                {chart.chartType === 'demand' && col.type === 'numeric' && <DemandCurve priceValues={col.values as number[]} label={col.label} />}
                              </ChartCard>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {activeCharts.length === 0 && suggestions.length === 0 && (
                    <div className="glass p-12 text-center">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F0F7' }}>Start analysing</h3>
                      <p className="text-sm" style={{ color: '#9090B0' }}>Click "+ New chart" to build your first visualisation.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
