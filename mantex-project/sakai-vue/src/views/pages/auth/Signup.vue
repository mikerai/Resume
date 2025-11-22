<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';

// Importaciones de PrimeVue
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

// Importamos nuestro composable de Supabase
import { useAuth } from '@/composables/useAuth'; 

// --- Inicialización y Estado ---
const { signUp } = useAuth(); 
const router = useRouter();

// --- Estado del Formulario ---
const email = ref('');
const password = ref('');
const passwordConfirm = ref(''); 

const errorMessage = ref('');
const loading = ref(false);

/**
 * Maneja el envío del formulario para registrar solo con email/contraseña.
 * Si es exitoso, redirige a role-selection.
 */
const handleSignup = async () => {
    errorMessage.value = '';
    loading.value = true;

    // VALIDACIÓN 1: Contraseñas deben coincidir
    if (password.value !== passwordConfirm.value) {
        errorMessage.value = 'Las contraseñas no coinciden. Por favor, verifica ambos campos.';
        loading.value = false;
        return;
    }

    // VALIDACIÓN 2: Longitud mínima de la contraseña
    if (password.value.length < 6) {
        errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
        loading.value = false;
        return;
    }

    try {
        // Llamar a la función que registra en Auth y espera a que se cargue el perfil
        await signUp(email.value, password.value);

        // Signup exitoso - redirigir a role-selection
        // El router guard verificará que estamos autenticados y permitirá el acceso
        await router.push('/role-selection');

    } catch (error) {
        console.error('Signup error:', error);

        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            errorMessage.value = 'El correo electrónico ya está registrado. Por favor, inicia sesión.';
        } else {
            errorMessage.value = 'Ocurrió un error inesperado al intentar registrarse.';
        }
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <RouterLink to="/" class="flex items-center gap-2">
                            <img src="/demo/images/logo.png" alt="Mantex Logo" class="mb-8 w-16 mx-auto"/>
                        </RouterLink>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Crear una Cuenta en Mantex</div>
                        <span class="text-muted-color font-medium">Completa los campos para continuar</span>
                    </div>
                    
                    <form @submit.prevent="handleSignup">
                        
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Correo electrónico</label>
                        <InputText 
                            id="email1" 
                            type="email" 
                            placeholder="Correo electrónico" 
                            class="w-full md:w-[30rem] mb-8" 
                            v-model="email" 
                            required
                        />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                        <Password 
                            id="password1" 
                            v-model="password" 
                            placeholder="Contraseña" 
                            :toggleMask="true" 
                            class="mb-8" 
                            fluid 
                            :feedback="false"
                            required
                        ></Password>
                        
                        <label for="password2" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirmar Contraseña</label>
                        <Password 
                            id="password2" 
                            v-model="passwordConfirm" 
                            placeholder="Repite la Contraseña" 
                            :toggleMask="true" 
                            class="mb-4" 
                            fluid 
                            :feedback="false"
                            required
                        ></Password>
                        
                        <div class="mb-4">
                            <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
                        </div>
                        

                        <Button 
                            label="Crear Cuenta y Elegir Rol" 
                            class="w-full mt-2" 
                            type="submit" 
                            :loading="loading"
                        />
                        
                        <div class="mt-4 text-center">
                            <span class="text-muted-color">Ya tienes cuenta?</span>
                            <RouterLink to="/login" class="font-medium text-primary ml-2">Inicia Sesión</RouterLink>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>