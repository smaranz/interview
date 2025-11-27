import mammoth from 'mammoth'

// pdf-parse doesn't have proper ESM exports, so we use dynamic import
async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  return pdfParse
}

export interface ParseResult {
  success: boolean
  text: string
  error?: string
}

/**
 * Extract text content from a PDF file buffer
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const pdfParse = await getPdfParser()
    const data = await pdfParse(buffer)
    const text = data.text.trim()
    
    if (!text) {
      return {
        success: false,
        text: '',
        error: 'PDF appears to be empty or contains only images',
      }
    }
    
    return {
      success: true,
      text,
    }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to parse PDF file',
    }
  }
}

/**
 * Extract text content from a DOCX file buffer
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()
    
    if (!text) {
      return {
        success: false,
        text: '',
        error: 'DOCX appears to be empty',
      }
    }
    
    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }
    
    return {
      success: true,
      text,
    }
  } catch (error) {
    console.error('Error parsing DOCX:', error)
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Failed to parse DOCX file',
    }
  }
}

/**
 * Detect file type from filename and parse accordingly
 */
export async function parseResumeFile(
  filename: string,
  buffer: Buffer
): Promise<ParseResult> {
  const lowerFilename = filename.toLowerCase()
  
  if (lowerFilename.endsWith('.pdf')) {
    return extractTextFromPdf(buffer)
  }
  
  if (lowerFilename.endsWith('.docx')) {
    return extractTextFromDocx(buffer)
  }
  
  if (lowerFilename.endsWith('.doc')) {
    // .doc files (old Word format) are not supported by mammoth
    // Return an error suggesting conversion
    return {
      success: false,
      text: '',
      error: 'Old .doc format is not supported. Please convert to .docx or .pdf',
    }
  }
  
  return {
    success: false,
    text: '',
    error: `Unsupported file type. Please upload a PDF or DOCX file. Received: ${filename}`,
  }
}

/**
 * Validate file type before parsing
 */
export function isValidResumeFileType(filename: string): boolean {
  const lowerFilename = filename.toLowerCase()
  return lowerFilename.endsWith('.pdf') || lowerFilename.endsWith('.docx')
}

/**
 * Get accepted file types for input element
 */
export const ACCEPTED_RESUME_TYPES = '.pdf,.docx'

