<p align="center">
  <img src="public/logo.svg" alt="Proofgrad Logo" width="64" />
</p>

<h1 align="center">Proofgrad</h1>

<p align="center">
  <strong>AI-powered data collection, analysis & learning platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#database">Database</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel&logoColor=white" />
</p>

---

## Overview

Proofgrad started as a guest-lecture companion and has evolved into a full-featured platform for **live data collection, interactive analysis, blogging, and curated resource sharing**. Instructors create sessions with surveys, datasets, and lecture notes; students (or guests) join via code/QR, respond to surveys, explore anonymized data through AI-powered chart analysis, build CPI indices, and export portfolio PDFs — all without requiring an account.

The platform also hosts a **Markdown blog** with SEO-optimized Open Graph previews, article comments, and view-count telemetry, plus a **Resources hub** (inspired by Hacker News / Lobsters) with niche-filterable links, emoji reactions, and threaded comments.

---

## Features

### 🎓 Live Sessions & Surveys

| Capability | Description |
|---|---|
| **Session lifecycle** | `lobby` → `active` → `ended` — instructor controls phase transitions |
| **QR code + join code** | Students join instantly; guest mode requires only a nickname |
| **Survey builder** | 5 question types — `number`, `slider`, `mcq`, `scale`, `screenshot` (OCR via Tesseract.js) |
| **Real-time sync** | Phase changes & survey launches broadcast via Supabase Realtime channels |
| **Lecture notes** | Per-phase structured notes (concept, formula, task, discussion, tags, checklist) |

### 📊 Data Analysis & Visualization

| Chart | Component | Highlights |
|---|---|---|
| Histogram | `HistogramChart.tsx` | Binned frequency distribution, stats row (mean, median, stdDev, range, n) |
| Bar | `BarChartView.tsx` | Categorical data with color coding |
| Scatter | `ScatterChart.tsx` | Regression line, r / R² values, swap axes, trend equation |
| Pie / Donut | `PieChartView.tsx` | Donut chart with percentage labels |
| Line | `LineChartView.tsx` | Trend line over categories |
| Demand Curve | `DemandCurve.tsx` | Step-down demand curve, price slider, consumer surplus shading, revenue calc |

- **AI chart interpretation** — each chart has an "Interpret this chart" button (local heuristics + AI fallback)
- **Smart suggestions** — the analysis engine suggests appropriate chart types based on column datatypes
- **CPI Builder** — build weighted personal Consumer Price Index, compare with official CPI data

### ✍️ Blog Platform

- Rich **Markdown editor** with toolbar (bold, italic, headings, links, images, code blocks)
- **Slug-based routing** — SEO-friendly URLs (`/blog/my-article-slug`)
- **Comment system** — authenticated users can comment on articles
- **View count tracking** — per-article telemetry via `page_events` table
- **Dynamic OG images** — Vercel Edge function generates beautiful social preview cards at `/api/og`
- **Edge middleware** — rewrites `<meta>` tags on `/blog/:slug` for Twitter/Facebook/LinkedIn previews

### 📚 Resources Hub

- **Instructor-curated links** — organized by niche/topic with descriptions
- **Niche filter pills** — colorful, one-click filtering by category
- **Emoji reactions** — 👍 upvote, 😊 smile, 💩 poop — one per user per emoji per link
- **Threaded comments** — discussion on each resource link
- **Profile gating** — non-profile-completed users see a limited preview (first 2 links)

### 🔐 Auth & Profiles

- **Email/password authentication** via Supabase Auth
- **Role-based access** — `student` and `instructor` roles with protected routes
- **Guest mode** — students join sessions without signing up; state stored in `sessionStorage`
- **Progressive profiling** — CTA gates prompt signup for analysis access and profile completion for PDF export
- **Profile fields** — phone, year of study, accommodation, Instagram, LinkedIn, Snapchat

### 📈 Telemetry & Analytics

