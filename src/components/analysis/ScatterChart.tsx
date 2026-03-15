import { useMemo, useState } from 'react'
import {
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { computeLinearRegression } from '@/hooks/useAnalysis'

interface Props {
  xValues: number[]
  yValues: number[]
  xLabel: string
  yLabel: string
}

export default function ScatterChartView({ xValues, yValues, xLabel, yLabel }: Props) {
  const [swapped, setSwapped] = useState(false)

  const xData = swapped ? yValues : xValues
  const yData = swapped ? xValues : yValues
  const xLbl = swapped ? yLabel : xLabel
  const yLbl = swapped ? xLabel : yLabel

  const data = useMemo(
    () => xData.map((x, i) => ({ x, y: yData[i] })),
    [xData, yData]
  )

  const regression = useMemo(
    () => computeLinearRegression(xData, yData),
    [xData, yData]
  )

  // Generate trend line points
  const trendLine = useMemo(() => {
    if (data.length < 2) return []
    const xs = data.map((d) => d.x)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    return [
      { x: minX, y: regression.slope * minX + regression.intercept },
      { x: maxX, y: regression.slope * maxX + regression.intercept },
    ]
  }, [data, regression])

  if (data.length === 0) {
    return <p className="text-sm" style={{ color: '#9090B0' }}>No data to display.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-4 text-xs" style={{ color: '#9090B0' }}>
          <span>r = <strong style={{ color: '#F0F0F7' }}>{regression.r.toFixed(4)}</strong></span>
          <span>R² = <strong style={{ color: '#F0F0F7' }}>{regression.rSquared.toFixed(4)}</strong></span>
          <span>n = <strong style={{ color: '#F0F0F7' }}>{data.length}</strong></span>
        </div>
        <button
          onClick={() => setSwapped(!swapped)}
          className="btn-ghost px-3 py-1 text-xs flex items-center gap-1"
        >
          ⇄ Swap axes
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RechartsScatter data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="x"
            name={xLbl}
            type="number"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            label={{ value: xLbl, position: 'insideBottom', offset: -2, fill: '#9090B0', fontSize: 11 }}
          />
          <YAxis
            dataKey="y"
            name={yLbl}
            type="number"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            label={{ value: yLbl, angle: -90, position: 'insideLeft', fill: '#9090B0', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(26, 26, 38, 0.95)',
              border: '1px solid rgba(99, 91, 255, 0.2)',
              borderRadius: 12,
              color: '#F0F0F7',
              fontSize: 13,
            }}
            cursor={{ strokeDasharray: '3 3', stroke: 'rgba(99, 91, 255, 0.3)' }}
          />
          <Scatter
            dataKey="y"
            fill="#635BFF"
            fillOpacity={0.7}
            r={5}
          />
          {/* Trend line */}
          {trendLine.length === 2 && (
            <ReferenceLine
              segment={[
                { x: trendLine[0].x, y: trendLine[0].y },
                { x: trendLine[1].x, y: trendLine[1].y },
              ]}
              stroke="rgba(255, 158, 200, 0.6)"
              strokeDasharray="6 4"
              strokeWidth={2}
            />
          )}
        </RechartsScatter>
      </ResponsiveContainer>

      <div className="text-xs mt-2" style={{ color: '#9090B0' }}>
        Trend: y = {regression.slope.toFixed(3)}x + {regression.intercept.toFixed(3)}
      </div>
    </div>
  )
}
