You are helping me build **Proofgrad** — an AI-powered live lecture and data analysis learning platform for BA Economics students at Manipal University Jaipur.

## Product concept

During a lecture, the instructor creates a live session. Students join by scanning a QR code (no signup required — they join as guests with a nickname). The instructor launches a survey, students fill it out (including uploading a screen time screenshot that gets OCR'd), and once the survey closes, an anonymised dataset of all class responses is released. Students then use an analysis workspace to build charts (histogram, scatter, bar, pie, demand curve) with AI-generated plain-English interpretations. The instructor can launch live quizzes with real-time result charts. Everything syncs in real-time.

There are two user roles:
1. **Instructor** — creates sessions, builds surveys, writes lecture notes, launches quizzes, monitors student activity, publishes blog articles
2. **Student** — joins sessions via QR/code, fills surveys, uploads screenshots, runs analyses, answers quizzes, exports portfolio PDF

## Tech stack (final decisions)

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Recharts + React Router v6 + React Query + `qrcode.react` + `papaparse` (CSV export) + `jsPDF` + `html2canvas` (PDF export)
- **Backend**: Supabase only — no custom Express server
  - Supabase Auth (email + password)
  - Supabase PostgreSQL with Row Level Security
  - Supabase Realtime (channels for session phase sync, survey launches, quiz pushes, response counters)
  - Supabase Storage (screenshot uploads)
  - Supabase Edge Functions (Deno) — only for AI endpoints
- **OCR**: Tesseract.js (client-side, primary) with Google Cloud Vision API fallback for low-confidence results
- **AI**: Claude claude-sonnet-4-20250514 via Anthropic SDK in edge functions — used for analysis suggestions, chart interpretations, quiz explanations (NOT for screenshot OCR)
- **Deployment**: Vercel (React SPA) + Supabase Cloud

## User flow and signup funnel

### Entry flow (zero friction during lecture):
1. Student scans QR code → joins session as guest (nickname only, no signup)
2. Fills survey normally, uploads screenshot → Tesseract.js extracts screen time data client-side
3. Sees anonymised dataset table with own row highlighted in purple
4. **CTA Gate 1**: "Create a free account to unlock AI analysis" → email + password signup (15 seconds)
5. Uses analysis workspace — charts, AI interpretations, lecture notes side panel, task checklist
6. **CTA Gate 2**: "Complete your profile to export portfolio" → collects phone, year of study, hostel/day scholar, Instagram/LinkedIn
7. Exports PDF portfolio with all charts, AI interpretations, notes, quiz scores

### Instructor flow:
1. Signs up with email + password, selects "Instructor" role
2. Creates a session → gets a join code + QR code (generated via `qrcode.react`)
3. Builds a survey with question types: number input, slider, multiple choice, scale 1-10, screenshot upload
4. Launches survey to live session → students see it immediately via Supabase Realtime
5. Monitors real-time response counter
6. Closes survey → dataset released to all students
7. Advances session phases: survey → dataset → analysis → quiz
8. Launches MCQ/numeric quizzes → sees live result bar chart
9. Can download all response data as CSV (via `papaparse`)
10. Can view student activity feed, session history
11. Can publish blog articles (markdown-based, pinnable to sessions)

## Database schema (Supabase PostgreSQL)

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
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
  instructor_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  phase TEXT DEFAULT 'lobby' CHECK (phase IN ('lobby', 'survey', 'dataset', 'analysis', 'quiz', 'ended')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session students (supports both guest and registered users)
CREATE TABLE public.session_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  user_id UUID REFERENCES public.users(id),  -- NULL for guests
  nickname TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, nickname)
);

-- Surveys
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,  -- [{type, label, options?, min?, max?, step?}]
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Survey responses
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) NOT NULL,
  session_student_id UUID REFERENCES public.session_students(id) NOT NULL,
  answers JSONB NOT NULL,  -- {question_index: value}
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, session_student_id)
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  questions JSONB NOT NULL,  -- [{question, type, options?, correct_answer, explanation?}]
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz responses
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) NOT NULL,
  session_student_id UUID REFERENCES public.session_students(id) NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quiz_id, session_student_id)
);

-- Lecture notes (per session phase)
CREATE TABLE public.lecture_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  phase TEXT NOT NULL,
  content JSONB NOT NULL,  -- {concept, formula, task, discussion_question, tags[], checklist[]}
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, phase)
);

-- Blog articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- Markdown
  tags TEXT[],
  pinned_session_id UUID REFERENCES public.sessions(id),
  published_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security policies needed
- Users can read/update their own profile
- Instructors can CRUD their own sessions, surveys, quizzes, lecture notes, articles
- Students can read sessions they've joined, read surveys/quizzes for those sessions, insert their own responses
- Guest students (no user_id) can still insert responses via session_student_id
- Anyone can read published articles
- Response data is readable by the session's instructor and anonymously by all session participants

## Supabase Realtime channels
- `session:{session_id}` — broadcasts phase changes, survey launches, quiz launches
- `responses:{survey_id}` — broadcasts response count updates
- `quiz_results:{quiz_id}` — broadcasts live quiz result tallies

## Edge functions (Supabase Deno)
Only 3 edge functions needed:

1. **`suggest-analysis`** — receives dataset summary, calls Claude, returns 3 suggested analysis cards with chart type + description
2. **`interpret-chart`** — receives chart data + type, calls Claude, returns 2-3 sentence plain-English interpretation using actual data values
3. **`interpret-quiz`** — receives quiz question + correct answer, calls Claude, returns explanation

