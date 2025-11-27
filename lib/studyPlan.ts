import type { StudyPlan, StudyPlanStep } from '@/lib/types/resume'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface StudyPlanGenerationResult {
  success: boolean
  studyPlan?: StudyPlan
  error?: string
}

/**
 * Generate a structured study plan using OpenAI GPT
 * Based on job requirements and missing keywords from resume
 */
export async function generateStudyPlan(
  jobTitle: string | null,
  jobDescription: string,
  missingKeywords: string[]
): Promise<StudyPlanGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured')
    return {
      success: false,
      error: 'OpenAI API key is not configured',
    }
  }
  
  if (missingKeywords.length === 0) {
    return {
      success: true,
      studyPlan: {
        title: 'No Study Plan Needed',
        overview: 'Your resume already covers all the key skills mentioned in the job posting. Keep up the great work!',
        steps: [],
        timeline: 'N/A',
      },
    }
  }
  
  const roleTitle = jobTitle || 'the target role'
  const keywordsToLearn = missingKeywords.slice(0, 20).join(', ')
  
  const systemPrompt = `You are a career coach and learning advisor. Generate a structured study plan to help a job seeker acquire missing skills for a role.

Your response must be a valid JSON object with this exact structure:
{
  "title": "Study Plan for [Role Name]",
  "overview": "Brief 2-3 sentence overview of the learning path",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Detailed description of what to learn and how",
      "resources": ["Resource 1", "Resource 2"],
      "estimatedTime": "Time estimate (e.g., '1-2 weeks')"
    }
  ],
  "timeline": "Overall timeline estimate (e.g., '4-6 weeks')"
}

Guidelines:
- Create 4-7 actionable steps
- Group related skills together
- Prioritize foundational skills first
- Include specific, real resources (courses, documentation, tutorials)
- Be realistic with time estimates
- Focus on practical, hands-on learning`

  const userPrompt = `Create a study plan for someone applying to: ${roleTitle}

Job Description Summary:
${jobDescription.substring(0, 2000)}

Missing Skills/Keywords to Address:
${keywordsToLearn}

Generate a practical study plan to help them acquire these missing skills and become a stronger candidate.`

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return {
        success: false,
        error: `OpenAI API error: ${response.status}`,
      }
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      return {
        success: false,
        error: 'No response from OpenAI',
      }
    }
    
    // Parse the JSON response
    const parsedPlan = JSON.parse(content) as {
      title: string
      overview: string
      steps: StudyPlanStep[]
      timeline: string
    }
    
    // Validate the response structure
    if (!parsedPlan.title || !parsedPlan.overview || !Array.isArray(parsedPlan.steps)) {
      return {
        success: false,
        error: 'Invalid study plan format from AI',
      }
    }
    
    return {
      success: true,
      studyPlan: {
        title: parsedPlan.title,
        overview: parsedPlan.overview,
        steps: parsedPlan.steps.map((step, index) => ({
          stepNumber: step.stepNumber || index + 1,
          title: step.title || `Step ${index + 1}`,
          description: step.description || '',
          resources: step.resources || [],
          estimatedTime: step.estimatedTime || '',
        })),
        timeline: parsedPlan.timeline || 'Varies based on dedication',
      },
    }
  } catch (error) {
    console.error('Error generating study plan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate study plan',
    }
  }
}

