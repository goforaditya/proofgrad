import { supabase } from '@/lib/supabase'
import type { SessionChannelEvent, ResponseCountEvent } from '@/types'

type UnsubscribeFn = () => void

/**
 * Subscribe to session phase/survey/quiz events.
 * Used by both instructor and student.
 */
export function subscribeToSession(
  sessionId: string,
  onEvent: (event: SessionChannelEvent) => void
): UnsubscribeFn {
  const channel = supabase
    .channel(`session:${sessionId}`)
    .on('broadcast', { event: 'phase_change' }, ({ payload }) => {
      onEvent(payload as SessionChannelEvent)
    })
    .on('broadcast', { event: 'survey_launched' }, ({ payload }) => {
      onEvent(payload as SessionChannelEvent)
    })
    .on('broadcast', { event: 'quiz_launched' }, ({ payload }) => {
      onEvent(payload as SessionChannelEvent)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Broadcast a session event (instructor only).
 */
export async function broadcastSessionEvent(
  sessionId: string,
  event: SessionChannelEvent
): Promise<void> {
  await supabase.channel(`session:${sessionId}`).send({
    type: 'broadcast',
    event: event.type,
    payload: event,
  })
}

/**
 * Subscribe to response count updates for a survey.
 */
export function subscribeToResponseCount(
  surveyId: string,
  onCount: (count: number) => void
): UnsubscribeFn {
  const channel = supabase
    .channel(`responses:${surveyId}`)
    .on('broadcast', { event: 'response_count' }, ({ payload }) => {
      const e = payload as ResponseCountEvent
      onCount(e.count)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to live quiz result tallies.
 */
export function subscribeToQuizResults(
  quizId: string,
  onResults: (results: Record<string, number>) => void
): UnsubscribeFn {
  const channel = supabase
    .channel(`quiz_results:${quizId}`)
    .on('broadcast', { event: 'quiz_result' }, ({ payload }) => {
      onResults(payload as Record<string, number>)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
