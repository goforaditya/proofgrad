-- ============================================================
-- 009: Resource Links (global instructor-curated links)
-- ============================================================

-- Links table
CREATE TABLE IF NOT EXISTS public.resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  niche TEXT NOT NULL DEFAULT 'General',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reactions (smile, upvote, poop) — one per user per emoji per link
CREATE TABLE IF NOT EXISTS public.link_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.resource_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('smile', 'upvote', 'poop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (link_id, user_id, emoji)
);

-- Comments on links (profile-completed users only — enforced in app)
CREATE TABLE IF NOT EXISTS public.link_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.resource_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_links_niche ON public.resource_links(niche);
CREATE INDEX IF NOT EXISTS idx_link_reactions_link ON public.link_reactions(link_id);
CREATE INDEX IF NOT EXISTS idx_link_comments_link ON public.link_comments(link_id);

-- RLS
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_comments ENABLE ROW LEVEL SECURITY;

-- Resource links: anyone can read, instructors can manage their own
CREATE POLICY "resource_links_select" ON public.resource_links FOR SELECT USING (true);
CREATE POLICY "resource_links_insert" ON public.resource_links FOR INSERT WITH CHECK (
  auth.uid() = instructor_id
);
CREATE POLICY "resource_links_update" ON public.resource_links FOR UPDATE USING (
  auth.uid() = instructor_id
);
CREATE POLICY "resource_links_delete" ON public.resource_links FOR DELETE USING (
  auth.uid() = instructor_id
);

-- Reactions: anyone can read, authenticated users manage their own
CREATE POLICY "link_reactions_select" ON public.link_reactions FOR SELECT USING (true);
CREATE POLICY "link_reactions_insert" ON public.link_reactions FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "link_reactions_delete" ON public.link_reactions FOR DELETE USING (
  auth.uid() = user_id
);

-- Comments: anyone can read, authenticated users manage their own
CREATE POLICY "link_comments_select" ON public.link_comments FOR SELECT USING (true);
CREATE POLICY "link_comments_insert" ON public.link_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "link_comments_delete" ON public.link_comments FOR DELETE USING (
  auth.uid() = user_id
);
