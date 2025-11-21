// src/store/auth.store.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as jwt_decode_module from 'jwt-decode';

// Importación robusta para compatibilidad con módulos CJS
const jwt_decode = jwt_decode_module.default || jwt_decode_module;

// =================================================================
// CONFIGURACIÓN DE CLAIMS (DEBE COINCIDIR CON AUTH0 ACTIONS/RULES)
// =================================================================
const AUTH0_ROLE_CLAIM = 'https://api.mantex.com/roles'; 
const AUTH0_ONBOARDING_CLAIM = 'https://api.mantex.com/onboarding_status'; 

// 1. DEFINICIÓN DE LA FUNCIÓN DE INICIALIZACIÓN (DEBE IR ANTES DE useAuthStore)
// Función para obtener el estado inicial desde localStorage
const getInitialState = () => {
    try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            return {
                user: JSON.parse(storedUser),
                token: storedToken,
            };
        }
    } catch (e) {
        console.error("Error al recuperar estado de autenticación:", e);
    }
    return { 
        user: null, 
        token: null 
    };
};


export const useAuthStore = defineStore('auth', () => {
  // Estado inicial
  const initialState = getInitialState();
  const user = ref(initialState.user);
  const token = ref(initialState.token);

  
  // 2. DEFINICIÓN DE LOGOUT (DEBE IR ANTES DE syncUserFromAuth0)
  /**
   * Limpia el estado local y el almacenamiento.
   */
  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };


  // 3. DEFINICIÓN DE syncUserFromAuth0 (Puede llamar a logout)
  /**
   * Sincroniza el estado de Pinia usando la data del SDK de Auth0.
   * La información de roles debe ser extraída del Access Token JWT.
   * @param {object} auth0User - El objeto 'user' del SDK de Auth0.
   * @param {string} accessToken - El Access Token (contiene los claims de rol y onboarding).
   */
  const syncUserFromAuth0 = (auth0User, accessToken) => {
      if (!accessToken) {
          console.error("Access Token no proporcionado para la sincronización.");
          return;
      }
      
      try {
          const decodedToken = jwt_decode(accessToken);
          
          // Extraer Rol (Auth0 generalmente devuelve un array de roles)
          const roles = decodedToken[AUTH0_ROLE_CLAIM];
          const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : 'client'; 
          
          // Extraer Onboarding Status
          const onboarding_status = decodedToken[AUTH0_ONBOARDING_CLAIM] || 'pending_profile'; 

          const newUser = {
              id: auth0User.sub, 
              email: auth0User.email, 
              name: auth0User.name,
              role: role, 
              onboarding_status: onboarding_status
          };

          // 1. Guardar en estado
          user.value = newUser;
          token.value = accessToken;

          // 2. Persistir en localStorage
          localStorage.setItem('user', JSON.stringify(user.value));
          localStorage.setItem('token', token.value);

      } catch (error) {
          console.error("Fallo al decodificar o sincronizar el token de Auth0:", error);
          // Si falla la sincronización, limpiar el estado.
          logout(); // 'logout' está disponible debido al orden de definición.
      }
  };


  const isAuthenticated = computed(() => !!user.value && !!token.value);
  
  return {
    user,
    token,
    isAuthenticated,
    syncUserFromAuth0,
    logout
  };
});