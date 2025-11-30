# Honest Hire

AI-powered interview practice platform for job seekers. Practice with AI, get personalized feedback, and improve your interview skills.

## Features

- **AI Practice Sessions**: Practice with our AI interviewer that adapts to your responses and asks questions based on your job application
- **Personalized Feedback**: Get detailed feedback after each practice session including scores, strengths, areas for improvement, and study recommendations
- **Job-Specific Questions**: Paste any job posting link and the AI will ask relevant questions tailored to that specific role
- **Resume Builder & ATS Matcher**: Upload your resume and a job posting to get an ATS match score, keyword analysis, and AI-generated study plan
- **Credit-Based System**: Flexible pricing with monthly plans or pay-per-interview credits

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud Console project (for OAuth)

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. The database schema is already set up with the required tables

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen:
   - User Type: External (or Internal for G Suite)
   - App name: **Preppo** (this shows at the top of the sign-in screen)
   - Authorized domains: Add `preppo.ai` - This helps with branding
   - **Note**: The "to continue to..." message shows the redirect URI domain (Supabase URL). To show "preppo.ai" there, you'd need a custom domain configured in Supabase or handle OAuth callbacks on your domain.
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://oirbuwugodjpogrdeyrl.supabase.co/auth/v1/callback` (your Supabase callback)
     - `http://localhost:3000/auth/callback` (for local development)
7. Copy the Client ID and Client Secret

### Supabase Google OAuth Configuration

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Enter your Google OAuth Client ID and Client Secret
4. The redirect URI is automatically configured: `https://oirbuwugodjpogrdeyrl.supabase.co/auth/v1/callback`

### Environment Setup

1. Copy the environment example file:

```bash
cp .env.example .env.local
```

2. Fill in your environment variables (Supabase keys are pre-filled):

```env
NEXT_PUBLIC_SUPABASE_URL=https://oirbuwugodjpogrdeyrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcmJ1d3Vnb2RqcG9ncmRleXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjU2MDEsImV4cCI6MjA3OTYwMTYwMX0.OqEuFQh4yJXPgg_CJZikKv983mYr4oGy6VJhpKG6-W4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcmJ1d3Vnb2RqcG9ncmRleXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDAyNTYwMSwiZXhwIjoyMDc5NjAxNjAxfQ.YdqeKemGY0Odbt_bamuoZ4S-01uv0_HPt59DqmfFnWU

# Google OAuth (configured in Supabase, but kept here for future Calendar/Meet API)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# OpenAI API (for all AI interview features)
OPENAI_API_KEY=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
```

**Note**: 
- All Supabase keys (URL, anon key, and service role key) are already configured from your project
- Google OAuth is configured directly in Supabase. The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are optional and reserved for future Google Calendar/Meet API integration.
- All AI features use OpenAI: Practice mode uses GPT Realtime API (`gpt-realtime-mini`) for voice interviews, and text-based interviews use GPT-4o-mini. Set `OPENAI_API_KEY` with your OpenAI API key.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  layout.tsx              # Root layout with NavBar
  page.tsx                # Landing page
  dashboard/page.tsx      # Authenticated dashboard
  practice/page.tsx       # AI mock interview UI
  resume/page.tsx         # Resume Builder & ATS Matcher
  interviews/[id]/page.tsx # Interview console
  auth/
    signin/page.tsx       # Sign in page
    signup/page.tsx       # Sign up page
    callback/route.ts     # OAuth callback handler
  api/
    sessions/             # API stubs for realtime features
    resume/
      analyze/route.ts    # Resume analysis API
      study-plan/route.ts # Study plan generation API

components/
  NavBar.tsx              # Navigation bar
  InterviewForm.tsx       # Interview creation form
  InterviewList.tsx       # List of interviews
  PracticeLayout.tsx      # Practice mode UI
  ResumeBuilder.tsx       # Resume Builder & ATS Matcher UI
  CheatMonitor.tsx        # Integrity monitoring widget
  ui/                     # Reusable UI components

