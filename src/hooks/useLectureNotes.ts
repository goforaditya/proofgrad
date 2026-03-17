import { supabase } from '@/lib/supabase'
import type { LectureNote, LectureNoteContent } from '@/types'

// -------------------------------------------------------
// Fetch lecture note for a session + phase
// -------------------------------------------------------
export async function fetchLectureNote(
  sessionId: string,
  phase: string
): Promise<{ note: LectureNote | null; error: string | null }> {
  const { data, error } = await supabase
    .from('lecture_notes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('phase', phase)
    .maybeSingle()

  if (error) return { note: null, error: error.message }
  return { note: data as LectureNote | null, error: null }
}

// -------------------------------------------------------
// Fetch all lecture notes for a session
// -------------------------------------------------------
export async function fetchAllLectureNotes(
  sessionId: string
): Promise<LectureNote[]> {
  const { data } = await supabase
    .from('lecture_notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return (data ?? []) as LectureNote[]
}

// -------------------------------------------------------
// Upsert lecture note (instructor)
// -------------------------------------------------------
export async function upsertLectureNote(
  sessionId: string,
  phase: string,
  content: LectureNoteContent
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('lecture_notes')
    .upsert(
      { session_id: sessionId, phase, content },
      { onConflict: 'session_id,phase' }
    )

  if (error) return { error: error.message }
  return { error: null }
}
