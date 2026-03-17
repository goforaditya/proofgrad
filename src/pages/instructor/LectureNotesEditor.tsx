import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { fetchAllLectureNotes, upsertLectureNote } from '@/hooks/useLectureNotes'
import type { LectureNoteContent } from '@/types'

const NOTE_CATEGORIES = ['survey', 'dataset', 'analysis']

export default function LectureNotesEditor() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [selectedPhase, setSelectedPhase] = useState('survey')
  const [notes, setNotes] = useState<Record<string, LectureNoteContent>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [concept, setConcept] = useState('')
  const [formula, setFormula] = useState('')
  const [task, setTask] = useState('')
  const [discussion, setDiscussion] = useState('')
  const [tags, setTags] = useState('')
  const [checklistText, setChecklistText] = useState('')

  const loadNotes = useCallback(async () => {
    if (!sessionId) return
    const all = await fetchAllLectureNotes(sessionId)
    const map: Record<string, LectureNoteContent> = {}
    all.forEach((n) => { map[n.phase] = n.content })
    setNotes(map)
    setLoading(false)
  }, [sessionId])

  useEffect(() => { loadNotes() }, [loadNotes])

  // When phase changes, load that phase's content
  useEffect(() => {
    const c = notes[selectedPhase]
    setConcept(c?.concept ?? '')
    setFormula(c?.formula ?? '')
    setTask(c?.task ?? '')
    setDiscussion(c?.discussion_question ?? '')
    setTags(c?.tags?.join(', ') ?? '')
    setChecklistText(c?.checklist?.map((i) => i.label).join('\n') ?? '')
    setSaved(false)
  }, [selectedPhase, notes])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!sessionId) return

    setSaving(true)
    const content: LectureNoteContent = {
      concept: concept || undefined,
      formula: formula || undefined,
      task: task || undefined,
      discussion_question: discussion || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      checklist: checklistText
        ? checklistText.split('\n').filter(Boolean).map((l) => ({ label: l.trim() }))
        : undefined,
    }

    const { error } = await upsertLectureNote(sessionId, selectedPhase, content)
    if (error) {
      console.error(error)
    } else {
      setNotes((prev) => ({ ...prev, [selectedPhase]: content }))
      setSaved(true)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <AppShell showSidebar>
        <div className="flex items-center justify-center py-20">
          <div className="liquid-spinner" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showSidebar>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 fade-in-up">
          <button
            onClick={() => navigate(`/instructor/session/${sessionId}`)}
            className="text-xs mb-2 inline-block"
            style={{ color: '#9090B0' }}
          >
            ← Back to session
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#F0F0F7' }}>
            Lecture Notes
          </h1>
          <p className="text-sm" style={{ color: '#9090B0' }}>
            Add notes per section. Students see them in the side panel.
          </p>
        </div>

        {/* Section selector */}
        <div className="flex gap-2 mb-6 flex-wrap fade-in-up">
          {NOTE_CATEGORIES.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPhase(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPhase === p ? 'btn-liquid' : 'btn-ghost'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
              {notes[p] ? ' ●' : ''}
            </button>
          ))}
        </div>

        {/* Editor */}
        <form onSubmit={handleSave} className="glass p-6 space-y-4 fade-in-up">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Key concept
            </label>
            <textarea
              value={concept}
              onChange={(e) => { setConcept(e.target.value); setSaved(false) }}
              placeholder="What students should understand…"
              rows={3}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Formula
            </label>
            <input
              value={formula}
              onChange={(e) => { setFormula(e.target.value); setSaved(false) }}
              placeholder="e.g. CPI = Σ(weight × price)"
              className="glass-input w-full px-4 py-2.5 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Task for students
            </label>
            <textarea
              value={task}
              onChange={(e) => { setTask(e.target.value); setSaved(false) }}
              placeholder="What students should do during this phase…"
              rows={2}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Discussion question
            </label>
            <input
              value={discussion}
              onChange={(e) => { setDiscussion(e.target.value); setSaved(false) }}
              placeholder="A question to spark discussion…"
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Tags (comma-separated)
            </label>
            <input
              value={tags}
              onChange={(e) => { setTags(e.target.value); setSaved(false) }}
              placeholder="demand, supply, elasticity"
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9090B0' }}>
              Checklist (one item per line)
            </label>
            <textarea
              value={checklistText}
              onChange={(e) => { setChecklistText(e.target.value); setSaved(false) }}
              placeholder={"Fill out the survey\nBuild a histogram\nInterpret the scatter plot"}
              rows={4}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-liquid px-6 py-2.5"
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
