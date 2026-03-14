-- ============================================================
-- Proofgrad — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- -------------------------------------------------------
-- 1. TABLES
-- -------------------------------------------------------

-- Users (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')) DEFAULT 'student',
  phone TEXT,
  year_of_study TEXT,
  accommodation TEXT CHECK (accommodation IN ('hostel', 'day_scholar')),
  instagram TEXT,
  linkedin TEXT,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  phase TEXT DEFAULT 'lobby' CHECK (phase IN ('lobby', 'survey', 'dataset', 'analysis', 'quiz', 'ended')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session students (supports both guest and registered users)
CREATE TABLE public.session_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, nickname)
);

-- Surveys
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Survey responses
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  session_student_id UUID REFERENCES public.session_students(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, session_student_id)
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz responses
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  session_student_id UUID REFERENCES public.session_students(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quiz_id, session_student_id)
);

-- Lecture notes (per session phase)
CREATE TABLE public.lecture_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  phase TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, phase)
);

-- Blog articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  pinned_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------
-- 2. AUTH TRIGGER — auto-create public.users on signup
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- -------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- USERS policies
-- -------------------------------------------------------
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- SESSIONS policies
-- -------------------------------------------------------

-- Instructors manage their own sessions
CREATE POLICY "sessions_instructor_all"
  ON public.sessions FOR ALL
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Anyone can read a session by join_code (student join flow)
CREATE POLICY "sessions_select_by_join_code"
  ON public.sessions FOR SELECT
  USING (status = 'active');

-- -------------------------------------------------------
-- SESSION_STUDENTS policies
-- -------------------------------------------------------

-- Anyone can insert (guest join — no auth required)
CREATE POLICY "session_students_insert_anyone"
  ON public.session_students FOR INSERT
  WITH CHECK (true);

-- Instructors can see all students in their sessions
CREATE POLICY "session_students_select_instructor"
  ON public.session_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- Registered students can see their own record
CREATE POLICY "session_students_select_own"
  ON public.session_students FOR SELECT
  USING (user_id = auth.uid());

-- Instructors can update session_students (e.g., link guest to user after signup)
CREATE POLICY "session_students_update_instructor"
  ON public.session_students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- SURVEYS policies
-- -------------------------------------------------------

-- Instructors CRUD their session surveys
CREATE POLICY "surveys_instructor_all"
  ON public.surveys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- Session participants can read surveys
CREATE POLICY "surveys_select_participants"
  ON public.surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_students ss
      WHERE ss.session_id = session_id
        AND (ss.user_id = auth.uid() OR ss.user_id IS NULL)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- RESPONSES policies
-- -------------------------------------------------------

-- Anyone can insert responses (guests use session_student_id, no auth.uid check)
CREATE POLICY "responses_insert_anyone"
  ON public.responses FOR INSERT
  WITH CHECK (true);

-- Instructors can read all responses for their sessions
CREATE POLICY "responses_select_instructor"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys sv
      JOIN public.sessions s ON s.id = sv.session_id
      WHERE sv.id = survey_id AND s.instructor_id = auth.uid()
    )
  );

-- Session participants can read all responses (anonymised dataset)
CREATE POLICY "responses_select_participants"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys sv
      JOIN public.session_students ss ON ss.session_id = sv.session_id
      WHERE sv.id = survey_id
        AND (ss.user_id = auth.uid())
    )
  );

-- -------------------------------------------------------
-- QUIZZES policies
-- -------------------------------------------------------

CREATE POLICY "quizzes_instructor_all"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

CREATE POLICY "quizzes_select_participants"
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_students ss
      WHERE ss.session_id = session_id AND ss.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- QUIZ_RESPONSES policies
-- -------------------------------------------------------

CREATE POLICY "quiz_responses_insert_anyone"
  ON public.quiz_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "quiz_responses_select_instructor"
  ON public.quiz_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.sessions s ON s.id = q.session_id
      WHERE q.id = quiz_id AND s.instructor_id = auth.uid()
    )
  );

CREATE POLICY "quiz_responses_select_own"
  ON public.quiz_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_students ss
      WHERE ss.id = session_student_id AND ss.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- LECTURE_NOTES policies
-- -------------------------------------------------------

CREATE POLICY "lecture_notes_instructor_all"
  ON public.lecture_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.instructor_id = auth.uid()
    )
  );

CREATE POLICY "lecture_notes_select_participants"
  ON public.lecture_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_students ss
      WHERE ss.session_id = session_id AND ss.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- ARTICLES policies
-- -------------------------------------------------------

-- Anyone can read published articles
CREATE POLICY "articles_select_all"
  ON public.articles FOR SELECT
  USING (true);

-- Instructors manage their own articles
CREATE POLICY "articles_instructor_all"
  ON public.articles FOR ALL
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- -------------------------------------------------------
-- 4. REALTIME — enable for relevant tables
-- -------------------------------------------------------
-- Run these in the Supabase dashboard under Realtime > Tables,
-- or add via the replication publication:
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_students;
