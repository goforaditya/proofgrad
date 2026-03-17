import { useState, useRef } from 'react'
import type { SurveyQuestion } from '@/types'

interface Props {
  question: SurveyQuestion
  index: number
  value: string | number | null
  onChange: (index: number, value: string | number) => void
  onScreenshotFile?: (index: number, file: File) => void
}

export default function QuestionRenderer({
  question,
  index,
  value,
  onChange,
  onScreenshotFile,
}: Props) {
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // For the time picker, decompose total minutes into h + m
  const timeHours = question.type === 'time' && typeof value === 'number'
    ? Math.floor(value / 60)
    : 0
  const timeMinutes = question.type === 'time' && typeof value === 'number'
    ? value % 60
    : 0

  function handleTimeChange(h: number, m: number) {
    onChange(index, h * 60 + m)
  }

  return (
    <>
      {/* Section header */}
      {question.section && (
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px flex-1" style={{ background: 'rgba(99, 91, 255, 0.2)' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#635BFF' }}>
              {question.section}
            </h3>
            <div className="h-px flex-1" style={{ background: 'rgba(99, 91, 255, 0.2)' }} />
          </div>
        </div>
      )}

      <div className="glass p-5 fade-in-up">
        <div className="flex items-start gap-3 mb-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(99, 91, 255, 0.15)', color: '#635BFF' }}
          >
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F0F0F7' }}>
              {question.label}
            </p>
            {question.helpText && (
              <p className="text-xs mt-1" style={{ color: '#9090B0' }}>
                {question.helpText}
              </p>
            )}
          </div>
        </div>

        <div className="pl-10">
          {/* Number input */}
          {question.type === 'number' && (
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(index, e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Enter a number…"
              min={question.min}
              max={question.max}
              step={question.step ?? 'any'}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          )}

          {/* Text input */}
          {question.type === 'text' && (
            <input
              type="text"
              value={value ?? ''}
              onChange={(e) => onChange(index, e.target.value)}
              placeholder={question.placeholder ?? 'Type your answer…'}
              maxLength={200}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          )}

          {/* Time picker (hours + minutes → stored as total minutes) */}
          {question.type === 'time' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Hours</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={typeof value === 'number' ? timeHours : ''}
                  onChange={(e) => {
                    const h = e.target.value === '' ? 0 : Math.min(24, Math.max(0, parseInt(e.target.value, 10) || 0))
                    handleTimeChange(h, timeMinutes)
                  }}
                  placeholder="0"
                  className="glass-input w-full px-4 py-2.5 text-sm text-center"
                />
              </div>
              <span className="text-lg font-bold mt-5" style={{ color: '#9090B0' }}>:</span>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={typeof value === 'number' ? timeMinutes : ''}
                  onChange={(e) => {
                    const m = e.target.value === '' ? 0 : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))
                    handleTimeChange(timeHours, m)
                  }}
                  placeholder="0"
                  className="glass-input w-full px-4 py-2.5 text-sm text-center"
                />
              </div>
              {typeof value === 'number' && value > 0 && (
                <div className="mt-5 text-xs whitespace-nowrap" style={{ color: '#635BFF' }}>
                  = {value} min
                </div>
              )}
            </div>
          )}

          {/* Slider */}
          {question.type === 'slider' && (
            <div>
              <div className="flex justify-between text-xs mb-2" style={{ color: '#9090B0' }}>
                <span>{question.min ?? 0}</span>
                <span className="font-bold text-sm" style={{ color: '#635BFF' }}>
                  {value ?? question.min ?? 0}
                </span>
                <span>{question.max ?? 100}</span>
              </div>
              <input
                type="range"
                min={question.min ?? 0}
                max={question.max ?? 100}
                step={question.step ?? 1}
                value={typeof value === 'number' ? value : (question.min ?? 0)}
                onChange={(e) => onChange(index, Number(e.target.value))}
                className="w-full slider-pink"
              />
            </div>
          )}

          {/* Multiple choice */}
          {question.type === 'mcq' && (
            <div className="flex flex-col gap-2">
              {(question.options ?? []).map((opt, oi) => {
                const isSelected = value === opt
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => onChange(index, opt)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200"
                    style={{
                      background: isSelected
                        ? 'rgba(99, 91, 255, 0.12)'
                        : 'rgba(13, 13, 18, 0.4)',
                      border: `1px solid ${
                        isSelected ? 'rgba(99, 91, 255, 0.4)' : 'rgba(255, 255, 255, 0.06)'
                      }`,
                      color: isSelected ? '#F0F0F7' : '#9090B0',
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-bold"
                      style={{
                        border: `2px solid ${isSelected ? '#635BFF' : 'rgba(144,144,176,0.3)'}`,
                        background: isSelected ? '#635BFF' : 'transparent',
                        color: isSelected ? '#fff' : '#9090B0',
                      }}
                    >
                      {isSelected ? '✓' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {/* Scale 1-10 */}
          {question.type === 'scale' && (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: (question.max ?? 10) - (question.min ?? 1) + 1 },
                (_, i) => (question.min ?? 1) + i
              ).map((n) => {
                const isSelected = value === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChange(index, n)}
                    className="w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #635BFF, #4F46E5)'
                        : 'rgba(13, 13, 18, 0.4)',
                      border: `1px solid ${
                        isSelected ? 'rgba(99, 91, 255, 0.4)' : 'rgba(255, 255, 255, 0.06)'
                      }`,
                      color: isSelected ? '#fff' : '#9090B0',
                      boxShadow: isSelected ? '0 0 12px rgba(232,68,122,0.3)' : 'none',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          )}

          {/* Screenshot upload */}
          {question.type === 'screenshot' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFileName(file.name)
                    onScreenshotFile?.(index, file)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-6 rounded-xl text-sm transition-all duration-200 flex flex-col items-center gap-2"
                style={{
                  background: fileName ? 'rgba(99, 91, 255, 0.08)' : 'rgba(13, 13, 18, 0.4)',
                  border: `2px dashed ${fileName ? 'rgba(99, 91, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: fileName ? '#F0F0F7' : '#9090B0',
                }}
              >
                <span className="text-2xl">{fileName ? '✓' : '📷'}</span>
                {fileName ? (
                  <span className="text-xs">{fileName}</span>
                ) : (
                  <>
                    <span>Tap to upload screenshot</span>
                    <span className="text-xs" style={{ color: '#9090B0' }}>
                      Screen time data will be extracted automatically
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
