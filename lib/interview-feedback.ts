'use server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface InterviewFeedback {
  score: number // 0-100
  overallFeedback: string
  strengths: string[]
  improvements: string[]
  studyRecommendations: string[]
  specificExamples: string[]
}

export async function generateInterviewFeedback(
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  jobUrl: string
): Promise<InterviewFeedback> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n')

    const prompt = `You are an expert interview coach analyzing a practice job interview. 

Job Posting Link:
${jobUrl}

Please review this job posting and provide feedback based on how well the candidate's responses align with the job requirements.

Interview Transcript:
${conversationText}

Please provide a comprehensive interview feedback analysis. Return your response as a JSON object with the following structure:
{
  "score": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary of overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement area 1>", "<improvement area 2>", "<improvement area 3>"],
  "studyRecommendations": ["<specific study topic 1>", "<specific study topic 2>", "<specific study topic 3>"],
  "specificExamples": ["<specific example from interview with context>", "<another example>"]
}

Be constructive, specific, and actionable. Focus on:
- Communication skills
- Technical knowledge (if applicable)
- Problem-solving approach
- Professionalism
- Areas that need improvement
- Specific topics to study based on the job description

Return ONLY valid JSON, no additional text.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Always return valid JSON only, no additional text or markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', response.status, error)
      throw new Error('Failed to generate feedback')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No feedback generated')
    }

    // Parse JSON response
    let feedback: InterviewFeedback
    try {
      feedback = JSON.parse(content)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/)
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Failed to parse feedback response')
      }
    }

    // Validate and ensure all required fields exist
    return {
      score: Math.max(0, Math.min(100, feedback.score || 75)),
      overallFeedback: feedback.overallFeedback || 'Overall performance was good, with room for improvement.',
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
      improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
      studyRecommendations: Array.isArray(feedback.studyRecommendations) ? feedback.studyRecommendations : [],
      specificExamples: Array.isArray(feedback.specificExamples) ? feedback.specificExamples : [],
    }
  } catch (error) {
    console.error('Error generating interview feedback:', error)
    // Return default feedback on error
    return {
      score: 75,
      overallFeedback: 'Unable to generate detailed feedback. Please review your interview responses and practice common interview questions.',
      strengths: ['Completed the interview'],
      improvements: ['Practice more interview questions', 'Work on clear communication', 'Prepare specific examples'],
      studyRecommendations: ['Review the job description', 'Practice STAR method for behavioral questions'],
      specificExamples: [],
    }
  }
}

