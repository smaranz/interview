# Firebase Environment Variables for Vercel

Add these environment variables to your Vercel project settings:

## Environment Variables to Add

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=preppo-a3fad.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=preppo-a3fad
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=preppo-a3fad.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=756196373432
NEXT_PUBLIC_FIREBASE_APP_ID=1:756196373432:web:05b65ff9a8489cd44a154d
```

## Steps to Add in Vercel:

1. Go to: https://vercel.com/smaranzs-projects/interview/settings/environment-variables
2. Add each variable:
   - Key: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: `AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4`
   - Environment: Production, Preview, Development (select all three)
   - Click "Save"
   
   Repeat for each variable above.

3. After adding all variables, go to the Deployments tab and click "Redeploy" on the latest deployment.

## Note:
The `measurementId` (G-5NB57D3WHK) is for Google Analytics and is optional for Firebase Auth functionality.

