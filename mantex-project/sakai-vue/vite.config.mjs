// vite.config.mjs
import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
        // CORRECCIÓN: Incluir el cliente de Supabase y otros módulos CJS comunes
        include: [
            'jwt-decode',
            '@supabase/supabase-js', // Añadimos el cliente de Supabase
            'process',               // Módulo CJS común que necesita ser transformado
        ],
        noDiscovery: true
    },
    plugins: [
        vue(),
        tailwindcss(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 5173
        // No proxy needed - usando Lambda proxy directamente para localhost, dev y prod
    }
});