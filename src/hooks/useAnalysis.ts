import { supabase } from '@/lib/supabase'
import type { AnalysisSuggestion, ChartType, SurveyQuestion, AnswerMap } from '@/types'

// -------------------------------------------------------
// Dataset helpers
// -------------------------------------------------------

export interface DatasetColumn {
  index: number
  label: string
  type: 'numeric' | 'categorical'
  values: (string | number)[]
}

/**
 * Analyse survey questions + responses to build typed columns
 */
export function buildDatasetColumns(
  questions: SurveyQuestion[],
  responses: { answers: AnswerMap }[]
): DatasetColumn[] {
  return questions.map((q, i) => {
    const raw = responses.map((r) => {
      const val = r.answers[i]
      if (val === undefined || val === null) return null

      // Screenshot answers may be JSON
      if (q.type === 'screenshot') {
        try {
          const parsed = JSON.parse(String(val))
          return parsed.extracted_value ?? parsed.ocr_text ?? null
        } catch {
          return typeof val === 'string' && val.length > 50 ? null : val
        }
      }
      return val
    })

    // Determine if column is numeric
    const numericValues = raw.filter((v) => v !== null).map((v) => Number(v))
    const isNumeric =
      (q.type === 'number' || q.type === 'slider' || q.type === 'scale' || q.type === 'screenshot') &&
      numericValues.every((n) => !isNaN(n))

    const values = raw.map((v) => {
      if (v === null) return isNumeric ? 0 : '—'
      return isNumeric ? Number(v) : String(v)
    })

    return {
      index: i,
      label: q.label,
      type: isNumeric ? 'numeric' : 'categorical',
      values,
    }
  })
}

// -------------------------------------------------------
// Local analysis suggestion engine (no AI needed)
// -------------------------------------------------------

export function generateLocalSuggestions(
  columns: DatasetColumn[]
): AnalysisSuggestion[] {
  const suggestions: AnalysisSuggestion[] = []
  const numericCols = columns.filter((c) => c.type === 'numeric')
  const categoricalCols = columns.filter((c) => c.type === 'categorical')

  // Histogram for each numeric column
  for (const col of numericCols.slice(0, 2)) {
    suggestions.push({
      chartType: 'histogram',
      title: `Distribution of ${col.label}`,
      description: `See how "${col.label}" is distributed across all respondents.`,
      xField: col.label,
    })
  }

  // Bar chart for categorical columns
  for (const col of categoricalCols.slice(0, 1)) {
    suggestions.push({
      chartType: 'bar',
      title: `Breakdown by ${col.label}`,
      description: `Compare counts for each category of "${col.label}".`,
      xField: col.label,
    })
  }

  // Scatter: first two numeric columns
  if (numericCols.length >= 2) {
    suggestions.push({
      chartType: 'scatter',
      title: `${numericCols[0].label} vs ${numericCols[1].label}`,
      description: `Explore the relationship between "${numericCols[0].label}" and "${numericCols[1].label}".`,
      xField: numericCols[0].label,
      yField: numericCols[1].label,
    })
  }

  // Pie chart for categorical
  if (categoricalCols.length >= 1) {
    suggestions.push({
      chartType: 'pie',
      title: `${categoricalCols[0].label} proportions`,
      description: `See the proportional breakdown of "${categoricalCols[0].label}".`,
      xField: categoricalCols[0].label,
    })
  }

  return suggestions.slice(0, 6)
}

// -------------------------------------------------------
// AI-powered suggestions (calls edge function)
// -------------------------------------------------------

export async function fetchAISuggestions(
  columns: DatasetColumn[]
): Promise<{ suggestions: AnalysisSuggestion[]; error: string | null }> {
  const summary = columns.map((c) => ({
    label: c.label,
    type: c.type,
    sampleValues: c.values.slice(0, 5),
    uniqueCount: new Set(c.values).size,
  }))

  const { data, error } = await supabase.functions.invoke('suggest-analysis', {
    body: { columns: summary },
  })

  if (error) return { suggestions: [], error: error.message }
  return { suggestions: data?.suggestions ?? [], error: null }
}

// -------------------------------------------------------
// AI chart interpretation (calls edge function)
// -------------------------------------------------------

export async function fetchChartInterpretation(
  chartType: ChartType,
  chartData: Record<string, unknown>[],
  title: string,
  stats?: Record<string, unknown>
): Promise<{ interpretation: string; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('interpret-chart', {
    body: { chartType, chartData, title, stats },
  })

  if (error) return { interpretation: '', error: error.message }
  return { interpretation: data?.interpretation ?? '', error: null }
}

