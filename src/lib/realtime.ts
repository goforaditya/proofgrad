import { supabase } from '@/lib/supabase'
import type { SessionChannelEvent, ResponseCountEvent } from '@/types'

type UnsubscribeFn = () => void

/**
 * Subscribe to session phase/survey events.
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
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Broadcast a session event (instructor only).
 * Creates a temporary channel, subscribes, sends, then cleans up.
 */
export async function broadcastSessionEvent(
  sessionId: string,
  event: SessionChannelEvent
): Promise<void> {
  const channelName = `session:${sessionId}`

  // Check if channel already exists (instructor's own subscription)
  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`)

  if (existing) {
    // Channel already subscribed, just send
    await existing.send({
      type: 'broadcast',
      event: event.type,
      payload: event,
    })
  } else {
    // Create a temporary channel, subscribe, send, then remove
    const channel = supabase.channel(channelName)
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
    })
    await channel.send({
      type: 'broadcast',
      event: event.type,
      payload: event,
    })
    // Small delay to ensure message is delivered before cleanup
    setTimeout(() => {
      supabase.removeChannel(channel)
    }, 500)
  }
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
