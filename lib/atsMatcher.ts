import type { AtsMatchResult } from '@/lib/types/resume'

// Common English stopwords to filter out
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'also', 'now', 'here', 'there', 'then', 'once',
  'if', 'else', 'because', 'until', 'while', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'am', 'being', 'having', 'doing', 'our', 'your', 'their', 'its', 'my', 'his', 'her',
  'me', 'him', 'us', 'them', 'myself', 'yourself', 'himself', 'herself', 'itself',
  'ourselves', 'themselves', 'any', 'many', 'much', 'another', 'either', 'neither',
  'enough', 'less', 'least', 'little', 'several', 'whether', 'however', 'therefore',
  'thus', 'hence', 'yet', 'still', 'already', 'always', 'never', 'ever', 'often',
  'sometimes', 'usually', 'etc', 'eg', 'ie', 'vs', 'via',
  // Common job posting filler words
  'job', 'position', 'role', 'opportunity', 'company', 'team', 'work', 'working',
  'looking', 'seeking', 'hiring', 'join', 'apply', 'application', 'candidate',
  'candidates', 'applicant', 'applicants', 'employer', 'employee', 'employees',
  'requirements', 'required', 'require', 'qualifications', 'qualified',
  'responsibilities', 'responsible', 'responsibility', 'duties', 'duty',
  'experience', 'experienced', 'skills', 'skill', 'ability', 'abilities',
  'knowledge', 'understanding', 'strong', 'excellent', 'good', 'great',
  'preferred', 'plus', 'bonus', 'ideal', 'ideally', 'must', 'need', 'needs',
  'include', 'includes', 'including', 'included', 'provide', 'provides', 'providing',
  'ensure', 'ensures', 'ensuring', 'support', 'supports', 'supporting',
  'develop', 'develops', 'developing', 'development', 'create', 'creates', 'creating',
  'manage', 'manages', 'managing', 'management', 'lead', 'leads', 'leading',
  'build', 'builds', 'building', 'design', 'designs', 'designing',
  'years', 'year', 'months', 'month', 'days', 'day', 'hours', 'hour',
  'full', 'time', 'part', 'remote', 'onsite', 'hybrid', 'office', 'location',
  'salary', 'benefits', 'compensation', 'pay', 'paid',
])

// Minimum word length to consider as a keyword
const MIN_KEYWORD_LENGTH = 3

// Maximum number of keywords to extract from job description
const MAX_JOB_KEYWORDS = 75

/**
 * Normalize text: lowercase, remove punctuation, trim
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter(word => word.length >= MIN_KEYWORD_LENGTH && !STOPWORDS.has(word))
}

/**
 * Extract keywords from text with frequency counts
 */
function extractKeywordsWithFrequency(text: string): Map<string, number> {
  const tokens = tokenize(text)
  const frequency = new Map<string, number>()
  
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1)
  }
  
  return frequency
}

/**
 * Get top N keywords by frequency
 */
function getTopKeywords(frequencyMap: Map<string, number>, limit: number): string[] {
  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])  // Sort by frequency descending
    .slice(0, limit)
    .map(([word]) => word)
}

/**
 * Compute ATS match between resume and job description
 * 
 * Strategy:
 * 1. Normalize and tokenize both texts
 * 2. Extract top keywords from job description by frequency
 * 3. Check which keywords appear in resume
 * 4. Calculate match score as percentage
 */
export function computeAtsMatch(
  resumeText: string,
  jobDescriptionText: string
): AtsMatchResult {
  // Tokenize resume into a Set for O(1) lookups
  const resumeTokens = tokenize(resumeText)
  const resumeTokenSet = new Set(resumeTokens)
  
  // Extract keywords from job description
  const jobKeywordFrequency = extractKeywordsWithFrequency(jobDescriptionText)
  const jobKeywords = getTopKeywords(jobKeywordFrequency, MAX_JOB_KEYWORDS)
  
  // Find matched and missing keywords
  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []
  
  for (const keyword of jobKeywords) {
    if (resumeTokenSet.has(keyword)) {
      matchedKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  }
  
  // Calculate score
  const score = jobKeywords.length > 0
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 0
  
  return {
    score,
    matchedKeywords,
    missingKeywords,
    normalizedJobKeywords: jobKeywords,
    normalizedResumeTokens: [...new Set(resumeTokens)].slice(0, 200), // Limit for response size
  }
}

/**
 * Get a human-readable score description
 */
export function getScoreDescription(score: number): {
  label: string
  color: 'red' | 'yellow' | 'green'
} {
  if (score >= 75) {
    return { label: 'Excellent Match', color: 'green' }
  } else if (score >= 50) {
    return { label: 'Good Match', color: 'yellow' }
  } else if (score >= 25) {
    return { label: 'Fair Match', color: 'yellow' }
  } else {
    return { label: 'Needs Improvement', color: 'red' }
  }
}