- **Lightweight event tracking** — buffered client-side events flushed every 30s or on page unload
- **Beacon flush** — `fetch(..., { keepalive: true })` ensures events survive page navigation
- **Blog view counts** — `getViewCount()` / `getViewCounts()` queries for article popularity
- **Resource click tracking** — tracks which resources users engage with

### 📄 Portfolio Export

- **PDF generation** — `html2canvas` + `jsPDF` renders charts and analysis into a downloadable portfolio
- **Profile gate** — requires signup + profile completion to export

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **Charts** | Recharts 3 |
| **OCR** | Tesseract.js 7 |
| **PDF Export** | html2canvas + jsPDF |
| **QR Codes** | qrcode.react |
| **Markdown** | react-markdown 10 |
| **CSV Parsing** | PapaParse |
| **OG Images** | `@vercel/og` (Edge Runtime) |
| **Data Fetching** | TanStack React Query 5 |
| **Routing** | React Router 7 |
| **Deployment** | Vercel (SPA rewrites + Edge Middleware) |
| **Package Manager** | Bun |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+)
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone git@github.com:goforaditya/proofgrad.git
cd proofgrad

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_PASSWORD=your-db-password
```

### Database Setup

Run the SQL migration files **in order** via **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

| # | File | Purpose |
|---|---|---|
| 1 | `001_initial_schema.sql` | Core tables, auth trigger, RLS policies, realtime publication |
| 2 | `002_fix_guest_access.sql` | Guest-friendly RLS for surveys, responses, and session students |
| 3 | `003_remove_quiz_phase.sql` | Remove `quiz` from session phase CHECK constraint |
| 4 | `004_comments.sql` | Article comments table with RLS |
| 5 | `005_article_slugs.sql` | Add slugs to articles for SEO-friendly URLs |
| 6 | `006_add_snapchat.sql` | Add Snapchat field to user profiles |
| 7 | `007_add_banner_url.sql` | Add banner image URL to articles |
| 8 | `008_collapse_phases.sql` | Collapse 5 session phases → 3 (`lobby`, `active`, `ended`) |
| 9 | `009_resource_links.sql` | Resource links, reactions, and comments tables |
| 10 | `010_page_events.sql` | Telemetry page events table for analytics |

> **Note:** Disable email confirmation in **Dashboard → Authentication → Providers → Email** for local development.

### Run Development Server

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Architecture

### Directory Structure

```
proofgrad/
├── api/
│   └── og.tsx                           # Vercel Edge: dynamic OG image generation
├── middleware.ts                         # Edge Middleware: blog SEO meta injection
├── articles/                            # Static blog article drafts (Markdown)
├── public/
│   ├── favicon.svg
│   └── logo.svg
├── src/
│   ├── App.tsx                          # Router with all routes
│   ├── main.tsx                         # Entry point, providers (Auth, QueryClient)
│   ├── index.css                        # Tailwind + liquid glassmorphism animations
│   ├── types/index.ts                   # All TypeScript interfaces
│   │
│   ├── lib/
│   │   ├── supabase.ts                  # Supabase client init
│   │   ├── auth.tsx                     # AuthProvider + useAuth hook
│   │   ├── realtime.ts                  # Realtime channel subscriptions
│   │   ├── telemetry.ts                 # Buffered event tracking + beacon flush
│   │   └── usePageView.ts              # Auto page_view tracking hook
│   │
│   ├── hooks/
│   │   ├── useSession.ts               # Session CRUD, join, phase management
│   │   ├── useSurvey.ts                # Survey CRUD, responses, OCR upload
│   │   ├── useAnalysis.ts              # Dataset building, stats, chart suggestions
│   │   ├── useLectureNotes.ts          # Lecture note fetch/upsert
│   │   ├── useArticles.ts             # Article CRUD + slug management
│   │   ├── useResources.ts            # Resource links, reactions, comments
│   │   └── useComments.ts             # Article comment CRUD
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Main layout (navbar + sidebar + content)
│   │   │   ├── Navbar.tsx              # Top navigation bar
│   │   │   ├── InstructorSidebar.tsx   # Instructor side navigation
│   │   │   ├── StudentPanel.tsx        # Student info panel
│   │   │   ├── LectureNotesPanel.tsx   # Lecture notes display
│   │   │   └── ProtectedRoute.tsx      # Auth + role guard
│   │   ├── analysis/
│   │   │   ├── ChartCard.tsx           # Chart wrapper with AI interpret button
│   │   │   ├── HistogramChart.tsx
│   │   │   ├── BarChartView.tsx
│   │   │   ├── ScatterChart.tsx
│   │   │   ├── PieChartView.tsx
│   │   │   ├── LineChartView.tsx
│   │   │   └── DemandCurve.tsx
│   │   ├── blog/
│   │   │   ├── CommentSection.tsx      # Article comment thread
│   │   │   ├── MarkdownRenderer.tsx    # Markdown → React rendering
│   │   │   └── MarkdownToolbar.tsx     # Editor toolbar (bold, italic, etc.)
│   │   ├── resources/
│   │   │   └── LinkCard.tsx            # Resource link with reactions + comments
│   │   └── survey/
│   │       ├── QuestionBuilder.tsx     # Question editor (instructor)
│   │       └── QuestionRenderer.tsx    # Question form (student)
│   │
│   └── pages/
│       ├── LandingPage.tsx             # Hub page: apps, blog sidebar, resources
│       ├── auth/
│       │   ├── Login.tsx
│       │   ├── Signup.tsx
│       │   ├── InstructorLogin.tsx
│       │   └── CompleteProfile.tsx
│       ├── instructor/
│       │   ├── Dashboard.tsx
│       │   ├── SessionControl.tsx
│       │   ├── SurveyBuilder.tsx
│       │   ├── LectureNotesEditor.tsx
│       │   ├── ArticleEditor.tsx
│       │   └── ResourceManager.tsx
│       ├── student/
│       │   ├── JoinSession.tsx
│       │   ├── SessionView.tsx
│       │   ├── SurveyForm.tsx
│       │   ├── DatasetView.tsx
│       │   ├── AnalysisWorkspace.tsx
│       │   ├── PortfolioExport.tsx
│       │   └── CpiBuilder.tsx
│       ├── blog/
│       │   ├── ArticleFeed.tsx
│       │   └── ArticleView.tsx
│       └── resources/
│           └── ResourcesPage.tsx
│
├── supabase/
│   ├── migrations/                     # 10 sequential SQL migration files
│   └── functions/                      # Edge function stubs (interpret-chart, suggest-analysis, interpret-quiz)
│
├── vercel.json                         # SPA rewrite config
├── vite.config.ts                      # Vite + React + Tailwind + path aliases
├── tsconfig.json
└── package.json
```

### Route Map

| Route | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/auth/login` | `Login` | Public |
| `/auth/signup` | `Signup` | Public |
| `/auth/instructor` | `InstructorLogin` | Public |
| `/auth/complete-profile` | `CompleteProfile` | Authenticated |
| `/instructor/dashboard` | `Dashboard` | Instructor |
| `/instructor/session/:id` | `SessionControl` | Instructor |
| `/instructor/session/:id/survey` | `SurveyBuilder` | Instructor |
| `/instructor/session/:id/notes` | `LectureNotesEditor` | Instructor |
| `/instructor/session/:id/dataset` | `DatasetView` | Instructor |
| `/instructor/session/:id/analysis` | `AnalysisWorkspace` | Instructor |
| `/instructor/articles` | `ArticleEditor` | Instructor |
| `/instructor/resources` | `ResourceManager` | Instructor |
| `/join` | `JoinSession` | Public (guest) |
| `/student/session/:id` | `SessionView` | Public (guest) |
| `/student/session/:id/survey` | `SurveyForm` | Public (guest) |
| `/student/session/:id/dataset` | `DatasetView` | Public (guest) |
| `/student/session/:id/analysis` | `AnalysisWorkspace` | Public (guest) |
| `/student/session/:id/export` | `PortfolioExport` | Public (gated) |
| `/student/session/:id/cpi` | `CpiBuilder` | Public (guest) |
| `/blog` | `ArticleFeed` | Public |
| `/blog/:slug` | `ArticleView` | Public |
| `/resources` | `ResourcesPage` | Public |

