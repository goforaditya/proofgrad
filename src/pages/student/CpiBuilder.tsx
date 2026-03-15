import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import AppShell from '@/components/layout/AppShell'

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', weight: 30 },
  { name: 'Transport', weight: 15 },
  { name: 'Housing', weight: 20 },
  { name: 'Entertainment', weight: 10 },
  { name: 'Education', weight: 15 },
  { name: 'Clothing', weight: 5 },
  { name: 'Health', weight: 5 },
]

interface Category {
  name: string
  weight: number
  priceLevel: number
}

export default function CpiBuilder() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, priceLevel: 100 }))
  )
  const [officialCpi, setOfficialCpi] = useState<number>(100)

  const totalWeight = useMemo(
    () => categories.reduce((s, c) => s + c.weight, 0),
    [categories]
  )

  const studentCpi = useMemo(() => {
    if (totalWeight === 0) return 0
    return categories.reduce((s, c) => s + (c.weight / totalWeight) * c.priceLevel, 0)
  }, [categories, totalWeight])

  const weightValid = totalWeight === 100

  function updateWeight(index: number, value: number) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, weight: value } : c))
    )
  }

  function updatePrice(index: number, value: number) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, priceLevel: value } : c))
    )
  }

  function addCategory() {
    setCategories((prev) => [...prev, { name: 'New Category', weight: 0, priceLevel: 100 }])
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index))
  }

  function updateName(index: number, name: string) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, name } : c))
    )
  }

  // Comparison chart data
  const comparisonData = [
    { name: 'Your CPI', value: studentCpi, fill: '#635BFF' },
    { name: 'Official CPI', value: officialCpi, fill: '#9090B0' },
  ]

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 fade-in-up">
          {sessionId && (
            <button
              onClick={() => navigate(`/student/session/${sessionId}`)}
              className="text-xs mb-2 inline-block"
              style={{ color: '#9090B0' }}
            >
              ← Back to session
            </button>
          )}
          <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
            CPI Builder
          </h1>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            Set budget weights and price levels to build your personal Consumer Price Index.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Budget weights */}
          <div className="glass p-5 fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#F0F0F7' }}>
                Budget Weights
              </h3>
              <span
                className={`text-xs font-mono ${weightValid ? 'badge-glow' : 'alert-error px-2 py-0.5 rounded-full'}`}
              >
                {totalWeight}% / 100%
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={cat.name}
                    onChange={(e) => updateName(i, e.target.value)}
                    className="glass-input px-2 py-1.5 text-xs flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cat.weight}
                      onChange={(e) => updateWeight(i, Number(e.target.value))}
                      className="glass-input px-2 py-1.5 text-xs w-14 text-center"
                    />
                    <span className="text-xs" style={{ color: '#9090B0' }}>%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={cat.priceLevel}
                      onChange={(e) => updatePrice(i, Number(e.target.value))}
                      className="glass-input px-2 py-1.5 text-xs w-16 text-center"
                    />
                  </div>
                  <button
                    onClick={() => removeCategory(i)}
                    className="text-xs px-1"
                    style={{ color: '#9090B0' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addCategory}
              className="btn-ghost w-full py-2 mt-3 text-xs"
            >
              + Add category
            </button>

            {/* Weight bar visualization */}
            <div className="mt-4">
              <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(46, 46, 69, 0.5)' }}>
                {categories.map((cat, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${cat.weight}%`,
                      background: `hsl(${340 + i * 20}, 70%, ${50 + i * 5}%)`,
                    }}
                    title={`${cat.name}: ${cat.weight}%`}
                    className="transition-all duration-300"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: CPI result + comparison */}
          <div className="space-y-6">
            {/* Your CPI */}
            <div className="glass p-5 fade-in-up">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0F0F7' }}>
                Your Weighted CPI
              </h3>
              <div className="text-center py-4">
                <div
                  className="text-5xl font-bold mb-1"
                  style={{ color: weightValid ? '#635BFF' : '#9090B0' }}
                >
                  {weightValid ? studentCpi.toFixed(1) : '—'}
                </div>
                <p className="text-xs" style={{ color: '#9090B0' }}>
                  {weightValid
                    ? 'Weighted average price level'
                    : 'Weights must sum to 100%'}
                </p>
              </div>
            </div>

            {/* Official CPI input */}
            <div className="glass p-5 fade-in-up">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#F0F0F7' }}>
                Compare with Official CPI
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs" style={{ color: '#9090B0' }}>
                  Official CPI:
                </label>
                <input
                  type="number"
                  value={officialCpi}
                  onChange={(e) => setOfficialCpi(Number(e.target.value))}
                  className="glass-input px-3 py-1.5 text-sm w-24"
                />
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9090B0', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#9090B0', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
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
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {comparisonData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="text-xs text-center mt-2" style={{ color: '#9090B0' }}>
                {weightValid && (
                  <>
                    Difference: <strong style={{ color: studentCpi > officialCpi ? '#818CF8' : '#9090B0' }}>
                      {studentCpi > officialCpi ? '+' : ''}{(studentCpi - officialCpi).toFixed(1)}
                    </strong>
                    {studentCpi > officialCpi
                      ? ' — Your basket costs more than official'
                      : ' — Your basket costs less than official'}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
