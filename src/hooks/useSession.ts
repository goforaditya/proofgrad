import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Session, SessionStudent, GuestState } from '@/types'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Create a new session (instructor only).
 */
export function useCreateSession() {
  const { user } = useAuth()

  return useCallback(
    async (title: string): Promise<{ session: Session | null; error: string | null }> => {
      if (!user || user.role !== 'instructor') {
        return { session: null, error: 'Only instructors can create sessions.' }
      }

      const joinCode = generateJoinCode()

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          instructor_id: user.id,
          title,
          join_code: joinCode,
          phase: 'lobby',
          status: 'active',
        })
        .select()
        .single()

      if (error) return { session: null, error: error.message }
      return { session: data as Session, error: null }
    },
    [user]
  )
}

/**
 * Fetch a session by join code.
 */
export async function fetchSessionByCode(
  joinCode: string
): Promise<{ session: Session | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase().trim())
    .eq('status', 'active')
    .maybeSingle()

  if (error) return { session: null, error: 'Session not found or already ended.' }
  if (!data) return { session: null, error: 'Session not found or already ended.' }
  return { session: data as Session, error: null }
}

/**
 * Fetch a session by ID.
 */
export async function fetchSessionById(
  sessionId: string
): Promise<{ session: Session | null; error: string | null }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) return { session: null, error: 'Could not load session.' }
  if (!data) return { session: null, error: 'Session not found.' }
  return { session: data as Session, error: null }
}

/**
 * Fetch all sessions for the current instructor.
 */
export async function fetchInstructorSessions(
  instructorId: string
): Promise<Session[]> {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Session[]
}

/**
 * Join a session as guest or registered student.
 * Returns the session_student record.
 */
export async function joinSession(
  sessionId: string,
  nickname: string,
  userId?: string
): Promise<{ student: SessionStudent | null; error: string | null }> {
  // If logged-in user, check if they already joined this session
  if (userId) {
    const existing = await fetchMySessionStudent(sessionId, userId)
    if (existing) return { student: existing, error: null }
  }

  const { data, error } = await supabase
    .from('session_students')
    .insert({
      session_id: sessionId,
      user_id: userId ?? null,
      nickname: nickname.trim(),
      is_guest: !userId,
    })
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return { student: null, error: 'That nickname is already taken in this session.' }
    }
    return { student: null, error: error.message }
  }

  if (!data) return { student: null, error: 'Failed to join session.' }
  return { student: data as SessionStudent, error: null }
}

/**
 * Look up the session_student record for an authenticated user in a given session.
 */
export async function fetchMySessionStudent(
  sessionId: string,
  userId: string
): Promise<SessionStudent | null> {
  const { data } = await supabase
    .from('session_students')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data as SessionStudent) ?? null
}

/**
 * Fetch all students in a session.
 */
export async function fetchSessionStudents(
  sessionId: string
): Promise<SessionStudent[]> {
  const { data } = await supabase
    .from('session_students')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true })

  return (data ?? []) as SessionStudent[]
}

/**
 * Start a session (lobby → active).
 */
export async function startSession(
  sessionId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sessions')
    .update({ phase: 'active' })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * End a session.
 */
export async function endSession(
  sessionId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sessions')
    .update({ phase: 'ended', status: 'ended' })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Build GuestState for sessionStorage.
 */
export function buildGuestState(
  session: Session,
  student: SessionStudent
): GuestState {
  return {
    nickname: student.nickname,
    sessionId: session.id,
    sessionStudentId: student.id,
    joinCode: session.join_code,
  }
}