### Data Models

| Type | Key Fields |
|---|---|
| `User` | id, email, name, role, phone, year_of_study, accommodation, instagram, linkedin, snapchat, profile_completed |
| `Session` | id, instructor_id, title, join_code, phase (`lobby` \| `active` \| `ended`), status |
| `SessionStudent` | id, session_id, user_id, nickname, is_guest |
| `Survey` | id, session_id, title, questions (`SurveyQuestion[]`), is_active |
| `Response` | id, survey_id, session_student_id, answers (`Record<string, any>`) |
| `LectureNote` | id, session_id, phase, content (`LectureNoteContent`) |
| `Article` | id, author_id, slug, title, content, tags, banner_url, pinned_session_id |
| `Comment` | id, article_id, user_id, content |
| `ResourceLink` | id, instructor_id, title, url, description, niche, position |
| `LinkReaction` | id, link_id, user_id, emoji (`smile` \| `upvote` \| `poop`) |
| `LinkComment` | id, link_id, user_id, content |

### Realtime Events

| Channel | Events |
|---|---|
| `session:{sessionId}` | `phase_change` (new phase), `survey_launched` (survey ID) |
| `responses:{surveyId}` | `new_response` (response count) |

---

## Database

The database layer uses **Supabase PostgreSQL** with Row Level Security (RLS) policies on every table. Key design decisions:

