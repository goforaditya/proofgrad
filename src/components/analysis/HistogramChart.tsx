import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { buildHistogramBins, computeStats } from '@/hooks/useAnalysis'

interface Props {
  values: number[]
  label: string
  binCount?: number
}

export default function HistogramChart({ values, binCount = 8 }: Props) {
  const bins = useMemo(() => buildHistogramBins(values, binCount), [values, binCount])
  const stats = useMemo(() => computeStats(values), [values])

  if (bins.length === 0) {
    return <p className="text-sm" style={{ color: '#9090B0' }}>No data to display.</p>
  }

  const maxCount = Math.max(...bins.map((b) => b.count))

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="bin"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(26, 26, 38, 0.95)',
              border: '1px solid rgba(232, 68, 122, 0.2)',
              borderRadius: 12,
              color: '#F0F0F7',
              fontSize: 13,
            }}
            cursor={{ fill: 'rgba(232, 68, 122, 0.08)' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {bins.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.count === maxCount
                    ? '#E8447A'
                    : 'rgba(232, 68, 122, 0.5)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: '#9090B0' }}>
        <span>Mean: <strong style={{ color: '#F0F0F7' }}>{stats.mean.toFixed(2)}</strong></span>
        <span>Median: <strong style={{ color: '#F0F0F7' }}>{stats.median.toFixed(2)}</strong></span>
        <span>Std Dev: <strong style={{ color: '#F0F0F7' }}>{stats.stdDev.toFixed(2)}</strong></span>
        <span>Range: <strong style={{ color: '#F0F0F7' }}>{stats.min}–{stats.max}</strong></span>
        <span>n = <strong style={{ color: '#F0F0F7' }}>{values.length}</strong></span>
      </div>
    </div>
  )
}
