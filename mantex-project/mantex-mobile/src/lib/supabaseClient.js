// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'
import { CapacitorStorage } from './capacitorStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // AUTO-REFRESH tokens to keep session alive
    persistSession: true,      // PERSIST session across app restarts
    detectSessionInUrl: false, // Not needed for mobile
    storage: CapacitorStorage  // Use Capacitor Preferences for secure storage
  }
})

console.log('Supabase client initialized with persistent session storage')