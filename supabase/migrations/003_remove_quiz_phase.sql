-- ============================================================
-- Remove 'quiz' from session phases
-- ============================================================

-- Update the check constraint on sessions.phase
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_phase_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_phase_check
  CHECK (phase IN ('lobby', 'survey', 'dataset', 'analysis', 'ended'));

-- Update any sessions stuck in 'quiz' phase to 'analysis'
UPDATE public.sessions SET phase = 'analysis' WHERE phase = 'quiz';