// -------------------------------------------------------
// Local chart interpretation (fallback — no AI)
// -------------------------------------------------------

export function generateLocalInterpretation(
  chartType: ChartType,
  chartData: Record<string, unknown>[],
  title: string,
  stats?: { mean?: number; median?: number; r?: number; rSquared?: number }
): string {
  const n = chartData.length

  if (chartType === 'histogram' && n > 0) {
    const values = chartData.map((d) => Number(d.value ?? d.count ?? 0))
    const total = values.reduce((a, b) => a + b, 0)
    const peak = chartData.reduce((best, d) =>
      (Number(d.count ?? 0)) > (Number(best.count ?? 0)) ? d : best,
      chartData[0]
    )
    return `The histogram for "${title}" shows ${total} responses across ${n} bins. The most common range is "${peak.bin ?? peak.label ?? ''}" with ${peak.count} responses. ${
      stats?.mean !== undefined ? `The mean is ${stats.mean.toFixed(1)} and the median is ${stats?.median?.toFixed(1) ?? 'N/A'}.` : ''
    }`
  }

  if (chartType === 'bar' && n > 0) {
    const sorted = [...chartData].sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
    return `The bar chart shows ${n} categories for "${title}". The most common response is "${sorted[0]?.label ?? ''}" with ${sorted[0]?.count ?? 0} responses, while the least common is "${sorted[n - 1]?.label ?? ''}" with ${sorted[n - 1]?.count ?? 0}.`
  }

  if (chartType === 'scatter' && stats?.r !== undefined) {
    const strength = Math.abs(stats.r) > 0.7 ? 'strong' : Math.abs(stats.r) > 0.4 ? 'moderate' : 'weak'
    const direction = stats.r > 0 ? 'positive' : 'negative'
    return `The scatter plot reveals a ${strength} ${direction} correlation (r = ${stats.r.toFixed(3)}, R² = ${stats.rSquared?.toFixed(3) ?? 'N/A'}). This means as one variable increases, the other tends to ${stats.r > 0 ? 'increase' : 'decrease'}.`
  }

  if (chartType === 'pie' && n > 0) {
    const sorted = [...chartData].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
    return `The pie chart shows the proportional breakdown of "${title}". The largest segment is "${sorted[0]?.label ?? ''}" at ${sorted[0]?.value ?? 0}%, followed by "${sorted[1]?.label ?? ''}" at ${sorted[1]?.value ?? 0}%.`
  }

  return `This ${chartType} chart displays ${n} data points for "${title}".`
}

// -------------------------------------------------------
// Statistics helpers
// -------------------------------------------------------

export function computeStats(values: number[]): {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
} {
  const n = values.length
  if (n === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }

  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / n
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  return { mean, median, stdDev, min: sorted[0], max: sorted[n - 1] }
}

export function computeLinearRegression(
  xVals: number[],
  yVals: number[]
): { slope: number; intercept: number; r: number; rSquared: number } {
  const n = xVals.length
  if (n === 0) return { slope: 0, intercept: 0, r: 0, rSquared: 0 }

  const sumX = xVals.reduce((a, b) => a + b, 0)
  const sumY = yVals.reduce((a, b) => a + b, 0)
  const sumXY = xVals.reduce((s, x, i) => s + x * yVals[i], 0)
  const sumX2 = xVals.reduce((s, x) => s + x * x, 0)
  const sumY2 = yVals.reduce((s, y) => s + y * y, 0)

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: 0, r: 0, rSquared: 0 }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  const rNum = n * sumXY - sumX * sumY
  const rDen = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  const r = rDen === 0 ? 0 : rNum / rDen

  return { slope, intercept, r, rSquared: r * r }
}

export function buildHistogramBins(
  values: number[],
  binCount = 8
): { bin: string; count: number; x0: number; x1: number }[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const binWidth = range / binCount

  const bins = Array.from({ length: binCount }, (_, i) => {
    const x0 = min + i * binWidth
    const x1 = x0 + binWidth
    return {
      bin: `${x0.toFixed(1)}–${x1.toFixed(1)}`,
      count: 0,
      x0,
      x1,
    }
  })

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1)
    bins[idx].count++
  }

  return bins
}

export function buildCategoryCount(
  values: (string | number)[]
): { label: string; count: number }[] {
  const map = new Map<string, number>()
  for (const v of values) {
    const key = String(v)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}
