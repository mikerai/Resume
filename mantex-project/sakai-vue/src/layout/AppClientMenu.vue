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
                to: '/client/dashboard'
            }
        ]
    },
    {
        label: 'Servicios',
        items: [
            {
                label: 'Solicitudes',
                icon: 'pi pi-fw pi-plus-circle',
                to: '/client/requests'
            },
            {
                label: 'Aprobaciones',
                icon: 'pi pi-fw pi-check-circle',
                to: '/client/approvals'
            },
            {
                label: 'Calendario',
                icon: 'pi pi-fw pi-calendar',
                to: '/client/calendar'
            }
        ]
    },
    {
        label: 'Inventario',
        items: [
            {
                label: 'Mis Activos',
                icon: 'pi pi-fw pi-box',
                to: '/client/assets'
            }
        ]
    },
    {
        label: 'Mi Cuenta',
        items: [
            {
                label: 'Mi Empresa',
                icon: 'pi pi-fw pi-building',
                to: '/client/account'
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