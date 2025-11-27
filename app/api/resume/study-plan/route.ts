import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlan } from '@/lib/studyPlan'
import type { StudyPlan, StudyPlanResponse } from '@/lib/types/resume'

export async function POST(request: NextRequest): Promise<NextResponse<StudyPlanResponse>> {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { analysisId, jobTitle, jobDescription, missingKeywords } = body
    
    let finalJobTitle: string | null = jobTitle || null
    let finalJobDescription: string = jobDescription || ''
    let finalMissingKeywords: string[] = missingKeywords || []
    
    // If analysisId is provided, fetch the analysis from database
    if (analysisId) {
      const { data: analysis, error: fetchError } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single()
      
      if (fetchError || !analysis) {
        return NextResponse.json(
          { success: false, error: 'Analysis not found' },
          { status: 404 }
        )
      }
      
      // Check if study plan already exists
      if (analysis.study_plan) {
        return NextResponse.json({
          success: true,
          studyPlan: analysis.study_plan as unknown as StudyPlan,
        })
      }
      
      finalJobTitle = analysis.job_title
      finalJobDescription = analysis.job_description_snippet || ''
      finalMissingKeywords = analysis.missing_keywords || []
    }
    
    // Validate we have required data
    if (!finalJobDescription || finalMissingKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing job description or keywords data' },
        { status: 400 }
      )
    }
    
    // Generate study plan
    const result = await generateStudyPlan(
      finalJobTitle,
      finalJobDescription,
      finalMissingKeywords
    )
    
    if (!result.success || !result.studyPlan) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate study plan' },
        { status: 500 }
      )
    }
    
    // If analysisId was provided, update the record with the study plan
    if (analysisId) {
      const { error: updateError } = await supabase
        .from('resume_analyses')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ study_plan: result.studyPlan as any })
        .eq('id', analysisId)
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('Error saving study plan:', updateError)
        // Continue anyway - we can still return the result
      }
    }
    
    return NextResponse.json({
      success: true,
      studyPlan: result.studyPlan,
    })
    
  } catch (error) {
    console.error('Error generating study plan:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

