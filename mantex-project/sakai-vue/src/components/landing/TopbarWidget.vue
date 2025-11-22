<script setup>
import { useRouter, RouterLink } from 'vue-router';
import Button from 'primevue/button';

const router = useRouter();

// --- Funciones Estéticas (smooth scroll) ---
const smoothScroll = (id) => {
    document.getElementById(id).scrollIntoView({
        behavior: 'smooth'
    });
};

// --- Navegación simple ---
const goToLogin = () => {
    router.push('/login');
};

const goToSignup = () => {
    router.push('/signup');
};

</script>

<template>
    <header class="fixed top-0 left-0 w-full p-4 lg:p-6 bg-surface z-50 shadow-md">
        <div class="container mx-auto flex items-center justify-between">
            
            <RouterLink to="/" class="flex items-center gap-2">
                <img src="/demo/images/logo.png" alt="Mantex Logo" style="height: 2rem; width: auto;" />
                <span class="text-xl font-bold text-primary">Mantex</span>
            </RouterLink>
            
            <nav class="hidden lg:flex gap-6">
                <a @click="smoothScroll('features')" class="cursor-pointer hover:text-primary transition-colors">Características</a>
                <a @click="smoothScroll('pricing')" class="cursor-pointer hover:text-primary transition-colors">Precios</a>
                <a @click="smoothScroll('contact')" class="cursor-pointer hover:text-primary transition-colors">Contacto</a>
            </nav>
            
            <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2 items-center">
                <Button
                    label="Login"
                    @click="goToLogin"
                    rounded
                />

                <Button
                    label="Registro"
                    severity="secondary"
                    @click="goToSignup"
                    rounded
                />
            </div>
        </div>
    </header>
</template>

<style scoped>
/* Estilos opcionales */
</style>