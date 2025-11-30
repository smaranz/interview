# Copy-Paste Commands for Setting Vercel Environment Variables

## Quick Setup (Copy-Paste Ready)

### Step 1: Get Your Vercel Token
1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Copy the token

### Step 2: Run This Command

```bash
cd /Users/sandarshdevappa/smaran/projects/interview-thing && VERCEL_TOKEN=YOUR_TOKEN_HERE node scripts/set-vercel-env.js
```

---

## Alternative: Copy-Paste Individual curl Commands

Replace `YOUR_TOKEN_HERE` with your Vercel token from step 1 above.

```bash
# Set NEXT_PUBLIC_FIREBASE_API_KEY
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_API_KEY","value":"AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4","target":["production","preview","development"],"type":"encrypted"}'

# Set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN","value":"preppo-a3fad.firebaseapp.com","target":["production","preview","development"],"type":"encrypted"}'

# Set NEXT_PUBLIC_FIREBASE_PROJECT_ID
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_PROJECT_ID","value":"preppo-a3fad","target":["production","preview","development"],"type":"encrypted"}'

# Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET","value":"preppo-a3fad.firebasestorage.app","target":["production","preview","development"],"type":"encrypted"}'

# Set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID","value":"756196373432","target":["production","preview","development"],"type":"encrypted"}'

# Set NEXT_PUBLIC_FIREBASE_APP_ID
curl -X POST "https://api.vercel.com/v9/projects/prj_1odYt9E1EPBaLQua3RpMyqlBHuPH/env" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_FIREBASE_APP_ID","value":"1:756196373432:web:05b65ff9a8489cd44a154d","target":["production","preview","development"],"type":"encrypted"}'
```

---

## After Setting Variables

Redeploy your project:
1. Go to: https://vercel.com/smaranzs-projects/interview/deployments
2. Click "..." on the latest deployment
3. Click "Redeploy"

Or push a new commit to trigger auto-deploy.

