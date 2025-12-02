import { createRouter, createWebHistory } from 'vue-router';
import { watch } from 'vue';
import { useAuth } from '@/composables/useAuth';

// =======================================================
// UTILERÍAS DE REDIRECCIÓN Y RUTA
// =======================================================

/**
 * Determina la ruta de redirección del usuario al iniciar sesión o después de un paso.
 * @param {object} profile - Objeto de perfil { role, onboarding_complete }
 * @returns {string} La ruta de destino legítima.
 */
const getRedirectPath = (profile) => {
    // Si no hay perfil o rol asignado
    if (!profile || !profile.role) {
        return '/role-selection';
    }

    // Si el onboarding no está completo, dirigir al paso de onboarding.
    if (!profile.onboarding_complete) {
        return `/onboarding/${profile.role}`;
    }

    // Si el onboarding está completo, redirigir al dashboard
    switch (profile.role) {
        case 'admin':
            return '/admin/dashboard';
        case 'supplier':
            return '/supplier/dashboard';
        case 'client':
            return '/client/dashboard';
        default:
            // Rol desconocido pero autenticado
            return '/access';
    }
};

// =======================================================
// DEFINICIÓN DE RUTAS Y METADATOS
// =======================================================

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // --- Rutas Públicas/Auth ---
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/pages/auth/Login.vue'),
            meta: { public: true }
        },
        {
            path: '/signup',
            name: 'Signup',
            component: () => import('@/views/pages/auth/Signup.vue'),
            meta: { public: true }
        },
        {
            path: '/access',
            name: 'AccessDenied',
            component: () => import('@/views/pages/auth/AccessDenied.vue'),
            meta: { public: true }
        },
        {
            path: '/role-selection',
            name: 'RoleSelection',
            component: () => import('@/views/pages/auth/RoleSelection.vue'),
            meta: { requiresAuth: true }
        },
        // --- Rutas de Onboarding (Protegida) ---
        // Corregido el path: debe ser una URL, no una ruta de archivo.
        {
            path: '/onboarding/client',
            name: 'OnboardingClient',
            component: () => import('@/views/onboarding/OnboardingClient.vue'),
            meta: { requiresAuth: true, requiredRole: 'client' }
        },
        {
            path: '/onboarding/supplier',
            name: 'OnboardingSupplier',
            component: () => import('@/views/onboarding/OnboardingSupplier.vue'),
            meta: { requiresAuth: true, requiredRole: 'supplier' }
        },

        // --- Admin Layout Rutas ---
        {
            path: '/admin',
            component: () => import('@/layout/AdminLayout.vue'),
            meta: { requiresAuth: true, requiredRole: 'admin' }, // Usamos requiredRole para coherencia
            children: [
                {
                    path: 'dashboard',
                    name: 'AdminDashboard',
                    component: () => import('@/views/admin/Dashboard.vue')
                },
                {
                    path: 'tickets',
                    name: 'AdminTickets',
                    component: () => import('@/views/admin/Tickets.vue')
                },
                {
                    path: 'tickets/:id',
                    name: 'AdminTicketDetail',
                    component: () => import('@/views/admin/TicketDetail.vue')
                },
                {
                    path: 'assets',
                    name: 'AdminAssets',
                    component: () => import('@/views/admin/Assets.vue')
                },
                {
                    path: 'users',
                    name: 'AdminUsers',
                    component: () => import('@/views/admin/Users.vue')
                },
                {
                    path: 'clients/:id',
                    name: 'AdminClientDetail',
                    component: () => import('@/views/admin/ClientDetail.vue')
                },
                {
                    path: 'suppliers/:id',
                    name: 'AdminSupplierDetail',
                    component: () => import('@/views/admin/SupplierDetail.vue')
                },
                {
                    path: 'suppliers-approval',
                    name: 'AdminSuppliersApproval',
                    component: () => import('@/views/admin/SuppliersApproval.vue')
                },
                {
                    path: 'suppliers-approval-nubarium',
                    name: 'AdminSuppliersApprovalNubarium',
                    component: () => import('@/views/admin/SuppliersApprovalWithNubarium.vue')
                },
                {
                    path: 'evidence-oversight',
                    name: 'AdminEvidenceOversight',
                    component: () => import('@/views/admin/EvidenceOversight.vue')
                },
                {
                    path: 'payment-automation',
                    name: 'AdminPaymentAutomation',
                    component: () => import('@/views/admin/PaymentAutomation.vue')
                },
                {
                    path: 'calendar',
                    name: 'AdminCalendar',
                    component: () => import('@/views/admin/Calendar.vue')
                },
                {
                    path: 'account',
                    name: 'AdminAccount',
                    component: () => import('@/views/admin/Account.vue')
                },
                {
                    path: 'google-apis-test',
                    name: 'GoogleApisTest',
                    component: () => import('@/views/GoogleApisTest.vue')
                },
            ]
        },

        // --- Supplier Layout Rutas ---
        {
            path: '/supplier',
            component: () => import('@/layout/SupplierLayout.vue'),
            meta: { requiresAuth: true, requiredRole: 'supplier' }, // Usamos requiredRole
            children: [
                {
                    path: 'dashboard',
                    name: 'SupplierDashboard',
                    component: () => import('@/views/supplier/Dashboard.vue')
                },
                {
                    path: 'jobs',
                    name: 'SupplierJobs',
                    component: () => import('@/views/supplier/Jobs.vue')
                },
                {
                    path: 'history',
                    name: 'SupplierHistory',
                    component: () => import('@/views/supplier/History.vue')
                },
                {
                    path: 'jobs/:id',
                    name: 'SupplierJobDetail',
                    component: () => import('@/views/admin/TicketDetail.vue') // Reusing for now
                },
                {
                    path: 'calendar',
                    name: 'SupplierCalendar',
                    component: () => import('@/views/supplier/Calendar.vue')
                },
                {
                    path: 'account',
                    name: 'SupplierAccount',
                    component: () => import('@/views/supplier/Account.vue')
                },
                {
                    path: 'settings',
                    name: 'SupplierSettings',
                    component: () => import('@/views/supplier/Settings.vue')
                }
            ]
        },

        // --- Client Layout Rutas ---
        {
            path: '/client',
            component: () => import('@/layout/ClientLayout.vue'),
            meta: { requiresAuth: true, requiredRole: 'client' }, // Usamos requiredRole
            children: [
                {
                    path: 'dashboard',
                    name: 'ClientDashboard',
                    component: () => import('@/views/client/Dashboard.vue')
                },
                {
                    path: 'requests',
                    name: 'ClientRequests',
                    component: () => import('@/views/client/Requests.vue')
                },
                {
                    path: 'requests/:id',
                    name: 'ClientRequestDetail',
                    component: () => import('@/views/admin/TicketDetail.vue') // Reusing for now
                },
                {
                    path: 'approvals',
                    name: 'ClientApprovals',
                    component: () => import('@/views/client/Approvals.vue')
                },
                {
                    path: 'assets',
                    name: 'ClientAssets',
                    component: () => import('@/views/client/Assets.vue')
                },
                {
                    path: 'maintenance-history',
                    name: 'ClientMaintenanceHistory',
                    component: () => import('@/views/client/MaintenanceHistory.vue')
                },
                {
                    path: 'calendar',
                    name: 'ClientCalendar',
                    component: () => import('@/views/client/Calendar.vue')
                },
                {
                    path: 'account',
                    name: 'ClientAccount',
                    component: () => import('@/views/client/Account.vue')
                },
                {
                    path: 'settings',
                    name: 'ClientSettings',
                    component: () => import('@/views/client/Settings.vue')
                },
                {
                    path: 'validate',
                    name: 'ClientProviderValidation',
                    component: () => import('@/views/client/ProviderValidation.vue')
                }
            ]
        },

        // ---Home y 404 ---
        {
            path: '/',
            name: 'Landing',
            component: () => import('@/views/pages/Landing.vue'),
            meta: { public: true }
        },
        {
            path: '/:catchAll(.*)',
            name: 'NotFound',
            component: () => import('@/views/pages/NotFound.vue'),
            meta: { public: true }
        }
    ],
    scrollBehavior() {
        return { left: 0, top: 0 };
    }
});


