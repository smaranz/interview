// Import polyfills first
import '@/lib/polyfills'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseResumeFile, isValidResumeFileType } from '@/lib/resumeParser'
import { fetchAndParseJobPosting } from '@/lib/jobScraper'
import { computeAtsMatch } from '@/lib/atsMatcher'
import type { ResumeAnalysisResponse } from '@/lib/types/resume'

export async function POST(request: NextRequest): Promise<NextResponse<ResumeAnalysisResponse>> {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse form data
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File | null
    const jobUrl = formData.get('jobUrl') as string | null
    
    // Validate inputs
    if (!resumeFile) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Resume file is required' },
        { status: 400 }
      )
    }
    
    if (!jobUrl) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Job URL is required' },
        { status: 400 }
      )
    }
    
    // Validate file type
    if (!isValidResumeFileType(resumeFile.name)) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Invalid file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      )
    }
    
    // Validate URL format
    try {
      new URL(jobUrl)
    } catch {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Invalid job URL format' },
        { status: 400 }
      )
    }
    
    // Parse resume file
    const fileBuffer = Buffer.from(await resumeFile.arrayBuffer())
    const parseResult = await parseResumeFile(resumeFile.name, fileBuffer)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: parseResult.error || 'Failed to parse resume' },
        { status: 400 }
      )
    }
    
    const resumeText = parseResult.text
    
    // Fetch and parse job posting
    const jobResult = await fetchAndParseJobPosting(jobUrl)
    
    if (!jobResult) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Failed to fetch job posting. Please make sure the URL is publicly accessible.' },
        { status: 400 }
      )
    }
    
    if (!jobResult.descriptionText || jobResult.descriptionText.length < 50) {
      return NextResponse.json(
        { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: 'Could not extract job description from the page. The page may require login or have limited content.' },
        { status: 400 }
      )
    }
    
    // Compute ATS match
    const atsResult = computeAtsMatch(resumeText, jobResult.descriptionText)
    
    // Create job description snippet (first 300 chars)
    const jobDescriptionSnippet = jobResult.descriptionText.substring(0, 300) + 
      (jobResult.descriptionText.length > 300 ? '...' : '')
    
    // Store result in database
    const { data: insertData, error: insertError } = await supabase
      .from('resume_analyses')
      .insert({
        user_id: user.id,
        job_url: jobUrl,
        job_title: jobResult.title,
        job_description_snippet: jobDescriptionSnippet,
        resume_text: resumeText.substring(0, 50000), // Limit stored text
        ats_score: atsResult.score,
        matched_keywords: atsResult.matchedKeywords,
        missing_keywords: atsResult.missingKeywords,
      })
      .select('id')
      .single()
    
    if (insertError) {
      console.error('Error storing analysis:', insertError)
      // Continue anyway - we can still return the result
    }
    
    return NextResponse.json({
      success: true,
      analysisId: insertData?.id,
      jobTitle: jobResult.title,
      jobDescriptionSnippet,
      atsResult,
    })
    
  } catch (error) {
    console.error('Error in resume analysis:', error)
    return NextResponse.json(
      { success: false, jobTitle: null, jobDescriptionSnippet: '', atsResult: { score: 0, matchedKeywords: [], missingKeywords: [], normalizedJobKeywords: [], normalizedResumeTokens: [] }, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

