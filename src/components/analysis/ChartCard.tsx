import { useState, useCallback, type ReactNode } from 'react'
import {
  generateLocalInterpretation,
  fetchChartInterpretation,
} from '@/hooks/useAnalysis'
import type { ChartType } from '@/types'

interface Props {
  title: string
  chartType: ChartType
  chartData: Record<string, unknown>[]
  stats?: { mean?: number; median?: number; r?: number; rSquared?: number }
  children: ReactNode
}

export default function ChartCard({ title, chartType, chartData, stats, children }: Props) {
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [useAI, setUseAI] = useState(false)

  const getInterpretation = useCallback(async () => {
    if (interpretation) return

    // First try local interpretation
    const local = generateLocalInterpretation(chartType, chartData, title, stats)
    setInterpretation(local)

    // Then try AI (non-blocking)
    setLoading(true)
    try {
      const { interpretation: ai, error } = await fetchChartInterpretation(
        chartType,
        chartData,
        title,
        stats
      )
      if (!error && ai) {
        setInterpretation(ai)
        setUseAI(true)
      }
    } catch {
      // Keep local interpretation
    } finally {
      setLoading(false)
    }
  }, [chartType, chartData, title, stats, interpretation])

  return (
    <div className="glass p-5 fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: '#F0F0F7' }}>
          {title}
        </h3>
        <span className="badge-glow text-[10px] uppercase tracking-wider">
          {chartType}
        </span>
      </div>

      {/* Chart */}
      <div className="mb-4">{children}</div>

      {/* Interpretation */}
      {interpretation ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(99, 91, 255, 0.04)',
            border: '1px solid rgba(99, 91, 255, 0.08)',
            color: '#A5B4FC',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium" style={{ color: '#635BFF' }}>
              {useAI ? '✨ AI Interpretation' : '📊 Interpretation'}
            </span>
            {loading && <div className="liquid-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#9090B0' }}>
            {interpretation}
          </p>
        </div>
      ) : (
        <button
          onClick={getInterpretation}
          className="btn-ghost px-4 py-2 text-xs w-full"
        >
          💡 Interpret this chart
        </button>
      )}
    </div>
  )
}
