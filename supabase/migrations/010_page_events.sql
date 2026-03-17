-- ============================================================
-- 010: Lightweight telemetry — page events
-- ============================================================

CREATE TABLE public.page_events (
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  event TEXT NOT NULL,
  path TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for reads
CREATE INDEX idx_page_events_created ON public.page_events(created_at);
CREATE INDEX idx_page_events_event ON public.page_events(event);
CREATE INDEX idx_page_events_pageview_path ON public.page_events(path) WHERE event = 'page_view';

-- RLS
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous + authenticated)
CREATE POLICY "page_events_insert" ON public.page_events FOR INSERT WITH CHECK (true);

-- Only instructors can read (for future analytics dashboards)
CREATE POLICY "page_events_select" ON public.page_events FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.users WHERE role = 'instructor')
);

-- Public can count page_views (for blog view counts)
CREATE POLICY "page_events_count" ON public.page_events FOR SELECT USING (
  event = 'page_view'
);
