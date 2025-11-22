<script setup>
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';

const { isAuthenticated, profile } = useAuth();

// Determinar la ruta de dashboard correcta según el rol
const dashboardRoute = computed(() => {
    if (!isAuthenticated.value) {
        return '/login';
    }

    const role = profile.value?.role;

    if (role === 'admin') {
        return '/admin/dashboard';
    } else if (role === 'client') {
        return '/client/dashboard';
    } else if (role === 'supplier') {
        return '/supplier/dashboard';
    } else {
        return '/role-selection';
    }
});

const dashboardLabel = computed(() => {
    return isAuthenticated.value ? 'Ir al Dashboard' : 'Iniciar Sesión';
});
</script>

<template>
    <FloatingConfigurator />
    <div class="flex items-center justify-center min-h-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <img src="/demo/images/logo.png" alt="Mantex Logo" class="mb-8 w-32" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                    <span class="text-primary font-bold text-3xl">404</span>
                    <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">Página no encontrada</h1>
                    <div class="text-surface-600 dark:text-surface-200 mb-8">El recurso solicitado no está disponible.</div>
                    <router-link :to="dashboardRoute" class="w-full flex items-center py-8 border-surface-300 dark:border-surface-500 border-b">
                        <span class="flex justify-center items-center border-2 border-primary text-primary rounded-border" style="height: 3.5rem; width: 3.5rem">
                            <i class="pi pi-fw pi-home !text-2xl"></i>
                        </span>
                        <span class="ml-6 flex flex-col">
                            <span class="text-surface-900 dark:text-surface-0 lg:text-xl font-medium mb-0 block">Panel Principal</span>
                            <span class="text-surface-600 dark:text-surface-200 lg:text-xl">Regresa a tu panel de control principal.</span>
                        </span>
                    </router-link>
                    <router-link to="/" class="w-full flex items-center py-8 border-surface-300 dark:border-surface-500 border-b">
                        <span class="flex justify-center items-center border-2 border-primary text-primary rounded-border" style="height: 3.5rem; width: 3.5rem">
                            <i class="pi pi-fw pi-question-circle !text-2xl"></i>
                        </span>
                        <span class="ml-6 flex flex-col">
                            <span class="text-surface-900 dark:text-surface-0 lg:text-xl font-medium mb-0">Centro de Ayuda</span>
                            <span class="text-surface-600 dark:text-surface-200 lg:text-xl">Encuentra respuestas a tus preguntas.</span>
                        </span>
                    </router-link>
                    <router-link to="/" class="w-full flex items-center mb-8 py-8 border-surface-300 dark:border-surface-500 border-b">
                        <span class="flex justify-center items-center border-2 border-primary text-primary rounded-border" style="height: 3.5rem; width: 3.5rem">
                            <i class="pi pi-fw pi-info-circle !text-2xl"></i>
                        </span>
                        <span class="ml-6 flex flex-col">
                            <span class="text-surface-900 dark:text-surface-0 lg:text-xl font-medium mb-0">Información</span>
                            <span class="text-surface-600 dark:text-surface-200 lg:text-xl">Conoce más sobre Mantex y nuestros servicios.</span>
                        </span>
                    </router-link>
                    <Button as="router-link" :label="dashboardLabel" :to="dashboardRoute" />
                </div>
            </div>
        </div>
    </div>
</template>