// =======================================================
// ROUTER GUARD GLOBAL
// =======================================================

router.beforeEach(async (to, from, next) => {
    const auth = useAuth();

    // --- 0. Esperar inicialización de Auth ---
    if (auth.isLoading.value) {
        console.log('⏳ Esperando inicialización de Auth...');
        await new Promise(resolve => {
            const unwatch = watch(auth.isLoading, (loading) => {
                if (!loading) {
                    unwatch();
                    resolve();
                }
            });
        });
        console.log('✅ Auth inicializado');
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.matched.find(record => record.meta.requiredRole)?.meta.requiredRole;
    const isPublic = to.meta.public;

    // --- 1. Manejo de Rutas Públicas ---
    if (isPublic) {
        // RUTAS PÚBLICAS SON SIEMPRE ACCESIBLES - NO REDIRIGIR POR SESIONES PERSISTENTES
        console.log(`🔍 Ruta pública: ${to.path} - Acceso permitido`);
        return next();
    }

    // --- 2. Manejo de Rutas Protegidas ---
    if (requiresAuth) {
        // A. Verificación de Autenticación
        if (!auth.isAuthenticated.value) {
            return next('/login');
        }

        // B. Verificación de Flujo de Onboarding/Rol
        // 🕶️ FLYNN MODE - Skip onboarding flow restrictions ⚡
        if (!auth.isFlynn.value && !auth.isAdminGod.value) {
            const currentRedirectPath = getRedirectPath(auth.profile.value);

            // Solo redirigir si:
            // 1. No tiene rol (va a role-selection)
            // 2. No completó onboarding (va a onboarding)
            // Si ya tiene rol y completó onboarding, permitir navegar dentro de su sección
            const needsRedirection = currentRedirectPath.includes('/role-selection') || currentRedirectPath.includes('/onboarding');

            if (needsRedirection && currentRedirectPath !== to.path) {
                console.log(`Flujo incompleto. Redirigiendo a: ${currentRedirectPath}`);
                return next(currentRedirectPath);
            }
        } else {
            console.log('🌌 FLYNN MODE: Bypassing onboarding restrictions...');
        }

        // C. Verificación de Autorización de Rol (si la ruta tiene un rol específico)
        // 🕶️ FLYNN MODE - ADMIN GOD BYPASS ⚡
        if (requiredRole && !auth.canAccessRoute(requiredRole)) {
            console.warn(`Acceso denegado: Rol incorrecto (${auth.profile.value?.role}) para ${to.path}`);
            return next('/access');
        }

        // D. Permitir acceso
        return next();
    }

    // Si la ruta no es pública ni protegida, continuar
    next();
});

export default router;