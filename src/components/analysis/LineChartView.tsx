import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { buildCategoryCount } from '@/hooks/useAnalysis'

interface Props {
  values: (string | number)[]
  label: string
}

export default function LineChartView({ values }: Props) {
  const data = useMemo(() => buildCategoryCount(values), [values])

  if (data.length === 0) {
    return <p className="text-sm" style={{ color: '#9090B0' }}>No data to display.</p>
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
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
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#E8447A"
            strokeWidth={2}
            dot={{ fill: '#E8447A', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: '#FF6BA8', r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="text-xs mt-2" style={{ color: '#9090B0' }}>
        {data.length} data points · n = {values.length}
      </div>
    </div>
  )
}
