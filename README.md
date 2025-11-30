# Preppo

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
- **Authentication**: Firebase Auth (Google SSO) → Supabase Third-Party Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Firebase project (for Google SSO)

### Firebase Setup (Google SSO)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to **Authentication** > **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Configure the OAuth consent screen:
   - App name: **Preppo** (this shows as "Continue with Preppo" in Google sign-in)
   - Support email: Your email
6. Go to **Project Settings** > **General**
7. Scroll down to "Your apps" and add a **Web app**
8. Copy the Firebase config values

### Supabase Third-Party Auth Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Authentication** > **Providers** (Supabase dashboard)
3. Scroll down to **Third-party Auth**
4. Add **Firebase** as a third-party auth provider:
   - Firebase Project ID: (from Firebase Console)
5. The database schema is already set up with the required tables

### Firebase Cloud Functions (Required)

You need to deploy Firebase Cloud Functions to add the `role: 'authenticated'` custom claim to users. This is required for Supabase to recognize users.

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase Functions in your project
3. Create the blocking functions (see [Supabase Firebase Auth docs](https://supabase.com/docs/guides/auth/third-party/firebase-auth)):

```typescript
// functions/src/index.ts
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity'

export const beforecreated = beforeUserCreated((event) => {
  return {
    customClaims: {
      role: 'authenticated',
    },
  }
})

export const beforesignedin = beforeUserSignedIn((event) => {
  return {
    customClaims: {
      role: 'authenticated',
    },
  }
})
```

4. Deploy: `firebase deploy --only functions`

### Environment Setup

1. Copy the environment example file:

```bash
cp .env.example .env.local
```

2. Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Firebase (from Firebase Console > Project Settings > Your apps > Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# OpenAI API (for all AI interview features)
OPENAI_API_KEY=your-openai-api-key
```

**Notes**: 
- Firebase handles Google SSO authentication
- Firebase tokens are passed to Supabase via Third-Party Auth
- All AI features use OpenAI: Practice mode uses GPT Realtime API for voice interviews

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
    signin/page.tsx       # Sign in page (Firebase Google SSO)
    signup/page.tsx       # Sign up page (Firebase Google SSO)
  api/
    sessions/             # API stubs for realtime features
    resume/
      analyze/route.ts    # Resume analysis API
      study-plan/route.ts # Study plan generation API

components/
  NavBar.tsx              # Navigation bar
  NavBarWrapper.tsx       # NavBar with Firebase auth state
  AuthProvider.tsx        # Firebase auth context provider
  InterviewForm.tsx       # Interview creation form
  InterviewList.tsx       # List of interviews
  PracticeLayout.tsx      # Practice mode UI
  ResumeBuilder.tsx       # Resume Builder & ATS Matcher UI
  ui/                     # Reusable UI components

lib/
  firebase.ts             # Firebase initialization
  supabase/
    client.ts             # Browser Supabase client (uses Firebase tokens)
    server.ts             # Server Supabase client
    middleware.ts         # Auth middleware helper
    types.ts              # TypeScript types
  auth/
    google.ts             # Firebase Google SSO helper functions
  openai.ts              # OpenAI text-based interview functions
  openai-realtime.ts     # OpenAI Realtime WebRTC client
  resumeParser.ts        # PDF and DOCX parsing
  jobScraper.ts          # Job posting HTML fetching and parsing
  atsMatcher.ts          # ATS keyword matching logic
  studyPlan.ts           # AI study plan generation
  utils.ts                # Utility functions
```

## Database Schema

The app uses these main tables (managed via Supabase):

- **profiles**: User profiles (linked to Firebase Auth user IDs)
- **interviews**: Interview sessions with scheduling info
- **interview_events**: Event log for each interview
- **cheat_snapshots**: Integrity monitoring snapshots
- **practice_sessions**: AI practice interview sessions and feedback
- **resume_analyses**: Resume ATS match results and study plans

All tables have Row Level Security (RLS) enabled.

## Authentication

### Firebase + Supabase Third-Party Auth

This app uses Firebase Auth for Google SSO, connected to Supabase via Third-Party Auth:

1. **Sign In/Sign Up**: Users authenticate with Google via Firebase popup
2. **Token Flow**: Firebase ID tokens are passed to Supabase for database access
3. **Profile Sync**: User profiles are created in Supabase on first sign-in
4. **Seamless Experience**: Works on both sign-in and sign-up pages

Benefits of this setup:
- **Custom branding**: Google SSO shows "Preppo" as the app name
- **No Supabase URL**: Users see "preppo.ai" instead of Supabase domain
- **Firebase features**: Access to Firebase Analytics, Crashlytics, etc.

## Deployment

This project is optimized for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (including Firebase config)
4. Deploy

## Resume Builder & ATS Matcher

The `/resume` page provides a comprehensive resume analysis tool:

### Features

- **Resume Upload**: Upload your resume in PDF or DOCX format
- **Job URL Parsing**: Paste any public job posting URL
- **ATS Match Score**: Get a 0-100 score based on keyword matching
- **Keyword Analysis**: See matched and missing keywords
- **AI Study Plan**: Generate a personalized learning path

### How It Works

1. Upload your resume (PDF or DOCX)
2. Paste a public job posting URL
3. Click "Analyze & Match Resume"
4. View your ATS match score and keyword breakdown
5. Optionally generate an AI-powered study plan

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.docx`)

### Job URL Requirements

- The URL must be publicly accessible (no login required)
- Note: Some sites (LinkedIn, Indeed) may block automated access
- Works best with company career pages

## License

MIT
