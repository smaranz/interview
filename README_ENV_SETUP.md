# Setting Firebase Environment Variables in Vercel

## Option 1: Automated Script (Recommended)

1. **Get your Vercel token:**
   - Go to: https://vercel.com/account/tokens
   - Click "Create Token"
   - Give it a name (e.g., "Firebase Setup")
   - Copy the token

2. **Run the setup script:**
   ```bash
   VERCEL_TOKEN=your_token_here node scripts/set-vercel-env.js
   ```

## Option 2: Manual Setup via Vercel Dashboard

1. Go to: https://vercel.com/smaranzs-projects/interview/settings/environment-variables

2. Add each variable:
   - Click "Add New"
   - Key: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: `AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"
   
   Repeat for all 6 variables:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `preppo-a3fad.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `preppo-a3fad` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `preppo-a3fad.firebasestorage.app` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `756196373432` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:756196373432:web:05b65ff9a8489cd44a154d` |

3. **Redeploy:**
   - Go to: https://vercel.com/smaranzs-projects/interview/deployments
   - Click "..." on latest deployment → "Redeploy"

## Option 3: Using Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link project (if needed)
vercel link

# Add each environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production preview development
# (paste value when prompted)

# Repeat for all 6 variables, then redeploy
vercel --prod
```

## After Setup

Once variables are set, trigger a new deployment:
- Push a commit to trigger auto-deploy, OR
- Manually redeploy from Vercel dashboard

The app will automatically use the new environment variables!

