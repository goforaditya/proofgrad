import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface Props {
  /** Price values (willingness to pay) from survey responses */
  priceValues: number[]
  label?: string
}

export default function DemandCurve({ priceValues, label = 'Price' }: Props) {
  const sorted = useMemo(() => [...priceValues].sort((a, b) => b - a), [priceValues])

  // Build step-down demand schedule: at each price, how many would buy
  const demandData = useMemo(() => {
    if (sorted.length === 0) return []

    const uniquePrices = [...new Set(sorted)].sort((a, b) => a - b)
    return uniquePrices.map((price) => ({
      price,
      quantity: sorted.filter((p) => p >= price).length,
    }))
  }, [sorted])

  const maxPrice = demandData.length > 0 ? Math.max(...demandData.map((d) => d.price)) : 100
  const [sliderPrice, setSliderPrice] = useState(Math.round(maxPrice * 0.5))

  // Compute quantity at current price and consumer surplus
  const quantityAtPrice = useMemo(
    () => sorted.filter((p) => p >= sliderPrice).length,
    [sorted, sliderPrice]
  )

  const consumerSurplus = useMemo(
    () => sorted.filter((p) => p >= sliderPrice).reduce((sum, p) => sum + (p - sliderPrice), 0),
    [sorted, sliderPrice]
  )

  // Data for the shaded area (consumer surplus)
  const shadedData = useMemo(() => {
    return demandData.map((d) => ({
      ...d,
      surplus: d.price >= sliderPrice ? d.quantity : 0,
    }))
  }, [demandData, sliderPrice])

  if (demandData.length === 0) {
    return <p className="text-sm" style={{ color: '#9090B0' }}>No price data available.</p>
  }

  return (
    <div>
      {/* Price slider */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-xs font-medium" style={{ color: '#9090B0' }}>
          Set Price:
        </label>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={1}
          value={sliderPrice}
          onChange={(e) => setSliderPrice(Number(e.target.value))}
          className="slider-pink flex-1"
        />
        <span
          className="text-sm font-bold min-w-[60px] text-right"
          style={{ color: '#635BFF' }}
        >
          ₹{sliderPrice}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={shadedData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="quantity"
            type="number"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            label={{ value: 'Quantity', position: 'insideBottom', offset: -2, fill: '#9090B0', fontSize: 11 }}
          />
          <YAxis
            dataKey="price"
            type="number"
            tick={{ fill: '#9090B0', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            label={{ value: label, angle: -90, position: 'insideLeft', fill: '#9090B0', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(26, 26, 38, 0.95)',
              border: '1px solid rgba(99, 91, 255, 0.2)',
              borderRadius: 12,
              color: '#F0F0F7',
              fontSize: 13,
            }}
          />
          {/* Consumer surplus area */}
          <Area
            type="stepAfter"
            dataKey="price"
            stroke="#635BFF"
            strokeWidth={2}
            fill="rgba(99, 91, 255, 0.15)"
          />
          {/* Price line */}
          <ReferenceLine
            y={sliderPrice}
            stroke="rgba(255, 158, 200, 0.6)"
            strokeDasharray="8 4"
            strokeWidth={2}
            label={{
              value: `P = ₹${sliderPrice}`,
              fill: '#A5B4FC',
              fontSize: 11,
              position: 'right',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="flex flex-wrap gap-6 mt-3 text-xs" style={{ color: '#9090B0' }}>
        <span>
          Quantity demanded: <strong style={{ color: '#F0F0F7' }}>{quantityAtPrice}</strong>
        </span>
        <span>
          Consumer surplus: <strong style={{ color: '#A5B4FC' }}>₹{consumerSurplus.toFixed(0)}</strong>
        </span>
        <span>
          Revenue: <strong style={{ color: '#F0F0F7' }}>₹{(sliderPrice * quantityAtPrice).toFixed(0)}</strong>
        </span>
      </div>
    </div>
  )
}
