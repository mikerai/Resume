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
            '/api/nubarium/ocr': {
                target: 'https://ocr.nubarium.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/ocr/, ''),
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('mantex:M#tifk_#c').toString('base64'));
                    });
                }
            },
            '/api/nubarium/sat': {
                target: 'https://sat.nubarium.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/sat/, ''),
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('mantex:M#tifk_#c').toString('base64'));
                    });
                }
            },
            '/api/nubarium/biometrics': {
                target: 'https://biometrics.nubarium.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/biometrics/, ''),
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('mantex:M#tifk_#c').toString('base64'));
                    });
                }
            },
            '/api/nubarium/ine': {
                target: 'https://ine.nubarium.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nubarium\/ine/, ''),
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('mantex:M#tifk_#c').toString('base64'));
                    });
                }
            }
        }
    }
});