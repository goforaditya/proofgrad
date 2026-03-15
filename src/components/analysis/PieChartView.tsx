import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { buildCategoryCount } from '@/hooks/useAnalysis'

interface Props {
  values: (string | number)[]
  label: string
}

const COLORS = ['#E8447A', '#FF6BA8', '#C42E60', '#FF9EC8', '#A03560', '#FFB8D8', '#8B2050', '#FF80B0']

export default function PieChartView({ values }: Props) {
  const data = useMemo(() => {
    const counts = buildCategoryCount(values)
    const total = counts.reduce((s, c) => s + c.count, 0)
    return counts.map((c) => ({
      ...c,
      value: Math.round((c.count / total) * 100),
      rawCount: c.count,
    }))
  }, [values])

  if (data.length === 0) {
    return <p className="text-sm" style={{ color: '#9090B0' }}>No data to display.</p>
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            strokeWidth={2}
            stroke="rgba(13, 13, 18, 0.8)"
            label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}%`}
            labelLine={{ stroke: 'rgba(144, 144, 176, 0.4)' }}
          >
            {data.map((_entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(26, 26, 38, 0.95)',
              border: '1px solid rgba(232, 68, 122, 0.2)',
              borderRadius: 12,
              color: '#F0F0F7',
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-xs mt-2" style={{ color: '#9090B0' }}>
        {data.length} categories · n = {values.length}
      </div>
    </div>
  )
}
