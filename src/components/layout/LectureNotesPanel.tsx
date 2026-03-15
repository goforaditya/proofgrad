import { useState, useEffect, useCallback } from 'react'
import { fetchLectureNote } from '@/hooks/useLectureNotes'
import type { LectureNote, SessionPhase } from '@/types'

interface Props {
  sessionId: string
  phase: SessionPhase
}

export default function LectureNotesPanel({ sessionId, phase }: Props) {
  const [note, setNote] = useState<LectureNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<Record<number, boolean>>({})

  const loadNote = useCallback(async () => {
    setLoading(true)
    const { note: n } = await fetchLectureNote(sessionId, phase)
    setNote(n)
    // Init checklist state
    if (n?.content?.checklist) {
      const initial: Record<number, boolean> = {}
      n.content.checklist.forEach((item, i) => {
        initial[i] = item.completed ?? false
      })
      setChecklist(initial)
    }
    setLoading(false)
  }, [sessionId, phase])

  useEffect(() => {
    loadNote()
  }, [loadNote])

  function toggleCheck(idx: number) {
    setChecklist((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="liquid-spinner" style={{ width: 20, height: 20 }} />
      </div>
    )
  }

  if (!note || !note.content) {
    return (
      <div className="text-center py-6">
        <p className="text-xs" style={{ color: '#9090B0' }}>
          No notes for the <strong>{phase}</strong> phase yet.
        </p>
      </div>
    )
  }

  const c = note.content

  return (
    <div className="flex flex-col gap-4">
      {/* Concept */}
      {c.concept && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: '#635BFF' }}>
            Concept
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: '#F0F0F7' }}>
            {c.concept}
          </p>
        </div>
      )}

      {/* Formula */}
      {c.formula && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(99, 91, 255, 0.06)', border: '1px solid rgba(99, 91, 255, 0.1)' }}
        >
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: '#635BFF' }}>
            Formula
          </h4>
          <p className="text-sm font-mono" style={{ color: '#A5B4FC' }}>
            {c.formula}
          </p>
        </div>
      )}

      {/* Task */}
      {c.task && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: '#635BFF' }}>
            Task
          </h4>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            {c.task}
          </p>
        </div>
      )}

      {/* Discussion question */}
      {c.discussion_question && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(100, 80, 200, 0.06)', border: '1px solid rgba(100, 80, 200, 0.1)' }}
        >
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: '#9090B0' }}>
            💬 Discussion
          </h4>
          <p className="text-sm italic" style={{ color: '#F0F0F7' }}>
            {c.discussion_question}
          </p>
        </div>
      )}

      {/* Tags */}
      {c.tags && c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((tag, i) => (
            <span key={i} className="badge-muted text-[10px] px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist */}
      {c.checklist && c.checklist.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: '#635BFF' }}>
            Checklist
          </h4>
          <div className="flex flex-col gap-1.5">
            {c.checklist.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-2 cursor-pointer group text-sm"
                style={{ color: checklist[i] ? '#9090B0' : '#F0F0F7' }}
              >
                <div
                  onClick={() => toggleCheck(i)}
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: checklist[i] ? '#635BFF' : 'rgba(46, 46, 69, 0.5)',
                    border: checklist[i] ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {checklist[i] && <span className="text-[10px] text-white">✓</span>}
                </div>
                <span className={checklist[i] ? 'line-through' : ''}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
