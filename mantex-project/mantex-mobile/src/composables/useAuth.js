// src/composables/useAuth.js

import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient.js'; // Asegúrate de que esta ruta sea correcta
//import { useRouter } from 'vue-router';

// ⚡ FLYNN MODE - MASTER OF THE DIGITAL GRID ⚡
const FLYNN_EMAIL = 'm@511.mx'; // 🕶️ The chosen one 

// -----------------------------------------------------
// 1. ESTADO GLOBAL REACTIVO (Fuera del composable, para ser Singleton)
// -----------------------------------------------------

// Inicializamos en null para que sea asignado por el inicializador asíncrono.
const user = ref(null);
const profile = ref({
    username: null,
    role: null,
    onboarding_complete: false,
});
// Empieza en TRUE para bloquear el Router Guard hasta que la sesión se cargue.
const isLoading = ref(true);


// -----------------------------------------------------
// 2. FUNCIONES DE PERFIL Y UTILIDADES
// -----------------------------------------------------

/**
 * Carga o refresca los datos de perfil desde la tabla 'profiles'.
 */
async function getProfile(userId) {
    console.log('📋 Obteniendo perfil para:', userId);
    const startTime = Date.now();

    try {
        console.log('🔄 Ejecutando query a Supabase...');

        // SIN TIMEOUT - dejar que complete o falle naturalmente
        const { data, error } = await supabase
            .from('profiles')
            .select(`username, role, sub_role, permissions, onboarding_complete`)
            .eq('id', userId)
            .single();

        console.log('✅ Query completada');

        const duration = Date.now() - startTime;
        console.log(`⏱️ getProfile tardó ${duration}ms`);

        if (data) {
            profile.value = {
                username: data.username,
                role: data.role,
                sub_role: data.sub_role,
                permissions: data.permissions,
                onboarding_complete: data.onboarding_complete,
            };
            console.log('✅ Perfil obtenido:', profile.value);
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error al obtener perfil:', error.message, error);
            profile.value = { username: null, role: null, sub_role: null, permissions: {}, onboarding_complete: false };
        } else {
            console.log('ℹ️ Perfil no encontrado, usando predeterminado');
            profile.value = { username: null, role: null, onboarding_complete: false };
        }
    } catch (e) {
        console.error('💥 Error crítico al obtener perfil:', e.message);
        profile.value = { username: null, role: null, onboarding_complete: false };
    }
}

/**
 * Asigna el rol al usuario después de la selección inicial.
 */
async function updateProfileRole(userId, newRole) {
    console.log('📝 Actualizando rol a:', newRole, 'para usuario:', userId);
    const startTime = Date.now();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
            .select();

        const duration = Date.now() - startTime;
        console.log(`⏱️ updateProfileRole tardó ${duration}ms`);

        if (error) {
            console.error('❌ Error al actualizar el rol:', error);
            console.error('Detalles del error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Falló la asignación de rol: ${error.message}`);
        }

        console.log('✅ Rol actualizado exitosamente:', data);

        // Si la actualización es exitosa, actualizamos el estado local
        await getProfile(userId);
    } catch (e) {
        console.error('💥 Error crítico al actualizar rol:', e.message);
        throw e;
    }
}

/**
 * Marca el Onboarding como completado.
 */
async function completeOnboarding(userId) {
    const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId);

    if (error) {
        console.error('Error al completar onboarding:', error);
        throw new Error('Falló al marcar el onboarding como completado.');
    }

    // Si la actualización es exitosa, actualizamos el estado local
    await getProfile(userId);
}

// Lógica de Login
async function login(email, password) {
    try {
        isLoading.value = true;
        console.log('🔐 Iniciando sesión...');

        // Login directo sin timeout
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            isLoading.value = false;
            throw error;
        }

        console.log('✅ Autenticación exitosa');

        // CRÍTICO: Cargar perfil sin bloquear, pero avisar cuando termine
        if (data.user) {
            user.value = data.user; // Setear usuario inmediatamente
            getProfile(data.user.id).then(() => {
                console.log('✅ Perfil cargado completamente');
            }).catch(e => console.warn('Error cargando perfil:', e));
        }

        isLoading.value = false;
        console.log('🚀 Login completado');
    } catch (error) {
        isLoading.value = false;
        console.error('❌ Error en login:', error);
        throw error;
    }
}

