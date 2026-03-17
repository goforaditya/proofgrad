-- Fix sessions_phase_check constraint
-- Drops ALL check constraints on the phase column (handles any auto-generated name)
-- then re-adds the correct 3-phase constraint.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
      AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'public.sessions'::regclass
      AND att.attname = 'phase'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.sessions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Convert any remaining old phase values
UPDATE public.sessions
SET phase = 'active'
WHERE phase IN ('survey', 'dataset', 'analysis', 'quiz');

-- Add the correct constraint
ALTER TABLE public.sessions
ADD CONSTRAINT sessions_phase_check
CHECK (phase IN ('lobby', 'active', 'ended'));
