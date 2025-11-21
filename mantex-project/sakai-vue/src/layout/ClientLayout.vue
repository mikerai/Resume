<template>
    <div class="layout-wrapper" :class="containerClass">
        <!-- 🕶️ FLYNN'S GRID SWITCHER ⚡ -->
        <FlynnsGridSwitcher />

        <!-- AppTopbar - Exactly like Sakai -->
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                    <i class="pi pi-bars"></i>
                </button>
                <router-link to="/client/dashboard" class="layout-topbar-logo">
                    <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467Z" fill="var(--primary-color)" />
                    </svg>
                    <span>Mantex</span>
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
                <AppClientMenu />
            </div>
        </div>

        <!-- Main content area - Exactly like Sakai -->
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
import AppClientMenu from './AppClientMenu.vue';

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
/* No se agregan estilos fuera del estándar del template */
</style>