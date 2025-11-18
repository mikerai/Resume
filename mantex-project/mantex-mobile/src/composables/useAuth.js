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
        const { data, error } = await Promise.race([
            supabase
                .from('profiles')
                .select(`username, role, onboarding_complete`)
                .eq('id', userId)
                .single(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('getProfile timeout - 3 segundos')), 3000)
            )
        ]);
        console.log('✅ Query completada');

        const duration = Date.now() - startTime;
        console.log(`⏱️ getProfile tardó ${duration}ms`);

        if (data) {
            profile.value = {
                username: data.username,
                role: data.role,
                onboarding_complete: data.onboarding_complete,
            };
            console.log('✅ Perfil obtenido:', profile.value);
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error al obtener perfil:', error.message, error);
            profile.value = { username: null, role: null, onboarding_complete: false };
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

        // Llamada al logout de Supabase
        const { error } = await supabase.auth.signOut();

        if (error && !error.message.includes('timeout')) {
            console.error('Error en logout:', error);
            // Continúa con logout local aunque falle el servidor
        }

        // Limpiar estado inmediatamente (no esperar al listener)
        user.value = null;
        profile.value = { username: null, role: null, onboarding_complete: false };
        isLoading.value = false;

        // Redirección inmediata
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }

        console.log('✅ Logout exitoso');
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
async function initializeAuth() {
    try {
        console.log('🚀 Iniciando autenticación...');

        // Force logout any existing session to ensure clean state
        await supabase.auth.signOut();

        // Reset all auth state
        user.value = null;
        profile.value = { username: null, role: null, onboarding_complete: false };

        console.log('👤 Usuario actual: No autenticado (forzado)');
    } catch (e) {
        console.error('❌ Error crítico en initializeAuth:', e);
    } finally {
        // 3. DESBLOQUEAR: Esto es CRÍTICO para el Router Guard.
        console.log('✅ Autenticación inicializada (sin auto-login)');
        isLoading.value = false;
    }
}

// Se ejecuta el inicializador al cargar el archivo
initializeAuth();


// Listener para cambios posteriores (login, logout, refresco de token)
supabase.auth.onAuthStateChange(async (event, session) => {
    try {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const currentUser = session.user;
            user.value = currentUser;
            await getProfile(currentUser.id); 
        } else if (event === 'SIGNED_OUT') {
            user.value = null;
            profile.value = { username: null, role: null, onboarding_complete: false };
        }
    } catch (e) {
        console.error("Error durante el cambio de estado de Auth:", e);
    } finally {
        // 🚀 Desbloqueo garantizado, sin importar el éxito de getProfile
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