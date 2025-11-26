import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let jobUrl: URL
    try {
      jobUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch the job posting page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch job posting: ${response.status}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    // Extract text content (simple approach - remove HTML tags)
    // For better results, you could use a library like cheerio or jsdom
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Limit content length to avoid token limits
    if (textContent.length > 5000) {
      textContent = textContent.substring(0, 5000) + '...'
    }

    return NextResponse.json({
      content: textContent,
      url: url,
    })
  } catch (error) {
    console.error('Error fetching job posting:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch job posting',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

