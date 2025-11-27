// Import polyfills first
import '@/lib/polyfills'
import * as cheerio from 'cheerio'
import type { JobDescriptionResult } from '@/lib/types/resume'

/**
 * Fetch HTML content from a public job posting URL
 * Returns null on errors (network failures, non-200 responses)
 * 
 * Note: This function only works with publicly accessible job pages.
 * It does not bypass any protections, CAPTCHAs, or paywalls.
 */
export async function fetchJobPostingHtml(url: string): Promise<string | null> {
  try {
    // Validate URL format
    const parsedUrl = new URL(url)
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.warn('Invalid protocol for job URL:', parsedUrl.protocol)
      return null
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(15000),
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch job posting: ${response.status} ${response.statusText}`)
      return null
    }
    
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      console.warn('Response is not HTML:', contentType)
      return null
    }
    
    return await response.text()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.warn('Job posting fetch timed out:', url)
      } else {
        console.warn('Error fetching job posting:', error.message)
      }
    }
    return null
  }
}

/**
 * Extract job title and description from HTML content
 * Uses generic heuristics to find job-related content
 */
export function extractJobDescriptionFromHtml(html: string): JobDescriptionResult {
  const $ = cheerio.load(html)
  
  // Remove script, style, nav, footer, and header elements
  $('script, style, nav, footer, header, noscript, iframe, svg').remove()
  
  // Try to extract job title from various sources
  let title: string | null = null
  
  // Priority 1: Look for common job title patterns
  const titleSelectors = [
    'h1.job-title',
    'h1[class*="title"]',
    'h1[class*="job"]',
    '[class*="job-title"]',
    '[class*="jobTitle"]',
    '[data-testid*="title"]',
    'h1',
  ]
  
  for (const selector of titleSelectors) {
    const element = $(selector).first()
    if (element.length) {
      const text = element.text().trim()
      if (text && text.length > 3 && text.length < 200) {
        title = text
        break
      }
    }
  }
  
  // Priority 2: Check meta tags
  if (!title) {
    const ogTitle = $('meta[property="og:title"]').attr('content')
    if (ogTitle) {
      title = ogTitle.trim()
    }
  }
  
  // Priority 3: Use page title
  if (!title) {
    const pageTitle = $('title').text().trim()
    if (pageTitle) {
      // Clean up common suffixes
      title = pageTitle
        .replace(/\s*[-|]\s*(LinkedIn|Indeed|Glassdoor|Monster|ZipRecruiter).*$/i, '')
        .replace(/\s*[-|]\s*Jobs?.*$/i, '')
        .trim()
    }
  }
  
  // Extract main content - try to find the job description section
  let descriptionText = ''
  
  // Look for common job description containers
  const contentSelectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="description"]',
    '[id*="job-description"]',
    '[id*="description"]',
    '[data-testid*="description"]',
    'article',
    'main',
    '[role="main"]',
  ]
  
  for (const selector of contentSelectors) {
    const element = $(selector).first()
    if (element.length) {
      const text = element.text().trim()
      if (text.length > 100) {
        descriptionText = text
        break
      }
    }
  }
  
  // Fallback: get all body text
  if (!descriptionText || descriptionText.length < 100) {
    descriptionText = $('body').text().trim()
  }
  
  // Clean up the description text
  descriptionText = descriptionText
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n+/g, ' ')  // Remove newlines
    .trim()
  
  // Limit description length to avoid token limits
  if (descriptionText.length > 10000) {
    descriptionText = descriptionText.substring(0, 10000) + '...'
  }
  
  return {
    title,
    descriptionText,
  }
}

/**
 * Fetch and parse a job posting in one call
 */
export async function fetchAndParseJobPosting(url: string): Promise<JobDescriptionResult | null> {
  const html = await fetchJobPostingHtml(url)
  
  if (!html) {
    return null
  }
  
  return extractJobDescriptionFromHtml(html)
}

