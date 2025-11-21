<template>
    <div class="min-h-screen flex items-center justify-center px-4 py-8" style="background: linear-gradient(180deg, var(--surface-50) 10%, var(--primary-50) 90%);">
        <div class="w-full max-w-2xl">
            <div class="card shadow-lg">
                <!-- Header with Sakai styling -->
                <div class="text-center mb-6">
                    <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-12 w-auto mx-auto mb-4">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467Z" fill="var(--primary-color)" />
                    </svg>
                    <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Bienvenido a Mantex</h1>
                    <p class="text-surface-600 dark:text-surface-200 mt-2">Hola, {{ userName }}. Selecciona tu rol para continuar</p>
                </div>

                <!-- Role selection with Sakai cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div v-for="option in roleOptions" :key="option.code"
                         class="card cursor-pointer transition-all duration-300 hover:shadow-lg"
                         :class="{
                             'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-400/10': selectedRole === option.code,
                             'hover:scale-[1.02]': selectedRole !== option.code
                         }"
                         @click="selectedRole = option.code">

                        <div class="flex items-start gap-3">
                            <RadioButton :id="option.code" name="role" :value="option.code" v-model="selectedRole" />
                            <div class="flex-1">
                                <label :for="option.code" class="font-semibold text-surface-900 dark:text-surface-0 cursor-pointer">
                                    {{ option.name }}
                                </label>
                                <p class="text-sm text-surface-600 dark:text-surface-200 mt-2">{{ option.description }}</p>
                            </div>
                        </div>

                        <!-- Role icon -->
                        <div class="flex justify-center mt-4">
                            <div class="w-16 h-16 rounded-full flex items-center justify-center"
                                 :class="selectedRole === option.code ? 'bg-primary-100 dark:bg-primary-400/20' : 'bg-surface-100 dark:bg-surface-700'">
                                <i :class="option.code === 'client' ? 'pi pi-building text-2xl text-primary-500' : 'pi pi-briefcase text-2xl text-primary-500'"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Messages -->
                <div v-if="errorMessage" class="p-3 mb-4 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-600 rounded-md">
                    <p class="text-red-700 dark:text-red-400">{{ errorMessage }}</p>
                </div>

                <div class="p-3 mb-6 bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-600 rounded-md">
                    <p class="text-blue-700 dark:text-blue-400 text-sm">
                        Tu rol define las herramientas y permisos disponibles. Podrás actualizar tu información de perfil más adelante.
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center">
                    <Button label="Cerrar Sesión" icon="pi pi-sign-out" text @click="logout" />
                    <Button
                        label="Continuar"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        @click="handleSubmitRole"
                        :loading="loading"
                        :disabled="!selectedRole || loading"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import Button from 'primevue/button';
import RadioButton from 'primevue/radiobutton';

const router = useRouter();
const { user, updateProfileRole, logout } = useAuth();
const loading = ref(false);
const errorMessage = ref(null);
const selectedRole = ref(null);

// User name for greeting
const userName = computed(() => user.value?.email || 'Nuevo Usuario');

// Role options
const roleOptions = ref([
    {
        name: 'Cliente',
        code: 'client',
        description: 'Gestiona activos y solicita servicios de mantenimiento para tu empresa.'
    },
    {
        name: 'Proveedor',
        code: 'supplier',
        description: 'Ofrece servicios de mantenimiento y recibe trabajos asignados.'
    }
]);

// Submit role selection
const handleSubmitRole = async () => {
    if (!selectedRole.value) {
        errorMessage.value = 'Por favor, seleccione un rol para continuar.';
        return;
    }
    if (!user.value?.id) {
        errorMessage.value = 'Error de autenticación. Por favor, intente iniciar sesión de nuevo.';
        await router.replace('/login');
        return;
    }

    loading.value = true;
    errorMessage.value = null;

    try {
        await updateProfileRole(user.value.id, selectedRole.value);
        await router.replace(`/onboarding/${selectedRole.value}`);
    } catch (error) {
        console.error('Error durante la selección de rol:', error);
        errorMessage.value = 'Fallo al guardar la selección. Inténtelo de nuevo.';
        loading.value = false;
    }
};
</script>