## Screenshot OCR approach
- Suggest some way to do this and implement

## Project structure

```
proofgrad/
├── src/                          # React frontend (Vite)
│   ├── main.tsx
│   ├── App.tsx                   # Router setup
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── auth.tsx              # Auth context + hooks
│   │   └── realtime.ts           # Realtime channel helpers
│   ├── components/
│   │   ├── ui/                   # Shared UI components
│   │   ├── survey/               # Survey builder + form components
│   │   ├── analysis/             # Chart components (histogram, scatter, etc.)
│   │   ├── quiz/                 # Quiz overlay + result chart
│   │   └── layout/               # Sidebar, navbar, etc.
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── CompleteProfile.tsx
│   │   ├── instructor/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SessionControl.tsx
│   │   │   ├── SurveyBuilder.tsx
│   │   │   ├── QuizBuilder.tsx
│   │   │   └── ArticleEditor.tsx
│   │   ├── student/
│   │   │   ├── JoinSession.tsx
│   │   │   ├── SurveyForm.tsx
│   │   │   ├── DatasetView.tsx
│   │   │   ├── AnalysisWorkspace.tsx
│   │   │   ├── CpiBuilder.tsx
│   │   │   └── PortfolioExport.tsx
│   │   └── blog/
│   │       ├── ArticleFeed.tsx
│   │       └── ArticleView.tsx
│   ├── hooks/
│   │   ├── useSession.ts         # Session state + realtime
│   │   ├── useSurvey.ts
│   │   ├── useQuiz.ts
│   │   └── useAnalysis.ts
│   └── types/
│       └── index.ts              # All TypeScript types
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── suggest-analysis/index.ts
│       ├── interpret-chart/index.ts
│       └── interpret-quiz/index.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env                          # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

## UI design specs
- Clean, minimal, white surfaces
- Primary color: deep purple `#534AB7` (buttons, active states, student's highlighted row)
- Accent: teal `#1D9E75` (success states, secondary actions)
- Font: Inter (via Google Fonts)
- Mobile-responsive — students use phones during lectures
- Student analysis view: left side panel (280px, collapsible on mobile) for lecture notes + tasks, right main area for charts + AI output
- Instructor view: full-width dashboard with tabbed sections (Session Control, Surveys, Quizzes, Students, Articles)

## Analysis workspace chart types (Recharts)
1. **Histogram** — frequency distribution of a numeric variable, AI interpretation
2. **Bar chart** — categorical comparison, AI interpretation
3. **Scatter plot** — two numeric variables, line of best fit, r value, R² value, swap axes button
4. **Pie chart** — proportion breakdown, AI interpretation
5. **Line chart** — trend over ordered categories
6. **Step-down demand curve** — price on Y axis, quantity on X, price slider that updates highlighted quantity and shaded consumer surplus area in real-time

## CPI builder (Session 3 feature)
- Students enter budget weights (%) for spending categories (food, transport, housing, etc.)
- Weights must sum to 100%
- App computes weighted average price level from survey data
- Compares student-built CPI to a manually entered official CPI value
- Bar chart: Student CPI vs Official CPI
- Group comparison: hostel students vs day scholars (using accommodation field from profile)

## Environment variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Edge functions have access to:
SUPABASE_SERVICE_ROLE_KEY=  (auto-injected in edge functions)
ANTHROPIC_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=  (only if using Vision fallback)
```

## Build order (phases)

### Phase 1: Foundation
- Scaffold Vite + React + TypeScript + Tailwind project
- Set up Supabase project, run migration SQL
- Implement auth (signup with role selection, login, protected routes)
- Build basic layout components (navbar, sidebar, responsive shell)

### Phase 2: Live sessions
- Instructor creates session → generates join code + QR
- Student joins via code/QR as guest (nickname only)
- Supabase Realtime channel for session phase sync
- Instructor can advance phases; all connected students see transition

### Phase 3: Survey system
- Instructor survey builder (question types: number, slider, MCQ, scale, screenshot upload)
- Student survey form (mobile-friendly, progress indicator)
- Screenshot OCR via Tesseract.js with manual fallback
- Real-time response counter
- Close survey → release anonymised dataset

### Phase 4: Dataset + Analysis
- Dataset table view (sortable, own row highlighted)
- "Suggest analyses" button → edge function → Claude → 3 clickable analysis cards
- Chart components (histogram, bar, scatter, pie, line, demand curve)
- For each chart: edge function → Claude → 2-3 sentence interpretation
- Scatter plot: line of best fit, r, R², swap axes
- Demand curve: price slider, consumer surplus shading

### Phase 5: Quiz system
- Instructor quiz builder (MCQ + numeric)
- Launch quiz → students see overlay via Realtime
- Live result bar chart updates as students submit
- Reveal correct answer + Claude explanation

### Phase 6: Lecture notes + side panel
- Instructor writes notes per session phase (concept, formula, task, discussion question, tags)
- Student side panel shows notes synced to current phase
- Task checklist students can tick off

### Phase 7: Profile + export + blog
- Profile completion form (CTA Gate 2)
- Portfolio PDF export (html2canvas + jsPDF)
- CSV download for instructors (papaparse)
- Blog article editor (markdown) + feed + pin to session

### Phase 8: CPI builder
- Budget weight input (must sum to 100%)
- Weighted CPI calculation
- Comparison bar chart (student vs official, hostel vs day scholar)

---

Start with Phase 1. For each phase, first plan the implementation approach, then write the code. Ask me for any clarifications before proceeding.