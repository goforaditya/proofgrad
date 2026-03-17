import { useState } from 'react'
import type { SurveyQuestion, QuestionType } from '@/types'

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'text', label: 'Short Text', icon: 'Aa' },
  { value: 'time', label: 'Time (h + m)', icon: '⏱' },
  { value: 'slider', label: 'Slider', icon: '◐' },
  { value: 'mcq', label: 'Multiple Choice', icon: '◉' },
  { value: 'scale', label: 'Scale (1–10)', icon: '★' },
  { value: 'screenshot', label: 'Screenshot Upload', icon: '📷' },
]

interface Props {
  question: SurveyQuestion
  index: number
  onChange: (index: number, updated: SurveyQuestion) => void
  onRemove: (index: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function QuestionBuilder({
  question,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [mcqInput, setMcqInput] = useState('')

  function updateField<K extends keyof SurveyQuestion>(field: K, value: SurveyQuestion[K]) {
    onChange(index, { ...question, [field]: value })
  }

  function addOption() {
    const trimmed = mcqInput.trim()
    if (!trimmed) return
    const opts = [...(question.options ?? []), trimmed]
    updateField('options', opts)
    setMcqInput('')
  }

  function removeOption(optIdx: number) {
    const opts = (question.options ?? []).filter((_, i) => i !== optIdx)
    updateField('options', opts)
  }

  return (
    <div className="glass p-5 fade-in-up">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(99, 91, 255, 0.15)', color: '#635BFF' }}
          >
            {index + 1}
          </span>
          <select
            value={question.type}
            onChange={(e) => {
              const newType = e.target.value as QuestionType
              const base: SurveyQuestion = { type: newType, label: question.label }
              if (newType === 'slider') {
                base.min = 0
                base.max = 100
                base.step = 1
              }
              if (newType === 'scale') {
                base.min = 1
                base.max = 10
              }
              if (newType === 'mcq') {
                base.options = question.options ?? []
              }
              onChange(index, base)
            }}
            className="glass-select text-xs px-3 py-1.5"
          >
            {QUESTION_TYPES.map((qt) => (
              <option key={qt.value} value={qt.value}>
                {qt.icon} {qt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button onClick={onMoveUp} className="btn-ghost px-2 py-1 text-xs" title="Move up">↑</button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="btn-ghost px-2 py-1 text-xs" title="Move down">↓</button>
          )}
          <button
            onClick={() => onRemove(index)}
            className="btn-ghost px-2 py-1 text-xs"
            style={{ color: '#818CF8' }}
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Question label */}
      <input
        type="text"
        value={question.label}
        onChange={(e) => updateField('label', e.target.value)}
        placeholder="Enter your question…"
        className="glass-input w-full px-4 py-2.5 text-sm mb-3"
      />

      {/* Type-specific fields */}
      {question.type === 'slider' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Min</label>
            <input
              type="number"
              value={question.min ?? 0}
              onChange={(e) => updateField('min', Number(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Max</label>
            <input
              type="number"
              value={question.max ?? 100}
              onChange={(e) => updateField('max', Number(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Step</label>
            <input
              type="number"
              value={question.step ?? 1}
              onChange={(e) => updateField('step', Number(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {question.type === 'scale' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Min</label>
            <input
              type="number"
              value={question.min ?? 1}
              onChange={(e) => updateField('min', Number(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1" style={{ color: '#9090B0' }}>Max</label>
            <input
              type="number"
              value={question.max ?? 10}
              onChange={(e) => updateField('max', Number(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {question.type === 'mcq' && (
        <div>
          <label className="block text-xs mb-2" style={{ color: '#9090B0' }}>Options</label>
          <div className="flex flex-col gap-1.5 mb-2">
            {(question.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ border: '1px solid rgba(232,68,122,0.3)', color: '#635BFF' }}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="text-sm flex-1" style={{ color: '#F0F0F7' }}>{opt}</span>
                <button
                  onClick={() => removeOption(oi)}
                  className="text-xs px-1"
                  style={{ color: '#9090B0' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={mcqInput}
              onChange={(e) => setMcqInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              placeholder="Add option…"
              className="glass-input flex-1 px-3 py-2 text-sm"
            />
            <button onClick={addOption} className="btn-ghost px-3 py-2 text-xs">
              Add
            </button>
          </div>
        </div>
      )}

      {question.type === 'text' && (
        <p className="text-xs" style={{ color: '#9090B0' }}>
          Students will type a short free-text answer (e.g. app name).
        </p>
      )}

      {question.type === 'time' && (
        <p className="text-xs" style={{ color: '#9090B0' }}>
          Students pick hours + minutes. Stored as total minutes in the dataset.
        </p>
      )}

      {question.type === 'screenshot' && (
        <p className="text-xs" style={{ color: '#9090B0' }}>
          Students will upload a screenshot. OCR will extract screen time data automatically.
        </p>
      )}

      {/* Help text */}
      <div className="mt-3">
        <input
          type="text"
          value={question.helpText ?? ''}
          onChange={(e) => updateField('helpText', e.target.value || undefined)}
          placeholder="Help text (optional) — shown below the question"
          className="glass-input w-full px-3 py-2 text-xs"
          style={{ opacity: 0.7 }}
        />
      </div>

      {/* Section header */}
      <div className="mt-2">
        <input
          type="text"
          value={question.section ?? ''}
          onChange={(e) => updateField('section', e.target.value || undefined)}
          placeholder="Section header (optional) — shown as divider above this question"
          className="glass-input w-full px-3 py-2 text-xs"
          style={{ opacity: 0.7 }}
        />
      </div>
    </div>
  )
}
