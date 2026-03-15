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

  return (
    <div className="glass p-5 fade-in-up">
      <div className="flex items-start gap-3 mb-3">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(232, 68, 122, 0.15)', color: '#E8447A' }}
        >
          {index + 1}
        </span>
        <p className="text-sm font-medium" style={{ color: '#F0F0F7' }}>
          {question.label}
        </p>
      </div>

      <div className="pl-10">
        {/* Number input */}
        {question.type === 'number' && (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(index, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter a number…"
            className="glass-input w-full px-4 py-2.5 text-sm"
          />
        )}

        {/* Slider */}
        {question.type === 'slider' && (
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: '#9090B0' }}>
              <span>{question.min ?? 0}</span>
              <span className="font-bold text-sm" style={{ color: '#E8447A' }}>
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
                      ? 'rgba(232, 68, 122, 0.12)'
                      : 'rgba(13, 13, 18, 0.4)',
                    border: `1px solid ${
                      isSelected ? 'rgba(232, 68, 122, 0.4)' : 'rgba(255, 255, 255, 0.06)'
                    }`,
                    color: isSelected ? '#F0F0F7' : '#9090B0',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-bold"
                    style={{
                      border: `2px solid ${isSelected ? '#E8447A' : 'rgba(144,144,176,0.3)'}`,
                      background: isSelected ? '#E8447A' : 'transparent',
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
                      ? 'linear-gradient(135deg, #E8447A, #C42E60)'
                      : 'rgba(13, 13, 18, 0.4)',
                    border: `1px solid ${
                      isSelected ? 'rgba(232, 68, 122, 0.4)' : 'rgba(255, 255, 255, 0.06)'
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
                background: fileName ? 'rgba(232, 68, 122, 0.08)' : 'rgba(13, 13, 18, 0.4)',
                border: `2px dashed ${fileName ? 'rgba(232, 68, 122, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
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
  )
}
