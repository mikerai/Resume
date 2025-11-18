// src/composables/useAnalytics.js

import { onMounted } from 'vue';
import { useAuth } from './useAuth.js';
import { useFirebase } from './useFirebase.js';

export function useAnalytics() {
    const { user, profile } = useAuth();
    const { isFirebaseInitialized, analytics, setupAnalytics, logAnalyticsEvent, logPageView } = useFirebase();

    /**
     * Inicializa Analytics cuando Firebase esté listo
     */
    const initializeAnalytics = () => {
        if (isFirebaseInitialized.value && user.value) {
            setupAnalytics();
        }
    };

    /**
     * Registra eventos de navegación automáticamente
     * @param {string} pageName - Nombre de la página actual
     */
    const trackPageView = (pageName) => {
        logPageView(pageName);
    };

    /**
     * Eventos de negocio predefinidos (listos para implementar)
     */
    const trackLogin = () => {
        logAnalyticsEvent('login', {
            method: 'supabase'
        });
    };

    const trackLogout = () => {
        logAnalyticsEvent('logout');
    };

    const trackRoleSelection = (selectedRole) => {
        logAnalyticsEvent('role_selected', {
            selected_role: selectedRole
        });
    };

    const trackOnboardingStart = (role) => {
        logAnalyticsEvent('onboarding_start', {
            user_role: role
        });
    };

    const trackOnboardingComplete = (role) => {
        logAnalyticsEvent('onboarding_complete', {
            user_role: role
        });
    };

    // Auto-inicializar cuando se monta el componente
    onMounted(() => {
        initializeAnalytics();
    });

    return {
        // Estado
        isAnalyticsReady: isFirebaseInitialized,
        analytics,

        // Inicialización
        initializeAnalytics,

        // Tracking básico
        trackPageView,
        logAnalyticsEvent,

        // Eventos de autenticación
        trackLogin,
        trackLogout,
        trackRoleSelection,

        // Eventos de onboarding
        trackOnboardingStart,
        trackOnboardingComplete,

        // Helper para eventos personalizados
        track: logAnalyticsEvent
    };
}