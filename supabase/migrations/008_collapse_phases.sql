-- Collapse session phases from 5 (lobby, survey, dataset, analysis, ended)
-- to 3 (lobby, active, ended) for simultaneous access.

-- Convert existing mid-session phases to 'active'
UPDATE public.sessions SET phase = 'active' WHERE phase IN ('survey', 'dataset', 'analysis');

-- Drop old constraint and add new one
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_phase_check;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_phase_check CHECK (phase IN ('lobby', 'active', 'ended'));