// Lógica de Logout
async function logout() {
    try {
        isLoading.value = true;
        console.log('🚪 Cerrando sesión...');

        // 1. LIMPIAR LOCALSTORAGE primero
        console.log('🧹 Limpiando localStorage de Supabase...');
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
        }

        // 2. Llamada al logout de Supabase
        const { error } = await supabase.auth.signOut();

        if (error && !error.message.includes('timeout')) {
            console.error('Error en logout:', error);
            // Continúa con logout local aunque falle el servidor
        }

        // 3. Limpiar estado inmediatamente (no esperar al listener)
        user.value = null;
        profile.value = { username: null, role: null, onboarding_complete: false };
        isLoading.value = false;

        console.log('✅ Logout exitoso - sesión completamente limpiada');

        // 4. Redirección inmediata
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error crítico en logout:', error);
        // Logout forzado en caso de error
        user.value = null;
        profile.value = { username: null, role: null, onboarding_complete: false };
        isLoading.value = false;

        // Redirección forzada en caso de error
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
}

// Lógica de Registro (Signup)
async function signUp(email, password) {
    isLoading.value = true;
    console.log('📝 Registrando usuario:', email);

    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
        isLoading.value = false;
        throw authError;
    }

    // CRÍTICO: Crear perfil con username extraído del email
    if (data.user) {
        user.value = data.user;

        // Extraer username del email (parte antes de la @)
        const username = email.split('@')[0];
        console.log('👤 Creando perfil con username:', username);

        try {
            // Primero intentar insertar el perfil nuevo
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        username: username,
                        role: null,
                        onboarding_complete: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (insertError) {
                // Si falla la inserción, probablemente el perfil ya existe
                if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
                    console.log('🔄 Perfil ya existe, actualizando username...');

                    // Actualizar el perfil existente con el username
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            username: username,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', data.user.id);

                    if (updateError) {
                        console.error('❌ Error al actualizar username:', updateError);
                    } else {
                        console.log('✅ Username actualizado exitosamente:', username);
                    }
                } else {
                    console.error('❌ Error al insertar perfil:', insertError);
                }
            } else {
                console.log('✅ Perfil creado exitosamente con username:', username);
            }
        } catch (e) {
            console.error('💥 Error crítico al crear/actualizar perfil:', e);
            // No bloquear el signup por errores de perfil
        }

        // Cargar el perfil después de crearlo
        await getProfile(data.user.id);
    }
    isLoading.value = false;
}

// -----------------------------------------------------
// 3. CRÍTICO: INICIALIZADOR Y LISTENER DE ESTADO DE AUTH
// -----------------------------------------------------

/**
 * Inicializa el estado de autenticación al cargar la aplicación.
 */
// Flag para evitar auto-login durante inicialización
let initializationComplete = false;

async function initializeAuth() {
    try {
        console.log('Iniciando autenticación...');
        isLoading.value = true;

        // 1. Intentar recuperar sesión existente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error obteniendo sesión:', error);
            // Solo limpiar si hay error
            user.value = null;
            profile.value = { username: null, role: null, onboarding_complete: false };
        } else if (session?.user) {
            // Sesión válida encontrada - restaurar usuario
            console.log('Sesión válida encontrada para:', session.user.email);
            user.value = session.user;

            // Cargar perfil en background
            try {
                await getProfile(session.user.id);
                console.log('Perfil cargado exitosamente');
            } catch (profileError) {
                console.error('Error cargando perfil:', profileError);
                // No destruir sesión si falla el perfil
            }
        } else {
            // No hay sesión - estado limpio
            console.log('No hay sesión activa');
            user.value = null;
            profile.value = { username: null, role: null, onboarding_complete: false };
        }

        console.log('Autenticación inicializada');
    } catch (e) {
        console.error('Error crítico en initializeAuth:', e);
        // En caso de error crítico, estado limpio
        user.value = null;
        profile.value = { username: null, role: null, onboarding_complete: false };
    } finally {
        // Desbloquear router guard
        isLoading.value = false;

        // Activar listener después de inicialización
        setTimeout(() => {
            initializationComplete = true;
            console.log('Listener de auth ahora activo');
        }, 500);
    }
}

