// ATS Match Result from keyword analysis
export interface AtsMatchResult {
  score: number // 0-100
  matchedKeywords: string[]
  missingKeywords: string[]
  normalizedJobKeywords: string[]
  normalizedResumeTokens: string[]
}

// Job description extraction result
export interface JobDescriptionResult {
  title: string | null
  descriptionText: string
}

// Study plan step
export interface StudyPlanStep {
  stepNumber: number
  title: string
  description: string
  resources?: string[]
  estimatedTime?: string
}

// AI-generated study plan
export interface StudyPlan {
  title: string
  overview: string
  steps: StudyPlanStep[]
  timeline: string
}

// API response for resume analysis
export interface ResumeAnalysisResponse {
  success: boolean
  analysisId?: string
  jobTitle: string | null
  jobDescriptionSnippet: string
  atsResult: AtsMatchResult
  error?: string
}

// API response for study plan generation
export interface StudyPlanResponse {
  success: boolean
  studyPlan?: StudyPlan
  error?: string
}

// Stored resume analysis record
export interface ResumeAnalysisRecord {
  id: string
  user_id: string
  job_url: string
  job_title: string | null
  job_description_snippet: string
  resume_text: string
  ats_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  study_plan: StudyPlan | null
  created_at: string
  updated_at: string
}

