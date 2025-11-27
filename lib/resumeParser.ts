// Import polyfills first
import '@/lib/polyfills'
import mammoth from 'mammoth'

// pdf-parse v2 uses a class-based API
// We need to use require() for CommonJS compatibility in Next.js server environment
// Set worker globally once to avoid "expression is too dynamic" errors in Next.js
let pdfParseModuleCache: any = null
let workerConfigured = false

function getPdfParserClass() {
  // Use require() for CommonJS modules in server environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!pdfParseModuleCache) {
    pdfParseModuleCache = require('pdf-parse')
  }
  
  // pdf-parse v2 exports PDFParse as a class
  const PDFParse = pdfParseModuleCache.PDFParse || pdfParseModuleCache
  
  // In server environment, disable worker to avoid "expression is too dynamic" errors
  // The worker is not needed for server-side parsing
  // Set it once globally before any instances are created
  if (!workerConfigured && PDFParse.setWorker) {
    try {
      // Set worker to empty string to disable it in server environment
      // This prevents PDF.js from trying to dynamically import worker files
      PDFParse.setWorker('')
      workerConfigured = true
    } catch (error) {
      // Ignore worker setup errors - it's not critical for server-side parsing
      console.warn('Could not configure PDF worker (this is OK for server-side):', error)
    }
  }
  
  return PDFParse
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
    const PDFParse = getPdfParserClass()
    
    // pdf-parse v2 uses a class-based API
    // Create an instance with the buffer data
    // Disable worker for server-side use to avoid dynamic import issues
    const parser = new PDFParse({ 
      data: buffer,
      // Disable worker in server environment
      useWorkerFetch: false,
    })
    
    // Call getText() method to extract text
    const result = await parser.getText()
    const text = result.text.trim()
    
    // Clean up parser resources
    await parser.destroy()
    
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
    
    // Check if it's a worker-related error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('worker') || errorMessage.includes('dynamic')) {
      return {
        success: false,
        text: '',
        error: 'PDF parsing failed due to worker configuration. Please try again or contact support.',
      }
    }
    
    return {
      success: false,
      text: '',
      error: errorMessage || 'Failed to parse PDF file',
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

