# ClearView Interview

AI-powered interview platform with practice sessions, integrity monitoring, and Google Meet integration.

## Features

- **AI Practice Sessions**: Practice with an AI interviewer that adapts to your responses
- **Integrity Monitoring**: Real-time cheat detection monitors eye contact, audio levels, and tab focus
- **Google Meet Integration**: Seamlessly schedule and conduct live interviews with automatic Meet link generation
- **Interview Management**: Create, schedule, and track all your interviews in one place

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
   - App name: ClearView Interview
   - Authorized domains: Your domain (e.g., `yourdomain.com`)
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

# Gemini API (for AI interview features)
GOOGLE_GEMINI_API_KEY=AIzaSyBFgpZQI3B-ZyWLdgWMGUCO9Z3WVD3AzzA
```

**Note**: 
- All Supabase keys (URL, anon key, and service role key) are already configured from your project
- Google OAuth is configured directly in Supabase. The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are optional and reserved for future Google Calendar/Meet API integration.
- Gemini API key is configured for future AI interview integration. Currently using mock data in practice mode.

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
  interviews/[id]/page.tsx # Interview console
  auth/
    signin/page.tsx       # Sign in page
    signup/page.tsx       # Sign up page
    callback/route.ts     # OAuth callback handler
  api/sessions/           # API stubs for realtime features

components/
  NavBar.tsx              # Navigation bar
  InterviewForm.tsx       # Interview creation form
  InterviewList.tsx       # List of interviews
  PracticeLayout.tsx      # Practice mode UI
  CheatMonitor.tsx        # Integrity monitoring widget
  ui/                     # Reusable UI components

lib/
  supabase/
    client.ts             # Browser Supabase client
    server.ts             # Server Supabase client
    middleware.ts         # Auth middleware helper
    types.ts              # TypeScript types (generated from Supabase MCP)
  auth.ts                 # Auth helper functions
  auth/
    google.ts             # Google SSO helper functions
  google.ts               # Google Calendar/Meet stubs
  realtime.ts             # Gemini Realtime stubs
  utils.ts                # Utility functions
```

## Database Schema

The app uses four main tables (managed via Supabase MCP):

- **profiles**: User profiles linked to Supabase Auth
- **interviews**: Interview sessions with scheduling info
- **interview_events**: Event log for each interview
- **cheat_snapshots**: Integrity monitoring snapshots

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

## Future Integrations

- **Gemini Realtime**: Replace mock AI with actual Gemini API
- **Google Calendar API**: Real calendar event creation
- **Google Meet API**: Actual Meet link generation

## License

MIT
