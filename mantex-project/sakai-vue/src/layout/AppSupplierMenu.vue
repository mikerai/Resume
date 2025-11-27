<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import AppMenuItem from './AppMenuItem.vue';

const { logout } = useAuth();

const model = ref([
    {
        label: 'Dashboard',
        items: [
            {
                label: 'Panel Principal',
                icon: 'pi pi-fw pi-home',
                to: '/supplier/dashboard'
            }
        ]
    },
    {
        label: 'Trabajos',
        items: [
            {
                label: 'Trabajos Disponibles',
                icon: 'pi pi-fw pi-briefcase',
                to: '/supplier/jobs'
            },
            {
                label: 'Calendario',
                icon: 'pi pi-fw pi-calendar',
                to: '/supplier/calendar'
            },
            {
                label: 'Históricos',
                icon: 'pi pi-fw pi-history',
                to: '/supplier/history'
            }
        ]
    },
    {
        label: 'Mi Cuenta',
        items: [
            {
                label: 'Configuración',
                icon: 'pi pi-fw pi-cog',
                to: '/supplier/settings'
            },
            {
                label: 'Cerrar Sesión',
                icon: 'pi pi-fw pi-sign-out',
                command: () => logout()
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <AppMenuItem :item="item" :index="i" :root="true" />
        </template>
    </ul>
</template>