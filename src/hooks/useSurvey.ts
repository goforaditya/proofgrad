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
// Import CSV data as a pre-seeded survey + responses
// -------------------------------------------------------
export async function importCSVData(
  sessionId: string,
  csvText: string,
  title: string = 'Imported Data'
): Promise<{ survey: Survey | null; error: string | null }> {
  // Parse CSV
  const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { survey: null, error: 'CSV must have a header row and at least one data row.' }

  const headers = parseCSVLine(lines[0])
  if (headers.length === 0) return { survey: null, error: 'No columns found in CSV header.' }

  const dataLines = lines.slice(1)
  const parsedRows = dataLines.map((line) => parseCSVLine(line))

  // Detect column types from first 10 rows
  const questions: SurveyQuestion[] = headers.map((label, colIdx) => {
    const sample = parsedRows.slice(0, 10).map((r) => r[colIdx]).filter(Boolean)
    const allNumeric = sample.length > 0 && sample.every((v) => !isNaN(Number(v)))
    return allNumeric
      ? { type: 'number' as const, label }
      : { type: 'mcq' as const, label, options: [...new Set(sample)].slice(0, 20) }
  })

  // 1. Create survey record
  const { data: surveyData, error: surveyErr } = await supabase
    .from('surveys')
    .insert({ session_id: sessionId, title, questions, is_active: false })
    .select()
    .single()

  if (surveyErr || !surveyData) return { survey: null, error: surveyErr?.message ?? 'Failed to create survey.' }
  const survey = surveyData as Survey

  // 2. Create session_students for each row
  const studentInserts = parsedRows.map((_, i) => ({
    session_id: sessionId,
    nickname: `Import_${i + 1}`,
    is_guest: true,
  }))

  const { data: studentsData, error: studErr } = await supabase
    .from('session_students')
    .insert(studentInserts)
    .select('id')

  if (studErr || !studentsData) return { survey, error: studErr?.message ?? 'Failed to create student rows.' }

  // 3. Insert responses
  const responseInserts = parsedRows.map((row, i) => {
    const answers: Record<number, string | number> = {}
    headers.forEach((_, colIdx) => {
      const val = row[colIdx] ?? ''
      const num = Number(val)
      answers[colIdx] = !isNaN(num) && val.trim() !== '' ? num : val
    })
    return {
      survey_id: survey.id,
      session_student_id: studentsData[i].id,
      answers,
    }
  })

  const { error: respErr } = await supabase.from('responses').insert(responseInserts)
  if (respErr) return { survey, error: respErr.message }

  return { survey, error: null }
}

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
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
