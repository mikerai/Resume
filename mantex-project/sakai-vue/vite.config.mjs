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
        port: 5173,
        proxy: {
            // Proxy para OCR de Nubarium
            '^/api/nubarium/ocr': {
                target: 'https://ocr.nubarium.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/ocr/, '')
            },
            // Proxy para SAT de Nubarium
            '^/api/nubarium/sat': {
                target: 'https://sat.nubarium.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/sat/, '')
            },
            // Proxy para Biometrics de Nubarium
            '^/api/nubarium/biometrics': {
                target: 'https://biometrics.nubarium.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/biometrics/, '')
            },
            // Proxy para INE de Nubarium
            '^/api/nubarium/ine': {
                target: 'https://ine.nubarium.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/ine/, '')
            }
        }
    }
});