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
                to: '/admin/dashboard'
            }
        ]
    },
    {
        label: 'Gestión',
        items: [
            {
                label: 'Tickets',
                icon: 'pi pi-fw pi-ticket',
                to: '/admin/tickets'
            },
            {
                label: 'Usuarios',
                icon: 'pi pi-fw pi-users',
                to: '/admin/users'
            },
            {
                label: 'Validaciones',
                icon: 'pi pi-fw pi-check-circle',
                items: [
                    {
                        label: 'Empresas',
                        icon: 'pi pi-fw pi-building',
                        to: '/admin/suppliers-approval'
                    },
                    {
                        label: 'Técnicos',
                        icon: 'pi pi-fw pi-user-edit',
                        to: '/admin/verifications'
                    }
                ]
            },
            {
                label: 'Activos',
                icon: 'pi pi-fw pi-images',
                to: '/admin/assets'
            },
            {
                label: 'Calendario',
                icon: 'pi pi-fw pi-calendar',
                to: '/admin/calendar'
            }
        ]
    },
    {
        label: 'Automatización',
        items: [
            {
                label: 'Pagos',
                icon: 'pi pi-fw pi-dollar',
                to: '/admin/payment-automation'
            },
            {
                label: 'Evidencias',
                icon: 'pi pi-fw pi-eye',
                to: '/admin/evidence-oversight'
            }
        ]
    },
    {
        label: 'Mi Cuenta',
        items: [
            {
                label: 'Configuración',
                icon: 'pi pi-fw pi-cog',
                to: '/admin/account'
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