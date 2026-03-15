-- ============================================================
-- Migration 004: Comments table for blog articles
-- ============================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "comments_select_all"
  ON public.comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);
