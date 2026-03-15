# Proofgrad

AI-powered live lecture and data analysis learning platform for BA Economics students. Instructors run live sessions with surveys, anonymized datasets, and interactive chart analysis. Students join via code/QR, respond to surveys, explore data, build charts, and export portfolios — all without requiring an account.

**Stack:** React 18 · Vite · TypeScript · Tailwind CSS · Supabase · Recharts

---

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run Supabase migrations (copy-paste into Supabase SQL Editor, in order)
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_fix_guest_access.sql
# 3. supabase/migrations/003_remove_quiz_phase.sql

# Start dev server
bun run dev
```

> **Supabase setup:** Disable email confirmation in Dashboard → Authentication → Providers → Email for local development.

---

## Features & File Map

### Authentication & Profiles

| Feature | Files | Route |
|---------|-------|-------|
| Email/password login | `src/pages/auth/Login.tsx` | `/auth/login` |
| Signup with role selection (student/instructor) | `src/pages/auth/Signup.tsx` | `/auth/signup` |
| Profile completion (phone, year, accommodation, socials) | `src/pages/auth/CompleteProfile.tsx` | `/auth/complete-profile` |
| Auth context + guest session management | `src/lib/auth.tsx` | — |
| Role-based route protection | `src/components/layout/ProtectedRoute.tsx` | — |

**Guest flow:** Students can join sessions without an account. Guest state is stored in `sessionStorage` as `proofgrad_guest`. CTA Gate 1 prompts signup when accessing analysis; CTA Gate 2 prompts profile completion for PDF export.

---

### Instructor Features

| Feature | Files | Route |
|---------|-------|-------|
| Dashboard — view/create sessions | `src/pages/instructor/Dashboard.tsx` | `/instructor/dashboard` |
| Session control — QR code, phase management, student list | `src/pages/instructor/SessionControl.tsx` | `/instructor/session/:sessionId` |
| Survey builder — create/edit/launch surveys with 5 question types | `src/pages/instructor/SurveyBuilder.tsx` | `/instructor/session/:sessionId/survey` |
| Lecture notes editor — per-phase notes with concept, formula, task, discussion, tags, checklist | `src/pages/instructor/LectureNotesEditor.tsx` | `/instructor/session/:sessionId/notes` |
| Article editor — write/publish blog articles with Markdown | `src/pages/instructor/ArticleEditor.tsx` | `/instructor/articles` |

**Session phases** (advanced manually by instructor): `lobby` → `survey` → `dataset` → `analysis` → `ended`

---

### Student Features

| Feature | Files | Route |
|---------|-------|-------|
| Join session — enter code or scan QR, guest nickname | `src/pages/student/JoinSession.tsx` | `/student/join` |
| Session view — see current phase + actions | `src/pages/student/SessionView.tsx` | `/student/session/:sessionId` |
| Survey form — answer questions, OCR screenshot upload | `src/pages/student/SurveyForm.tsx` | `/student/session/:sessionId/survey` |
| Dataset table — sortable, own-row highlighted, multi-survey selector | `src/pages/student/DatasetView.tsx` | `/student/session/:sessionId/dataset` |
| Analysis workspace — chart builder with suggestions + AI interpretation | `src/pages/student/AnalysisWorkspace.tsx` | `/student/session/:sessionId/analysis` |
| Portfolio export — PDF with html2canvas + jsPDF | `src/pages/student/PortfolioExport.tsx` | `/student/session/:sessionId/export` |
| CPI builder — weighted budget categories, comparison with official CPI | `src/pages/student/CpiBuilder.tsx` | `/student/session/:sessionId/cpi` |

---

### Blog

| Feature | Files | Route |
|---------|-------|-------|
| Article feed — public list of all articles | `src/pages/blog/ArticleFeed.tsx` | `/blog` |
| Article view — rendered with ReactMarkdown | `src/pages/blog/ArticleView.tsx` | `/blog/:articleId` |

---

### Chart Components (`src/components/analysis/`)

| Component | Chart Type | Description |
|-----------|-----------|-------------|
| `HistogramChart.tsx` | Histogram | Binned frequency distribution with stats row (mean, median, stdDev, range, n) |
| `BarChartView.tsx` | Bar | Categorical data bar chart with color coding |
| `ScatterChart.tsx` | Scatter | Scatter plot with regression line, r/R² values, swap axes, trend equation |
| `PieChartView.tsx` | Pie/Donut | Donut chart with percentage labels |
| `LineChartView.tsx` | Line | Trend line over categories |
| `DemandCurve.tsx` | Demand | Step-down demand curve with price slider, consumer surplus shading, revenue calc |
| `ChartCard.tsx` | Wrapper | Wraps any chart with "Interpret this chart" button (local + AI fallback) |

---

### Survey Question Types

Built in `src/components/survey/QuestionBuilder.tsx` (instructor) and rendered by `src/components/survey/QuestionRenderer.tsx` (student):

| Type | Description |
|------|-------------|
| `number` | Numeric input |
| `slider` | Range slider with min/max |
| `mcq` | Multiple choice (single select) |
| `scale` | 1–5 or 1–10 Likert scale |
| `screenshot` | Image upload with Tesseract.js OCR extraction |

---

## Architecture

### Directory Structure

```
src/
├── App.tsx                              # Router with all routes
├── main.tsx                             # Entry point, providers
├── index.css                            # Tailwind + liquid animations
├── types/index.ts                       # All TypeScript interfaces
│
├── lib/
│   ├── supabase.ts                      # Supabase client init
│   ├── auth.tsx                         # AuthProvider + useAuth hook
│   └── realtime.ts                      # Realtime channel subscriptions
│
├── hooks/
│   ├── useSession.ts                    # Session CRUD, join, phase management
│   ├── useSurvey.ts                     # Survey CRUD, responses, OCR upload
│   ├── useAnalysis.ts                   # Dataset building, stats, chart suggestions
│   ├── useLectureNotes.ts               # Lecture note fetch/upsert
│   └── useArticles.ts                   # Article CRUD
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                 # Main layout (navbar + sidebar + content)
│   │   ├── Navbar.tsx                   # Top nav bar
│   │   ├── InstructorSidebar.tsx        # Instructor side nav
│   │   ├── StudentPanel.tsx             # Student info panel
│   │   ├── LectureNotesPanel.tsx        # Lecture notes display
│   │   └── ProtectedRoute.tsx           # Auth + role guard
│   ├── survey/
│   │   ├── QuestionBuilder.tsx          # Question editor (instructor)
│   │   └── QuestionRenderer.tsx         # Question form (student)
│   └── analysis/
│       ├── ChartCard.tsx
│       ├── HistogramChart.tsx
│       ├── BarChartView.tsx
│       ├── ScatterChart.tsx
│       ├── PieChartView.tsx
│       ├── LineChartView.tsx
│       └── DemandCurve.tsx
│
├── pages/
│   ├── auth/        (Login, Signup, CompleteProfile)
│   ├── instructor/  (Dashboard, SessionControl, SurveyBuilder, LectureNotesEditor, ArticleEditor)
│   ├── student/     (JoinSession, SessionView, SurveyForm, DatasetView, AnalysisWorkspace, PortfolioExport, CpiBuilder)
│   └── blog/        (ArticleFeed, ArticleView)
│
supabase/migrations/
├── 001_initial_schema.sql               # Tables, auth trigger, RLS policies
├── 002_fix_guest_access.sql             # Guest-friendly RLS for surveys/responses
└── 003_remove_quiz_phase.sql            # Remove quiz from phase constraint
```

### Data Models (from `src/types/index.ts`)

| Type | Key Fields |
|------|------------|
| `User` | id, email, name, role, phone, year_of_study, accommodation, profile_completed |
| `Session` | id, instructor_id, title, join_code, phase, status, created_at |
| `SessionStudent` | id, session_id, user_id, nickname, is_guest |
| `Survey` | id, session_id, title, questions (SurveyQuestion[]), is_active |
| `Response` | id, survey_id, session_student_id, answers (Record<string, any>) |
| `LectureNote` | id, session_id, phase, content (LectureNoteContent) |
| `Article` | id, author_id, title, body, tags, pinned_session_id, published |

### Realtime Events (`src/lib/realtime.ts`)

| Channel | Events |
|---------|--------|
| `session:{sessionId}` | `phase_change` (new phase), `survey_launched` (survey ID) |
| `responses:{surveyId}` | `new_response` (response count) |

---

## Database Setup

Run these SQL files in order via **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

1. **`001_initial_schema.sql`** — Creates all tables, auth trigger (auto-creates `public.users` on signup), RLS policies, and realtime publication
2. **`002_fix_guest_access.sql`** — Opens surveys, responses, and session_students for anonymous/guest reads
3. **`003_remove_quiz_phase.sql`** — Removes `'quiz'` from session phase CHECK constraint

---

## Testing Walkthrough

### Instructor Flow

1. Sign up at `/auth/signup` → select "Instructor" → redirects to `/instructor/dashboard`
2. Click **Create Session** → enter title → lands on session control page with QR code and join code
3. Click **Manage Surveys** → add questions (number, slider, mcq, scale, screenshot) → save → launch survey
4. Advance phase: `lobby` → `survey` → `dataset` → `analysis` → `ended`
5. Open **Lecture Notes** → add notes for each phase (concept, formula, task, discussion, tags, checklist)
6. Open **Articles** → write a Markdown blog post → publish

### Student Flow (Guest)

1. Go to `/student/join` → enter join code + nickname → join session
2. When survey is active: fill out survey form → submit
3. In dataset phase: view anonymized response table (your row highlighted) → sort columns, switch between surveys
4. In analysis phase: see chart suggestions → click to build charts → "Interpret this chart" for AI/local analysis
5. Open **CPI Builder** → adjust budget weights and price levels → compare with official CPI
6. Open **Portfolio Export** → download PDF summary (requires signup + profile completion)

### Blog

1. Visit `/blog` → see all published articles
2. Click article → view rendered Markdown

---

## Theme

Dark-only UI with pink accents and liquid glassmorphism:

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0D0D12` | App background |
| Surface | `#1A1A26` | Cards, panels |
| Elevated | `#242436` | Modals, dropdowns |
| Primary | `#E8447A` | Buttons, CTAs, active states |
| Primary Light | `#FF6BA8` | Hover, highlights |
| Accent | `#FF9EC8` | Badges, own-row highlight |
| Text | `#F0F0F7` | Body text |
| Muted | `#9090B0` | Labels, secondary text |
| Border | `#2E2E45` | Dividers, input borders |

---

## Deployment

Configured for **Vercel** with `vercel.json` SPA rewrite. Deploy with:

```bash
bunx vercel
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
