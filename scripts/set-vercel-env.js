#!/usr/bin/env node

/**
 * Script to set Firebase environment variables in Vercel
 * 
 * Usage:
 *   1. Get your Vercel token from: https://vercel.com/account/tokens
 *   2. Run: VERCEL_TOKEN=your_token node scripts/set-vercel-env.js
 * 
 * Or set it as an environment variable:
 *   export VERCEL_TOKEN=your_token
 *   node scripts/set-vercel-env.js
 */

const https = require('https');

const PROJECT_ID = 'prj_1odYt9E1EPBaLQua3RpMyqlBHuPH';
const TEAM_ID = 'team_xL90wxyuBirtPIVBOALsM7U9';

const ENV_VARS = [
  {
    key: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    value: 'AIzaSyDv8IRUeYrjvirAkCWN1FtC9oBXiqYE2i4',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    value: 'preppo-a3fad.firebaseapp.com',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    value: 'preppo-a3fad',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    value: 'preppo-a3fad.firebasestorage.app',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    value: '756196373432',
  },
  {
    key: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    value: '1:756196373432:web:05b65ff9a8489cd44a154d',
  },
];

// Target all environments
const TARGET = ['production', 'preview', 'development'];

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Body: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createEnvVar(token, key, value) {
  const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: `/v9/projects/${PROJECT_ID}/env`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const data = {
    key,
    value,
    target: TARGET,
    type: 'encrypted', // Encrypt sensitive values
  };

  try {
    const result = await makeRequest(options, data);
    console.log(`✅ Created: ${key}`);
    return result;
  } catch (error) {
    // If variable already exists, try to update it
    if (error.message.includes('409') || error.message.includes('already exists')) {
      console.log(`⚠️  Variable ${key} already exists, updating...`);
      return await updateEnvVar(token, key, value);
    }
    throw error;
  }
}

async function updateEnvVar(token, key, value) {
  // First, we need to get the env var ID by listing all env vars
  // For simplicity, we'll use PATCH endpoint
  const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: `/v9/projects/${PROJECT_ID}/env?key=${encodeURIComponent(key)}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const data = {
    key,
    value,
    target: TARGET,
    type: 'encrypted',
  };

  try {
    const result = await makeRequest(options, data);
    console.log(`✅ Updated: ${key}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to update ${key}: ${error.message}`);
    throw error;
  }
}

async function main() {
  const token = process.env.VERCEL_TOKEN;
  
  if (!token) {
    console.error('❌ Error: VERCEL_TOKEN environment variable is required');
    console.error('');
    console.error('To get your token:');
    console.error('  1. Go to: https://vercel.com/account/tokens');
    console.error('  2. Create a new token');
    console.error('  3. Run: VERCEL_TOKEN=your_token node scripts/set-vercel-env.js');
    process.exit(1);
  }

  console.log('🚀 Setting Firebase environment variables in Vercel...\n');

  for (const envVar of ENV_VARS) {
    try {
      await createEnvVar(token, envVar.key, envVar.value);
    } catch (error) {
      console.error(`❌ Failed to set ${envVar.key}: ${error.message}`);
    }
  }

  console.log('\n✨ Done! Your environment variables have been set.');
  console.log('\n⚠️  Important: Redeploy your project for changes to take effect:');
  console.log('   https://vercel.com/smaranzs-projects/interview/deployments');
}

main().catch(console.error);

