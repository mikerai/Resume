// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// 🧹 LIMPIAR LOCALSTORAGE ANTES DE INICIALIZAR SUPABASE
console.log('🧹 Limpiando localStorage de Supabase antes de inicializar...');
if (typeof localStorage !== 'undefined') {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    console.log('  🗑️ Eliminando:', key);
    localStorage.removeItem(key);
  });
  console.log(`✅ Limpiados ${keysToRemove.length} items de localStorage`);
}

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
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: null // FORZAR: Sin storage en absoluto
  }
})

console.log('✅ Supabase client initialized with URL:', supabaseUrl)