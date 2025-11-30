'use client'

let app: any = null
let authInstance: any = null
let googleProviderInstance: any = null

function getAuthValue() {
  if (typeof window === 'undefined') return null
  
  if (!authInstance) {
    try {
      const { initializeApp, getApps, getApp } = require('firebase/app')
      const { getAuth, GoogleAuthProvider } = require('firebase/auth')

      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

      if (!apiKey || !projectId) {
        return null
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
    } catch {
      // Ignore errors - will be initialized properly when env vars are set
    }
  }
  
  return authInstance
}

function getGoogleProviderValue() {
  if (typeof window === 'undefined') return null
  getAuthValue() // Ensure initialization
  return googleProviderInstance
}

export const auth = new Proxy({} as any, {
  get(target, prop) {
    const authVal = getAuthValue()
    if (!authVal) return undefined
    const value = authVal[prop]
    return typeof value === 'function' ? value.bind(authVal) : value
  }
})

export const googleProvider = new Proxy({} as any, {
  get(target, prop) {
    const provider = getGoogleProviderValue()
    return provider?.[prop]
  }
})
