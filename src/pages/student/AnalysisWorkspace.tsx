import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth'
import { fetchSessionSurveys, fetchSurveyResponses } from '@/hooks/useSurvey'
import {
  buildDatasetColumns,
  generateLocalSuggestions,
  computeStats,
  computeLinearRegression,
  buildHistogramBins,
  buildCategoryCount,
  type DatasetColumn,
} from '@/hooks/useAnalysis'
import type { Survey, AnalysisSuggestion, ChartType } from '@/types'

// Chart components
import HistogramChart from '@/components/analysis/HistogramChart'
import BarChartView from '@/components/analysis/BarChartView'
import ScatterChartView from '@/components/analysis/ScatterChart'
import PieChartView from '@/components/analysis/PieChartView'
import LineChartView from '@/components/analysis/LineChartView'
import DemandCurve from '@/components/analysis/DemandCurve'
import ChartCard from '@/components/analysis/ChartCard'

interface ActiveChart {
  id: string
  chartType: ChartType
  title: string
  xField: string
  yField?: string
}

const CHART_ICONS: Record<ChartType, string> = {
  histogram: '📊',
  bar: '📈',
  scatter: '⚬',
  pie: '🥧',
  line: '📉',
  demand: '💰',
}

export default function AnalysisWorkspace() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, guestState, loading: authLoading } = useAuth()

  const isInstructor = location.pathname.startsWith('/instructor/')
  const basePath = isInstructor
    ? `/instructor/session/${sessionId}`
    : `/student/session/${sessionId}`

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [columns, setColumns] = useState<DatasetColumn[]>([])
  const [suggestions, setSuggestions] = useState<AnalysisSuggestion[]>([])
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)

  // Custom chart builder state
  const [customType, setCustomType] = useState<ChartType>('histogram')
  const [customX, setCustomX] = useState('')
  const [customY, setCustomY] = useState('')

  // CTA gate: require signup for analysis (skip for instructors)
  // Don't show while auth is still loading; dismiss once user is resolved
  const isGuest = !authLoading && !user && !!guestState
  const showCTA = isGuest && !isInstructor

  const loadData = useCallback(async () => {
    if (!sessionId) return

    const surveys = await fetchSessionSurveys(sessionId)
    if (surveys.length === 0) {
      setLoading(false)
      return
    }

    const latestSurvey = surveys[0]
    setSurvey(latestSurvey)

    const responses = await fetchSurveyResponses(latestSurvey.id)
    const cols = buildDatasetColumns(latestSurvey.questions, responses)
    setColumns(cols)

    // Generate suggestions
    const localSuggestions = generateLocalSuggestions(cols)
    setSuggestions(localSuggestions)

    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getColumn(label: string): DatasetColumn | undefined {
    return columns.find((c) => c.label === label)
  }

  function addChart(suggestion: AnalysisSuggestion) {
    const id = `${suggestion.chartType}-${suggestion.xField}-${Date.now()}`
    setActiveCharts((prev) => [
      ...prev,
      {
        id,
        chartType: suggestion.chartType,
        title: suggestion.title,
        xField: suggestion.xField ?? '',
        yField: suggestion.yField,
      },
    ])
  }

  function addCustomChart() {
    if (!customX) return
    const title =
      customType === 'scatter' && customY
        ? `${customX} vs ${customY}`
        : `${customType.charAt(0).toUpperCase() + customType.slice(1)} of ${customX}`

    addChart({
      chartType: customType,
      title,
      description: '',
      xField: customX,
      yField: customY || undefined,
    })
    setShowBuilder(false)
    setCustomX('')
    setCustomY('')
  }

  function removeChart(id: string) {
    setActiveCharts((prev) => prev.filter((c) => c.id !== id))
  }

  function getChartDataForInterpretation(chart: ActiveChart): Record<string, unknown>[] {
    const col = getColumn(chart.xField)
    if (!col) return []

    if (chart.chartType === 'histogram') {
      return buildHistogramBins(col.values as number[]) as Record<string, unknown>[]
    }
    if (chart.chartType === 'bar' || chart.chartType === 'pie' || chart.chartType === 'line') {
      return buildCategoryCount(col.values) as Record<string, unknown>[]
    }
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

  // CTA gate overlay
  if (showCTA) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-12 fade-in-up">
          <div className="glass-strong p-8 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#F0F0F7' }}>
              Unlock AI Analysis
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9090B0' }}>
              Create a free account to access the analysis workspace with
              AI-powered charts and interpretations.
            </p>
            <button
              onClick={() =>
                navigate(
                  `/auth/signup?redirect=analysis&session=${sessionId}`
                )
              }
              className="btn-liquid px-6 py-3 w-full mb-3"
            >
              Create free account
            </button>
            <button
              onClick={() => navigate(`${basePath}`)}
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

  if (!survey || columns.length === 0) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="glass p-8">
            <p className="text-lg mb-2" style={{ color: '#9090B0' }}>
              No dataset available
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

  return (
    <AppShell fullWidth>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 fade-in-up">
          <button
            onClick={() => navigate(`${basePath}`)}
            className="text-xs mb-2 inline-block"
            style={{ color: '#9090B0' }}
          >
            ← Back to session
          </button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
                Analysis Workspace
              </h1>
              <p className="text-sm" style={{ color: '#9090B0' }}>
                {survey.title} · {columns.length} variables · {columns[0]?.values.length ?? 0} responses
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/student/session/${sessionId}/dataset`)}
                className="btn-ghost px-4 py-2 text-xs"
              >
                📋 View dataset
              </button>
              <button
                onClick={() => setShowBuilder(!showBuilder)}
                className="btn-liquid px-4 py-2 text-xs"
              >
                + New chart
              </button>
            </div>
          </div>
        </div>

        {/* Custom chart builder */}
        {showBuilder && (
          <div className="glass p-5 mb-6 fade-in-up">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0F0F7' }}>
              Build a chart
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Chart type */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>
                  Chart type
                </label>
                <select
                  className="glass-select w-full px-3 py-2 text-sm"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as ChartType)}
                >
                  <option value="histogram">Histogram</option>
                  <option value="bar">Bar chart</option>
                  <option value="scatter">Scatter plot</option>
                  <option value="pie">Pie chart</option>
                  <option value="line">Line chart</option>
                  <option value="demand">Demand curve</option>
                </select>
              </div>

              {/* X variable */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>
                  {customType === 'scatter' ? 'X variable' : 'Variable'}
                </label>
                <select
                  className="glass-select w-full px-3 py-2 text-sm"
                  value={customX}
                  onChange={(e) => setCustomX(e.target.value)}
                >
                  <option value="">Select…</option>
                  {columns.map((c) => (
                    <option key={c.index} value={c.label}>
                      {c.label} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Y variable (scatter only) */}
              {(customType === 'scatter') && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9090B0' }}>
                    Y variable
                  </label>
                  <select
                    className="glass-select w-full px-3 py-2 text-sm"
                    value={customY}
                    onChange={(e) => setCustomY(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {columns
                      .filter((c) => c.label !== customX)
                      .map((c) => (
                        <option key={c.index} value={c.label}>
                          {c.label} ({c.type})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Add button */}
              <div className="flex items-end">
                <button
                  onClick={addCustomChart}
                  disabled={!customX || (customType === 'scatter' && !customY)}
                  className="btn-liquid px-4 py-2 text-sm w-full"
                >
                  Add chart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {columns.filter((c) => c.type === 'numeric').length > 0 && (
          <div className="mb-6 fade-in-up">
            <h3
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: '#9090B0' }}
            >
              Summary Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {['Variable', 'N', 'Mean', 'Median', 'Std Dev', 'Min', 'Max'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: '#9090B0', borderBottom: '1px solid #2E2E45' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {columns
                    .filter((c) => c.type === 'numeric')
                    .map((col) => {
                      const nums = col.values.filter((v) => typeof v === 'number' && v !== 0) as number[]
                      const stats = computeStats(nums)
                      return (
                        <tr key={col.index} className="hover:bg-[rgba(99,91,255,0.05)] transition-colors">
                          <td className="px-4 py-2.5 font-medium" style={{ color: '#F0F0F7', borderBottom: '1px solid rgba(46,46,69,0.5)' }}>
                            {col.label}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#9090B0', borderBottom: '1px solid rgba(46,46,69,0.5)' }}>
                            {nums.length}
                          </td>
                          {[stats.mean, stats.median, stats.stdDev, stats.min, stats.max].map((val, i) => (
                            <td
                              key={i}
                              className="px-4 py-2.5 font-mono text-xs"
                              style={{ color: '#F0F0F7', borderBottom: '1px solid rgba(46,46,69,0.5)' }}
                            >
                              {val.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categorical Frequency Counts */}
        {columns.filter((c) => c.type === 'categorical').length > 0 && (
          <div className="mb-6 fade-in-up">
            <h3
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: '#9090B0' }}
            >
              Frequency Counts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns
                .filter((c) => c.type === 'categorical')
                .map((col) => {
                  const counts = buildCategoryCount(col.values)
                  const total = counts.reduce((s, c) => s + c.count, 0)
                  return (
                    <div key={col.index} className="glass p-4">
                      <h4 className="text-sm font-semibold mb-3" style={{ color: '#F0F0F7' }}>
                        {col.label}
                      </h4>
                      <div className="space-y-1.5">
                        {counts.slice(0, 8).map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="truncate" style={{ color: '#F0F0F7' }}>{item.label}</span>
                                <span style={{ color: '#9090B0' }}>{item.count} ({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(46,46,69,0.6)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                                    background: 'linear-gradient(90deg, #635BFF, #818CF8)',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {counts.length > 8 && (
                          <p className="text-[10px] pt-1" style={{ color: '#9090B0' }}>
                            + {counts.length - 8} more categories
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {activeCharts.length === 0 && suggestions.length > 0 && (
          <div className="mb-6 fade-in-up">
            <h3 className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#9090B0' }}>
              Suggested analyses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => addChart(s)}
                  className="glass p-4 text-left hover:border-[rgba(232,68,122,0.3)] transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{CHART_ICONS[s.chartType]}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#F0F0F7' }}
                    >
                      {s.title}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#9090B0' }}>
                    {s.description}
                  </p>
                  <span
                    className="text-[10px] mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#635BFF' }}
                  >
                    Click to generate →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active charts */}
        {activeCharts.length > 0 && (
          <div className="space-y-6">
            {/* Suggestion pills */}
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter(
                  (s) =>
                    !activeCharts.some(
                      (c) => c.xField === s.xField && c.chartType === s.chartType
                    )
                )
                .map((s, i) => (
                  <button
                    key={i}
                    onClick={() => addChart(s)}
                    className="badge-glow text-xs px-3 py-1 cursor-pointer hover:bg-[rgba(232,68,122,0.2)] transition-colors"
                  >
                    {CHART_ICONS[s.chartType]} {s.title}
                  </button>
                ))}
            </div>

            {/* Chart grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeCharts.map((chart) => {
                const col = getColumn(chart.xField)
                if (!col) return null

                return (
                  <div key={chart.id} className="relative">
                    {/* Remove button */}
                    <button
                      onClick={() => removeChart(chart.id)}
                      className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background: 'rgba(46, 46, 69, 0.6)',
                        color: '#9090B0',
                      }}
                      title="Remove chart"
                    >
                      ✕
                    </button>

                    <ChartCard
                      title={chart.title}
                      chartType={chart.chartType}
                      chartData={getChartDataForInterpretation(chart)}
                      stats={getChartStats(chart)}
                    >
                      {chart.chartType === 'histogram' && col.type === 'numeric' && (
                        <HistogramChart
                          values={col.values as number[]}
                          label={col.label}
                        />
                      )}

                      {chart.chartType === 'bar' && (
                        <BarChartView values={col.values} label={col.label} />
                      )}

                      {chart.chartType === 'scatter' && chart.yField && (() => {
                        const yCol = getColumn(chart.yField!)
                        if (!yCol) return <p style={{ color: '#9090B0' }}>Y column not found</p>
                        return (
                          <ScatterChartView
                            xValues={col.values as number[]}
                            yValues={yCol.values as number[]}
                            xLabel={col.label}
                            yLabel={yCol.label}
                          />
                        )
                      })()}

                      {chart.chartType === 'pie' && (
                        <PieChartView values={col.values} label={col.label} />
                      )}

                      {chart.chartType === 'line' && (
                        <LineChartView values={col.values} label={col.label} />
                      )}

                      {chart.chartType === 'demand' && col.type === 'numeric' && (
                        <DemandCurve
                          priceValues={col.values as number[]}
                          label={col.label}
                        />
                      )}
                    </ChartCard>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeCharts.length === 0 && suggestions.length === 0 && (
          <div className="glass p-12 text-center fade-in-up">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F0F7' }}>
              Start analysing
            </h3>
            <p className="text-sm mb-4" style={{ color: '#9090B0' }}>
              Click "+ New chart" to build your first visualisation.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
