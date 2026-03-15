import { supabase } from '@/lib/supabase'
import type { Survey, SurveyQuestion, AnswerMap } from '@/types'

// -------------------------------------------------------
// Create a survey for a session
// -------------------------------------------------------
export async function createSurvey(
  sessionId: string,
  title: string,
  questions: SurveyQuestion[]
): Promise<{ survey: Survey | null; error: string | null }> {
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      session_id: sessionId,
      title,
      questions,
      is_active: false,
    })
    .select()
    .single()

  if (error) return { survey: null, error: error.message }
  return { survey: data as Survey, error: null }
}

// -------------------------------------------------------
// Fetch all surveys for a session
// -------------------------------------------------------
export async function fetchSessionSurveys(
  sessionId: string
): Promise<Survey[]> {
  const { data } = await supabase
    .from('surveys')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Survey[]
}

// -------------------------------------------------------
// Fetch a single survey by ID
// -------------------------------------------------------
export async function fetchSurveyById(
  surveyId: string
): Promise<{ survey: Survey | null; error: string | null }> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (error) return { survey: null, error: error.message }
  return { survey: data as Survey, error: null }
}

// -------------------------------------------------------
// Activate a survey (launch it)
// -------------------------------------------------------
export async function activateSurvey(
  surveyId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('surveys')
    .update({ is_active: true })
    .eq('id', surveyId)

  if (error) return { error: error.message }
  return { error: null }
}

// -------------------------------------------------------
// Deactivate a survey (close it)
// -------------------------------------------------------
export async function deactivateSurvey(
  surveyId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('surveys')
    .update({ is_active: false })
    .eq('id', surveyId)

  if (error) return { error: error.message }
  return { error: null }
}

// -------------------------------------------------------
// Submit a survey response
// -------------------------------------------------------
export async function submitSurveyResponse(
  surveyId: string,
  sessionStudentId: string,
  answers: AnswerMap
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('responses')
    .insert({
      survey_id: surveyId,
      session_student_id: sessionStudentId,
      answers,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You have already submitted a response to this survey.' }
    }
    return { error: error.message }
  }
  return { error: null }
}

// -------------------------------------------------------
// Fetch all responses for a survey
// -------------------------------------------------------
export async function fetchSurveyResponses(
  surveyId: string
): Promise<{ answers: AnswerMap; session_student_id: string; submitted_at: string }[]> {
  const { data } = await supabase
    .from('responses')
    .select('answers, session_student_id, submitted_at')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: true })

  return (data ?? []) as { answers: AnswerMap; session_student_id: string; submitted_at: string }[]
}

// -------------------------------------------------------
// Get response count for a survey
// -------------------------------------------------------
export async function getResponseCount(
  surveyId: string
): Promise<number> {
  const { count } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)

  return count ?? 0
}

// -------------------------------------------------------
// Check if a student has already responded
// -------------------------------------------------------
export async function hasStudentResponded(
  surveyId: string,
  sessionStudentId: string
): Promise<boolean> {
  const { count } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .eq('session_student_id', sessionStudentId)

  return (count ?? 0) > 0
}

// -------------------------------------------------------
// Upload screenshot to Supabase Storage
// -------------------------------------------------------
export async function uploadScreenshot(
  file: File,
  sessionId: string,
  studentId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `screenshots/${sessionId}/${studentId}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('screenshots')
    .upload(path, file, { upsert: true })

  if (error) return { url: null, error: error.message }

  const { data: urlData } = supabase.storage
    .from('screenshots')
    .getPublicUrl(path)

  return { url: urlData.publicUrl, error: null }
}

// -------------------------------------------------------
// Fetch active survey for a session
// -------------------------------------------------------
export async function fetchActiveSurvey(
  sessionId: string
): Promise<{ survey: Survey | null; error: string | null }> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { survey: null, error: error.message }
  return { survey: data as Survey | null, error: null }
}
