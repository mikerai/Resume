<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
// ... otros imports de componentes

import { useAuth } from '@/composables/useAuth'; 

const { login } = useAuth();
const router = useRouter(); 

const email = ref('');
const password = ref(''); 
const errorMessage = ref('');
const loading = ref(false);

const handleLogin = async () => {
    errorMessage.value = '';
    loading.value = true;

    try {
        // Ejecutar el login y esperar a que el perfil se cargue
        await login(email.value, password.value);

        // Login exitoso - redirigir al dashboard correcto según el rol
        const { profile } = useAuth();
        const role = profile.value?.role;

        if (role === 'admin') {
            await router.push('/admin/dashboard');
        } else if (role === 'client') {
            await router.push('/client/dashboard');
        } else if (role === 'supplier') {
            await router.push('/supplier/dashboard');
        } else {
            // Sin rol, redirigir a selección de rol
            await router.push('/role-selection');
        }

    } catch (error) {
        console.error('Login error:', error);

        if (error.message.includes('Invalid login credentials')) {
            errorMessage.value = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        } else {
            errorMessage.value = 'Ocurrió un error inesperado al intentar iniciar sesión.';
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
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">¡Bienvenido de Nuevo!</div>
                        <span class="text-muted-color font-medium">Ingresa tus credenciales para continuar</span>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        
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
                        
                        <div class="mb-4">
                            <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
                        </div>
                        
                        <Button 
                            label="Iniciar Sesión" 
                            class="w-full mt-2" 
                            type="submit" 
                            :loading="loading"
                        />
                        
                        <div class="mt-4 text-center">
                            <span class="text-muted-color">¿Aún no tienes cuenta?</span>
                            <RouterLink to="/signup" class="font-medium text-primary ml-2">Regístrate</RouterLink>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ... (Tus estilos) ... */
</style>