lib/
  supabase/
    client.ts             # Browser Supabase client
    server.ts             # Server Supabase client
    middleware.ts         # Auth middleware helper
    types.ts              # TypeScript types (generated from Supabase MCP)
  types/
    resume.ts             # Resume Builder TypeScript types
  auth.ts                 # Auth helper functions
  auth/
    google.ts             # Google SSO helper functions
  google.ts               # Google Calendar/Meet stubs
  realtime.ts             # OpenAI Realtime stubs
  openai.ts              # OpenAI text-based interview functions
  openai-realtime.ts     # OpenAI Realtime WebRTC client
  resumeParser.ts        # PDF and DOCX parsing
  jobScraper.ts          # Job posting HTML fetching and parsing
  atsMatcher.ts          # ATS keyword matching logic
  studyPlan.ts           # AI study plan generation
  utils.ts                # Utility functions
```

## Database Schema

The app uses these main tables (managed via Supabase MCP):

- **profiles**: User profiles linked to Supabase Auth
- **interviews**: Interview sessions with scheduling info
- **interview_events**: Event log for each interview
- **cheat_snapshots**: Integrity monitoring snapshots
- **practice_sessions**: AI practice interview sessions and feedback
- **resume_analyses**: Resume ATS match results and study plans

All tables have Row Level Security (RLS) enabled. TypeScript types are automatically generated from the Supabase schema.

## Authentication

### Email/Password Authentication

Users can sign up and sign in with email and password. Email verification is handled by Supabase.

### Google SSO (Single Sign-On)

Google OAuth is fully integrated:

- **Sign In/Sign Up**: Users can authenticate with their Google account
- **Automatic Profile Creation**: User profiles are automatically created/updated from Google OAuth metadata
- **Avatar & Name Sync**: Profile picture and full name are synced from Google account
- **Seamless Experience**: Works on both sign-in and sign-up pages

The Google SSO flow:
1. User clicks "Continue with Google"
2. Redirects to Google OAuth consent screen
3. After consent, redirects to `/auth/callback`
4. Profile is created/updated automatically
5. User is redirected to dashboard

## Deployment

This project is optimized for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Resume Builder & ATS Matcher

The `/resume` page provides a comprehensive resume analysis tool:

### Features

- **Resume Upload**: Upload your resume in PDF or DOCX format
- **Job URL Parsing**: Paste any public job posting URL (LinkedIn, Indeed, company career pages, etc.)
- **ATS Match Score**: Get a 0-100 score based on keyword matching between your resume and the job description
- **Keyword Analysis**: See which keywords from the job posting are present in your resume and which are missing
- **AI Study Plan**: Generate a personalized learning path to acquire missing skills using OpenAI GPT

### How It Works

1. Upload your resume (PDF or DOCX)
2. Paste a public job posting URL
3. Click "Analyze & Match Resume"
4. View your ATS match score and keyword breakdown
5. Optionally generate an AI-powered study plan for missing skills

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Note: Old `.doc` format is not supported; please convert to `.docx`

### Job URL Requirements

- The URL must be publicly accessible (no login required)
- Works with most job boards and company career pages
- The tool respects robots.txt and does not bypass any protections

### Extension Points

- **Enhanced Scraping**: Improve job parsing in `lib/jobScraper.ts`
- **LLM Resume Generation**: Add tailored resume generation in a new `lib/llm.ts` module
- **Custom Keyword Lists**: Extend `lib/atsMatcher.ts` with industry-specific keywords

### Dependencies

The Resume Builder uses these additional packages:
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX to text conversion
- `cheerio` - HTML parsing for job descriptions

## Future Integrations

- **Google Calendar API**: Real calendar event creation
- **Google Meet API**: Actual Meet link generation
- **AI Resume Generation**: Generate tailored resumes using LLM

## License

MIT