// Se ejecuta el inicializador al cargar el archivo
initializeAuth();

// Listener para cambios posteriores (login, logout, refresco de token)
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event);

    // IGNORAR eventos durante inicialización
    if (!initializationComplete) {
        console.log('Ignorando evento durante inicialización:', event);
        return;
    }

    try {
        if (event === 'SIGNED_IN') {
            console.log('Procesando login');
            const currentUser = session.user;
            user.value = currentUser;
            await getProfile(currentUser.id);
        } else if (event === 'TOKEN_REFRESHED') {
            // Mantener sesión activa cuando se refresca el token
            console.log('Token refrescado, manteniendo sesión');
            if (session?.user && !user.value) {
                // Si tenemos sesión pero no usuario local, restaurar
                user.value = session.user;
                await getProfile(session.user.id);
            }
        } else if (event === 'USER_UPDATED') {
            console.log('Usuario actualizado');
            if (session?.user) {
                user.value = session.user;
                await getProfile(session.user.id);
            }
        } else if (event === 'SIGNED_OUT') {
            console.log('Procesando logout');
            user.value = null;
            profile.value = { username: null, role: null, onboarding_complete: false };
        }
    } catch (e) {
        console.error("Error durante el cambio de estado de Auth:", e);
    } finally {
        isLoading.value = false;
    }
});


// -----------------------------------------------------
// 4. COMPOSABLE PRINCIPAL
// -----------------------------------------------------

export function useAuth() {
    //const router = useRouter();

    // Propiedades calculadas (CRÍTICO: usar ?. para seguridad)
    const isAuthenticated = computed(() => !!user.value);
    const hasRole = computed(() => !!profile.value?.role);
    const isAdmin = computed(() => profile.value?.role === 'admin');
    const isClient = computed(() => profile.value?.role === 'client');
    const isSupplier = computed(() => profile.value?.role === 'supplier');
    const isOnboardingComplete = computed(() => profile.value?.onboarding_complete);

    // 🕶️ FLYNN MODE - DIGITAL GOD POWERS ⚡
    const isFlynn = computed(() => user.value?.email === FLYNN_EMAIL);
    const isAdminGod = computed(() =>
        isFlynn.value ||
        (profile.value?.role === 'admin' && profile.value?.sub_role === 'god')
    );

    // Flynn can assume any role for testing/supervision
    const currentGridMode = ref('admin'); // Default grid mode for Flynn
    const availableGrids = ['admin', 'client', 'supplier'];

    // Flynn powers
    const enterGrid = (gridType) => {
        if (!isFlynn.value) return false;

        currentGridMode.value = gridType;
        console.log(`🌌 Flynn entering ${gridType.toUpperCase()} GRID...`);

        // Play "The Grid" sound effect here if implemented
        if (typeof window !== 'undefined' && window.playGridSound) {
            window.playGridSound(gridType);
        }

        return true;
    };

    // Flynn navigation bypass
    const canAccessRoute = (routeRole) => {
        // Flynn has access to everything
        if (isFlynn.value || isAdminGod.value) {
            return true;
        }

        // Normal role checking
        return profile.value?.role === routeRole;
    };


    return {
        // Estado
        isAuthenticated,
        isLoading,
        user,
        profile,

        // Lógica de Roles y Estado
        hasRole,
        isAdmin,
        isClient,
        isSupplier,
        isOnboardingComplete,

        // 🕶️ FLYNN MODE POWERS ⚡
        isFlynn,
        isAdminGod,
        currentGridMode,
        availableGrids,
        enterGrid,
        canAccessRoute,

        // Funcionalidad
        login,
        logout,
        signUp,
        updateProfileRole,
        completeOnboarding,
        updateProfileLocally: getProfile,
    };
}