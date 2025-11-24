<template>
    <div class="layout-wrapper" :class="containerClass">
        <!-- 🕶️ FLYNN'S GRID SWITCHER ⚡ -->
        <FlynnsGridSwitcher />
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                    <i class="pi pi-bars"></i>
                </button>
                <router-link to="/admin/dashboard" class="layout-topbar-logo">
                    <img src="/demo/images/logo.png" alt="Mantex Logo" style="height: 2.5rem; width: auto;" />
                    <span class="text-xl font-bold text-primary">Mantex</span>
                </router-link>
            </div>

            <div class="layout-topbar-actions">
                <button type="button" class="layout-topbar-action" @click="logout">
                    <i class="pi pi-sign-out"></i>
                </button>
            </div>
        </div>

        <!-- AppSidebar - Using exact Sakai structure -->
        <div class="layout-sidebar">
            <div class="layout-menu-container">
                <AppAdminMenu />
            </div>
        </div>

        <div class="layout-main-container">
            <div class="layout-main">
                <router-view />
            </div>
        </div>

        <div class="layout-mask animate-fadein"></div>
    </div>
</template>

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, watch } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import FlynnsGridSwitcher from '@/components/common/FlynnsGridSwitcher.vue';
import AppAdminMenu from './AppAdminMenu.vue';

const { layoutConfig, layoutState, toggleMenu, isSidebarActive } = useLayout();
const { logout } = useAuth();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});

const onMenuToggle = () => {
    toggleMenu();
};

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
}
</script>

<style scoped>
/* No se agregan estilos personalizados fuera del estándar del template */
</style>