- **Auth trigger** — auto-creates a `public.users` row on Supabase Auth signup
- **Guest access** — anonymous / unauthenticated reads are enabled for surveys, responses, and session students
- **Session phases collapsed** — originally 5 phases, now simplified to 3 (`lobby`, `active`, `ended`) so students can access surveys, datasets, and analysis simultaneously during `active`
- **Resource reactions** — unique constraint on `(link_id, user_id, emoji)` prevents duplicate reactions
- **Telemetry** — `page_events` table with open inserts and instructor-only reads; blog view counts are publicly queryable

---

## Design System

Dark-only UI with liquid glassmorphism and indigo/pink accents:

| Token | Hex | Usage |
|---|---|---|
| Background | `#0D0D12` | App background |
| Surface | `#1A1A26` | Cards, panels |
| Elevated | `#242436` | Modals, dropdowns |
| Primary | `#635BFF` | Buttons, CTAs, active states |
| Primary Light | `#818CF8` | Hover, highlights |
| Accent Pink | `#E8447A` | Featured cards, gradients |
| Accent Pink Light | `#FF6BA8` | Hover accents |
| Text | `#F0F0F7` | Body text |
| Muted | `#9090B0` | Labels, secondary text |
| Border | `#2E2E45` | Dividers, input borders |

Typography uses [Inter](https://fonts.google.com/specimen/Inter) (300–700) loaded from Google Fonts.

---

## Deployment

The app is configured for **Vercel** with:

- `vercel.json` — SPA catch-all rewrite to `index.html`
- `middleware.ts` — Edge Middleware for blog article SEO meta tags
- `api/og.tsx` — Edge Function for dynamic Open Graph image generation

### Deploy

```bash
bunx vercel
```

### Environment Variables (Vercel Dashboard)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) API key |
| `SUPABASE_URL` | Same Supabase URL (used by edge middleware) |
| `SUPABASE_ANON_KEY` | Same anon key (used by edge middleware) |

---

## Scripts

```bash
bun run dev       # Start Vite dev server
bun run build     # TypeScript check + production build
bun run preview   # Preview production build locally
bun run lint      # ESLint check
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## License

This project is private. All rights reserved.

---

<p align="center">
  Built with ☕ and curiosity
</p>
