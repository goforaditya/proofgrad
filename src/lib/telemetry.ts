import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Visitor identity (anonymous per-tab session)
// ---------------------------------------------------------------------------
function getVisitorId(): string {
  let vid = sessionStorage.getItem('pg_vid')
  if (!vid) {
    vid = crypto.randomUUID()
    sessionStorage.setItem('pg_vid', vid)
  }
  return vid
}

// ---------------------------------------------------------------------------
// User identity (set when authenticated)
// ---------------------------------------------------------------------------
let _userId: string | null = null
let _userName: string | null = null
let _userEmail: string | null = null

export function setTelemetryUser(id: string | null, name?: string | null, email?: string | null) {
  _userId = id
  _userName = name ?? null
  _userEmail = email ?? null
}

// ---------------------------------------------------------------------------
// Event buffer
// ---------------------------------------------------------------------------
interface BufferedEvent {
  visitor_id: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  event: string
  path: string
  meta: Record<string, unknown>
}

let buffer: BufferedEvent[] = []

export function track(event: string, meta: Record<string, unknown> = {}) {
  buffer.push({
    visitor_id: getVisitorId(),
    user_id: _userId,
    user_name: _userName,
    user_email: _userEmail,
    event,
    path: window.location.pathname,
    meta,
  })

  // Auto-flush if buffer is large
  if (buffer.length >= 20) {
    flush()
  }
}

// ---------------------------------------------------------------------------
// Flush — batch insert, fire-and-forget
// ---------------------------------------------------------------------------
export function flush() {
  if (buffer.length === 0) return

  const batch = [...buffer]
  buffer = []

  // Fire-and-forget — no await, no error handling
  supabase.from('page_events').insert(batch).then(() => {})
}

// Beacon flush for page unload (sendBeacon uses Supabase REST API directly)
function beaconFlush() {
  if (buffer.length === 0) return

  const batch = [...buffer]
  buffer = []

  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_events`
  const headers = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    Prefer: 'return=minimal',
  }

  // Use fetch with keepalive for reliable page-unload delivery
  fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
      keepalive: true,
    }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Auto-flush setup (called once on module load)
// ---------------------------------------------------------------------------
function setupAutoFlush() {
  // Periodic flush every 30s
  setInterval(flush, 30_000)

  // Flush when tab becomes hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      beaconFlush()
    }
  })

  // Flush on page unload
  window.addEventListener('beforeunload', beaconFlush)
}

setupAutoFlush()

// ---------------------------------------------------------------------------
// View count queries (for blog articles)
// ---------------------------------------------------------------------------
export async function getViewCounts(paths: string[]): Promise<Record<string, number>> {
  if (paths.length === 0) return {}

  const { data } = await supabase
    .from('page_events')
    .select('path')
    .eq('event', 'page_view')
    .in('path', paths)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.path] = (counts[row.path] || 0) + 1
  }
  return counts
}

export async function getViewCount(path: string): Promise<number> {
  const counts = await getViewCounts([path])
  return counts[path] ?? 0
}
