// src/api/auth.js

import { useAuthStore } from '@/store/auth.store';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Función auxiliar para acceder a la tienda de autenticación.
 * @returns {object} La tienda de autenticación de Pinia.
 */
function getAuthStore() {
    return useAuthStore();
}

/**
 * Registra el rol final y marca el onboarding como completado en el backend.
 * @param {string} role - El rol elegido ('client' o 'supplier').
 * @returns {Promise<object>} Respuesta del backend.
 */
export async function completeOnboarding(role) {
  const authStore = getAuthStore();
  const token = authStore.token; 

  if (!token) throw new Error("No hay token disponible.");

  const res = await fetch(`${API_URL}/auth/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role: role, onboarding_status: 'completed' })
  });

  if (!res.ok) {
    throw new Error('Error al completar el onboarding y asignar rol.');
  }

  return await res.json();
}

// NOTA: Aquí se podrían agregar otras funciones de API relacionadas con Auth, como login, registro manual, etc.