'use client'

let app: any = null
let authInstance: any = null
let googleProviderInstance: any = null

function initFirebase() {
  if (typeof window === 'undefined') return false
  
  if (authInstance) return true
  
  try {
    const { initializeApp, getApps, getApp } = require('firebase/app')
    const { getAuth, GoogleAuthProvider } = require('firebase/auth')

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    if (!apiKey || !projectId) {
      return false
    }

    const config = {
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    }

    app = getApps().length > 0 ? getApp() : initializeApp(config)
    authInstance = getAuth(app)
    googleProviderInstance = new GoogleAuthProvider()
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' })
    return true
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.error('Firebase initialization error:', error)
    }
    return false
  }
}

// Initialize on module load if on client
if (typeof window !== 'undefined') {
  initFirebase()
}

// Export getters that return actual instances
export function getAuthInstance() {
  initFirebase()
  return authInstance
}

export function getGoogleProviderInstance() {
  initFirebase()
  return googleProviderInstance
}

// Export auth as a getter object
export const auth = new Proxy({}, {
  get(target, prop) {
    const auth = getAuthInstance()
    if (!auth) {
      // Return null/undefined for properties, no-op functions for methods
      if (prop === 'currentUser') return null
      if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
        return () => Promise.resolve(null)
      }
      return undefined
    }
    const value = auth[prop]
    return typeof value === 'function' ? value.bind(auth) : value
  }
}) as any

// Export googleProvider as actual instance
export const googleProvider = new Proxy({}, {
  get(target, prop) {
    const provider = getGoogleProviderInstance()
    return provider?.[prop]
  }
}) as any
