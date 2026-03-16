import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { fetchSessionSurveys, fetchSurveyResponses } from '@/hooks/useSurvey'
import { fetchSessionStudents } from '@/hooks/useSession'
import type { Survey, SurveyQuestion, SessionStudent } from '@/types'

interface DataRow {
  rowNum: number
  nickname: string
  sessionStudentId: string
  values: (string | number)[]
}

export default function DatasetView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { guestState } = useAuth()

  const isInstructor = location.pathname.startsWith('/instructor/')
  const basePath = isInstructor
    ? `/instructor/session/${sessionId}`
    : `/student/session/${sessionId}`

  const [allSurveys, setAllSurveys] = useState<Survey[]>([])
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [rows, setRows] = useState<DataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const myStudentId = guestState?.sessionStudentId ?? null

  const loadSurveyData = useCallback(async (targetSurvey: Survey) => {
    setSurvey(targetSurvey)
    setSortCol(null)

    const [responses, students] = await Promise.all([
      fetchSurveyResponses(targetSurvey.id),
      fetchSessionStudents(sessionId!),
    ])

    const studentMap = new Map<string, SessionStudent>()
    students.forEach((s) => studentMap.set(s.id, s))

    const dataRows: DataRow[] = responses.map((r, i) => {
      const student = studentMap.get(r.session_student_id)
      const values = targetSurvey.questions.map((q: SurveyQuestion, qi: number) => {
        const val = r.answers[qi]
        if (val === undefined || val === null) return '—'
        if (q.type === 'screenshot') {
          try {
            const parsed = JSON.parse(String(val))
            return parsed.extracted_value ?? parsed.ocr_text ?? 'uploaded'
          } catch {
            return typeof val === 'string' && val.length > 50 ? 'uploaded' : val
          }
        }
        return val
      })

      return {
        rowNum: i + 1,
        nickname: student?.nickname ?? `Student ${i + 1}`,
        sessionStudentId: r.session_student_id,
        values: values as (string | number)[],
      }
    })

    setRows(dataRows)
  }, [sessionId])

  const loadDataset = useCallback(async () => {
    if (!sessionId) return

    const surveys = await fetchSessionSurveys(sessionId)
    if (surveys.length === 0) { setLoading(false); return }

    setAllSurveys(surveys)
    await loadSurveyData(surveys[0])
    setLoading(false)
  }, [sessionId, loadSurveyData])

  useEffect(() => { loadDataset() }, [loadDataset])

  function downloadCSV() {
    if (!survey) return
    const headers = survey.questions.map((q) => q.label)
    const csvRows = [headers.join(',')]
    for (const row of rows) {
      const vals = row.values.map((v) => {
        const s = String(v)
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`
        }
        return s
      })
      csvRows.push(vals.join(','))
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${survey.title.replace(/\s+/g, '_')}_data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(colIdx)
      setSortDir('asc')
    }
  }

  const sortedRows = sortCol !== null
    ? [...rows].sort((a, b) => {
        const av = a.values[sortCol]
        const bv = b.values[sortCol]
        const numA = typeof av === 'number' ? av : parseFloat(String(av))
        const numB = typeof bv === 'number' ? bv : parseFloat(String(bv))

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : rows

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  if (!survey || rows.length === 0) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="glass p-8">
            <p className="text-lg mb-2" style={{ color: '#9090B0' }}>No dataset available</p>
            <p className="text-sm mb-4" style={{ color: '#9090B0' }}>
              The survey hasn't been completed yet.
            </p>
            <button
              onClick={() => navigate(`${basePath}`)}
              className="btn-ghost px-6 py-2.5"
            >
              ← Back to session
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // Column headers from survey questions
  const columns = survey.questions.map((q) => {
    // Shorten labels for table headers
    const label = q.label.length > 30 ? q.label.slice(0, 28) + '…' : q.label
    return label
  })

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-full overflow-x-auto">
        {/* Header */}
        <div className="mb-6 fade-in-up">
          <button
            onClick={() => navigate(`${basePath}`)}
            className="text-xs mb-2 inline-block"
            style={{ color: '#9090B0' }}
          >
            ← Back to session
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
                Dataset
              </h1>
              {allSurveys.length > 1 ? (
                <select
                  className="glass-select text-sm px-2 py-1 mt-1"
                  value={survey?.id ?? ''}
                  onChange={(e) => {
                    const s = allSurveys.find((sv) => sv.id === e.target.value)
                    if (s) loadSurveyData(s)
                  }}
                >
                  {allSurveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({rows.length} responses)
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm" style={{ color: '#9090B0' }}>
                  {survey.title} · {rows.length} responses
                </p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={downloadCSV}
                className="btn-ghost px-4 py-2 text-xs"
              >
                ⬇ Download CSV
              </button>
              <button
                onClick={() => navigate(`${basePath}/analysis`)}
                className="btn-liquid px-4 py-2 text-xs"
              >
                ✨ Analyse data
              </button>
              <span className="badge-glow">{rows.length} rows</span>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2 fade-in-up"
          style={{
            background: 'rgba(99, 91, 255, 0.06)',
            border: '1px solid rgba(99, 91, 255, 0.12)',
            color: '#A5B4FC',
          }}
        >
          <span>💡</span>
          Your row is highlighted in pink. All data is anonymised.
        </div>

        {/* Data table */}
        <div className="glass overflow-hidden fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(13, 13, 18, 0.5)' }}>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: '#9090B0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    #
                  </th>
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      onClick={() => handleSort(i)}
                      className="px-4 py-3 text-left text-xs font-medium cursor-pointer hover:text-white transition-colors"
                      style={{ color: '#9090B0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      title={survey.questions[i].label}
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        {sortCol === i && (
                          <span style={{ color: '#635BFF' }}>
                            {sortDir === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const isMe = row.sessionStudentId === myStudentId
                  return (
                    <tr
                      key={row.rowNum}
                      style={{
                        background: isMe
                          ? 'rgba(99, 91, 255, 0.08)'
                          : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9090B0' }}>
                        <span className="flex items-center gap-1.5">
                          {row.rowNum}
                          {isMe && (
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ background: '#635BFF' }}
                              title="Your response"
                            />
                          )}
                        </span>
                      </td>
                      {row.values.map((val, vi) => (
                        <td
                          key={vi}
                          className="px-4 py-3"
                          style={{ color: isMe ? '#F0F0F7' : '#9090B0' }}
                        >
                          {typeof val === 'number' ? val : String(val)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
