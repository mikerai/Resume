import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importamos el Router con nuestros Guards

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import { createPinia } from 'pinia';

// Importación del cliente de Supabase (Asumo que lo tienes en un archivo de librería)
// Aunque no lo "usamos" directamente aquí, es buena práctica tener la importación si la usas en otro lugar.
// import { supabase } from '@/lib/supabaseClient'; 

import '@/assets/tailwind.css';
import '@/assets/styles.scss';

// --- Creación de la Aplicación ---
const app = createApp(App);

// Inicializar Pinia
const pinia = createPinia();
app.use(pinia);

// Inicializar Router (que contiene los Guards que usan useAuth/Supabase)
app.use(router);

// --- Configuración de PrimeVue ---
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

app.use(ToastService);
app.use(ConfirmationService);

// --- Montaje de la Aplicación ---
app.mount('#app');