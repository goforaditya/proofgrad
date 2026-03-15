// ============================================================
// Proofgrad — TypeScript Types
// ============================================================

export type UserRole = 'student' | 'instructor'

export type SessionPhase = 'lobby' | 'survey' | 'dataset' | 'analysis' | 'ended'

export type SessionStatus = 'active' | 'ended'

export type Accommodation = 'hostel' | 'day_scholar'

export type QuestionType = 'number' | 'slider' | 'mcq' | 'scale' | 'screenshot'

// -------------------------------------------------------
// Database row types
// -------------------------------------------------------

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  phone: string | null
  year_of_study: string | null
  accommodation: Accommodation | null
  instagram: string | null
  linkedin: string | null
  profile_completed: boolean
  created_at: string
}

export interface Session {
  id: string
  instructor_id: string
  title: string
  join_code: string
  phase: SessionPhase
  status: SessionStatus
  created_at: string
}

export interface SessionStudent {
  id: string
  session_id: string
  user_id: string | null
  nickname: string
  is_guest: boolean
  joined_at: string
}

// Survey question definition (stored in surveys.questions JSONB array)
export interface SurveyQuestion {
  type: QuestionType
  label: string
  // For MCQ
  options?: string[]
  // For slider / scale
  min?: number
  max?: number
  step?: number
  // For screenshot upload
  placeholder?: string
  required?: boolean
}

export interface Survey {
  id: string
  session_id: string
  title: string
  questions: SurveyQuestion[]
  is_active: boolean
  created_at: string
}

// Survey response answers: { [questionIndex: number]: string | number | string[] }
export type AnswerMap = Record<string, string | number | string[]>

export interface Response {
  id: string
  survey_id: string
  session_student_id: string
  answers: AnswerMap
  submitted_at: string
}

// Lecture note content structure
export interface LectureNoteContent {
  concept?: string
  formula?: string
  task?: string
  discussion_question?: string
  tags?: string[]
  checklist?: { label: string; completed?: boolean }[]
}

export interface LectureNote {
  id: string
  session_id: string
  phase: SessionPhase
  content: LectureNoteContent
  created_at: string
}

export interface Article {
  id: string
  author_id: string
  slug: string
  title: string
  content: string
  tags: string[]
  pinned_session_id: string | null
  published_at: string
  author_name?: string
}

export interface Comment {
  id: string
  article_id: string
  user_id: string
  content: string
  created_at: string
  user_name?: string
  user_role?: UserRole
}

// -------------------------------------------------------
// Guest session state (stored in sessionStorage)
// -------------------------------------------------------

export interface GuestState {
  nickname: string
  sessionId: string
  sessionStudentId: string
  joinCode: string
}

// -------------------------------------------------------
// Realtime channel event payloads
// -------------------------------------------------------

export interface SessionPhaseEvent {
  type: 'phase_change'
  phase: SessionPhase
}

export interface SurveyLaunchEvent {
  type: 'survey_launched'
  surveyId: string
}

export interface ResponseCountEvent {
  type: 'response_count'
  count: number
}

export type SessionChannelEvent =
  | SessionPhaseEvent
  | SurveyLaunchEvent

// -------------------------------------------------------
// Analysis types (Phase 4)
// -------------------------------------------------------

export type ChartType = 'histogram' | 'bar' | 'scatter' | 'pie' | 'line' | 'demand'

export interface AnalysisSuggestion {
  chartType: ChartType
  title: string
  description: string
  xField?: string
  yField?: string
}

// -------------------------------------------------------
// CPI Builder (Phase 8)
// -------------------------------------------------------

export interface CpiCategory {
  name: string
  weight: number // percentage, must sum to 100
  priceLevel?: number
}
