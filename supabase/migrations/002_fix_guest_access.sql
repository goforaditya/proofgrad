-- ============================================================
-- Fix: Allow guest (anonymous) access to surveys, responses,
-- and session_students for the student flow.
-- Guests have no auth.uid() — they use the anon key.
-- ============================================================

-- -------------------------------------------------------
-- SURVEYS: Allow anyone to read active surveys
-- (students need to see the survey to fill it out)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "surveys_select_participants" ON public.surveys;

CREATE POLICY "surveys_select_active"
  ON public.surveys FOR SELECT
  USING (is_active = true);

CREATE POLICY "surveys_select_instructor"
  ON public.surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- Also let instructors read their inactive surveys
CREATE POLICY "surveys_select_instructor_inactive"
  ON public.surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- SESSION_STUDENTS: Allow anyone to read students in a
-- session (needed for dataset view nicknames)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "session_students_select_instructor" ON public.session_students;
DROP POLICY IF EXISTS "session_students_select_own" ON public.session_students;

CREATE POLICY "session_students_select_anyone"
  ON public.session_students FOR SELECT
  USING (true);

-- -------------------------------------------------------
-- RESPONSES: Allow anyone to read responses (anonymised dataset)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "responses_select_instructor" ON public.responses;
DROP POLICY IF EXISTS "responses_select_participants" ON public.responses;

CREATE POLICY "responses_select_anyone"
  ON public.responses FOR SELECT
  USING (true);

-- -------------------------------------------------------
-- SURVEYS: Also allow reading all surveys in a session
-- (for dataset view — need to read closed surveys too)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "surveys_select_active" ON public.surveys;
DROP POLICY IF EXISTS "surveys_select_instructor" ON public.surveys;
DROP POLICY IF EXISTS "surveys_select_instructor_inactive" ON public.surveys;

-- Simple: anyone can read any survey
CREATE POLICY "surveys_select_anyone"
  ON public.surveys FOR SELECT
  USING (true);
