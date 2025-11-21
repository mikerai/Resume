<template>
    <div class="layout-wrapper" :class="containerClass">
        <!-- Standard Topbar -->
        <div class="layout-topbar" :class="topbarClass">
            <div class="layout-topbar-logo-container">
                <!-- Menu toggle button -->
                <button
                    class="layout-menu-button layout-topbar-action transition-all duration-300 hover:scale-110"
                    @click="toggleSidebar"
                >
                    <i class="pi pi-bars"></i>
                </button>

                <!-- Logo -->
                <router-link to="/" class="layout-topbar-logo">
                    <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-300 hover:scale-105">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467Z"
                            fill="var(--primary-color)"
                        />
                    </svg>
                    <span class="font-bold text-xl">{{ appName }}</span>
                </router-link>
            </div>

            <!-- Topbar Actions -->
            <div class="layout-topbar-actions">
                <!-- Notifications -->
                <div class="relative" v-if="showNotifications">
                    <button
                        class="layout-topbar-action transition-all duration-300 hover:scale-110"
                        @click="toggleNotifications"
                    >
                        <i class="pi pi-bell"></i>
                        <Badge
                            v-if="notificationCount > 0"
                            :value="notificationCount"
                            severity="danger"
                            class="absolute -top-1 -right-1"
                        />
                    </button>

                    <!-- Notifications panel -->
                    <div
                        v-if="showNotificationPanel"
                        class="notification-panel absolute right-0 top-full mt-2 w-80 bg-surface-0 dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-600 z-50"
                        style="animation: slideDown 0.3s ease-out;"
                    >
                        <div class="p-4">
                            <h6 class="font-semibold mb-3">Notificaciones</h6>
                            <div class="space-y-2">
                                <div
                                    v-for="notification in notifications"
                                    :key="notification.id"
                                    class="flex items-center gap-3 p-2 rounded-lg bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors cursor-pointer"
                                >
                                    <div
                                        class="flex items-center justify-center w-8 h-8 rounded-full"
                                        :class="notification.iconBg || 'bg-primary-100 dark:bg-primary-900'"
                                    >
                                        <i :class="[notification.icon, notification.iconColor || 'text-primary']"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-sm font-medium">{{ notification.title }}</div>
                                        <div class="text-xs text-muted-color">{{ notification.message }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Theme toggle -->
                <button
                    class="layout-topbar-action transition-all duration-300 hover:scale-110"
                    @click="toggleTheme"
                >
                    <i :class="['pi', isDarkMode ? 'pi-sun' : 'pi-moon']"></i>
                </button>

                <!-- User menu -->
                <div class="relative">
                    <button
                        class="layout-topbar-action transition-all duration-300 hover:scale-110"
                        @click="toggleUserMenu"
                    >
                        <Avatar
                            v-if="userAvatar"
                            :image="userAvatar"
                            shape="circle"
                            size="normal"
                        />
                        <i v-else class="pi pi-user"></i>
                    </button>

                    <!-- User menu panel -->
                    <div
                        v-if="showUserMenu"
                        class="user-menu-panel absolute right-0 top-full mt-2 w-60 bg-surface-0 dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-600 z-50"
                        style="animation: slideDown 0.3s ease-out;"
                    >
                        <div class="p-4 border-b border-surface-200 dark:border-surface-600">
                            <div class="flex items-center gap-3">
                                <Avatar
                                    v-if="userAvatar"
                                    :image="userAvatar"
                                    shape="circle"
                                    size="large"
                                />
                                <div>
                                    <div class="font-semibold">{{ userName || 'Usuario' }}</div>
                                    <div class="text-sm text-muted-color">{{ userRole || 'Rol' }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="p-2">
                            <button
                                v-for="menuItem in userMenuItems"
                                :key="menuItem.label"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left"
                                @click="menuItem.command"
                            >
                                <i :class="menuItem.icon"></i>
                                <span>{{ menuItem.label }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="layout-content-wrapper">
            <!-- Sidebar -->
            <div
                class="layout-sidebar"
                :class="sidebarClass"
            >
                <div class="layout-sidebar-content">
                    <!-- Custom sidebar content -->
                    <slot name="sidebar">
                        <!-- Navigation Menu -->
                        <nav class="layout-menu">
                            <ul class="layout-menu-list">
                                <li
                                    v-for="item in menuItems"
                                    :key="item.label"
                                    class="layout-menu-item"
                                >
                                    <router-link
                                        :to="item.to"
                                        class="layout-menu-link transition-all duration-300 hover:scale-105"
                                        :class="{ 'active': $route.path === item.to }"
                                    >
                                        <i :class="[item.icon, 'layout-menu-icon']"></i>
                                        <span class="layout-menu-label">{{ item.label }}</span>
                                        <Badge
                                            v-if="item.badge"
                                            :value="item.badge"
                                            severity="info"
                                            size="small"
                                        />
                                    </router-link>
                                </li>
                            </ul>
                        </nav>
                    </slot>
                </div>
            </div>

            <!-- Main content -->
            <div class="layout-main" :class="mainClass">
                <div class="layout-main-content">
                    <slot></slot>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="showFooter" class="layout-footer">
            <slot name="footer">
                <div class="flex justify-between items-center text-sm text-muted-color">
                    <span>© 2024 {{ appName }}. Todos los derechos reservados.</span>
                    <span>Versión {{ appVersion }}</span>
                </div>
            </slot>
        </div>

        <!-- Backdrop for mobile -->
        <div
            v-if="sidebarVisible"
            class="layout-mask lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
            @click="hideSidebar"
        ></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayout } from '@/layout/composables/layout'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'

const props = defineProps({
    // App info
    appName: { type: String, default: 'Mantex' },
    appVersion: { type: String, default: '1.0.0' },

    // Layout options
    sidebarVisible: { type: Boolean, default: false },
    showFooter: { type: Boolean, default: true },
    showNotifications: { type: Boolean, default: true },

    // Menu items
    menuItems: { type: Array, default: () => [] },

    // User info
    userName: { type: String, default: null },
    userRole: { type: String, default: null },
    userAvatar: { type: String, default: null },
    userMenuItems: { type: Array, default: () => [] },

    // Notifications
    notifications: { type: Array, default: () => [] },

    // Styling
    containerClass: { type: String, default: '' },
    topbarClass: { type: String, default: '' },
    sidebarClass: { type: String, default: '' },
    mainClass: { type: String, default: '' }
})

const emit = defineEmits(['sidebar-toggle', 'theme-toggle', 'logout'])

const router = useRouter()
const { isDarkTheme, toggleDarkMode } = useLayout()

// Component state
const showNotificationPanel = ref(false)
const showUserMenu = ref(false)

// Computed properties
const isDarkMode = computed(() => isDarkTheme.value)
const notificationCount = computed(() => props.notifications.length)

// Methods
const toggleSidebar = () => {
    emit('sidebar-toggle')
}

const hideSidebar = () => {
    emit('sidebar-toggle', false)
}

const toggleTheme = () => {
    toggleDarkMode()
    emit('theme-toggle', isDarkMode.value)
}

const toggleNotifications = () => {
    showNotificationPanel.value = !showNotificationPanel.value
    showUserMenu.value = false
}

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value
    showNotificationPanel.value = false
}

// Close menus when clicking outside
const closeMenus = (event) => {
    if (!event.target.closest('.notification-panel') && !event.target.closest('.layout-topbar-action')) {
        showNotificationPanel.value = false
    }
    if (!event.target.closest('.user-menu-panel') && !event.target.closest('.layout-topbar-action')) {
        showUserMenu.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
    document.removeEventListener('click', closeMenus)
})
</script>

<style scoped>
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Layout structure */
.layout-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.layout-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    transition: all 0.3s ease;
}

.layout-topbar-logo-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.layout-topbar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    font-family: 'Petrona', serif;
    color: var(--text-color);
}

.layout-topbar-logo svg {
    width: 32px;
    height: 24px;
}

.layout-topbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.layout-topbar-action {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.layout-topbar-action:hover {
    background: var(--highlight-bg);
    color: var(--primary-color);
}

.layout-content-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.layout-sidebar {
    width: 280px;
    background: var(--surface-card);
    border-right: 1px solid var(--surface-border);
    transition: all 0.3s ease;
}

.layout-sidebar-content {
    height: 100%;
    overflow-y: auto;
    padding: 1rem 0;
}

.layout-main {
    flex: 1;
    overflow: auto;
}

.layout-main-content {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
}

.layout-footer {
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
    padding: 1rem 1.5rem;
}

/* Menu styling */
.layout-menu-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.layout-menu-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    text-decoration: none;
    color: var(--text-color);
    border-left: 3px solid transparent;
    transition: all 0.3s ease;
}

.layout-menu-link:hover {
    background: var(--highlight-bg);
    border-left-color: var(--primary-color);
    color: var(--primary-color);
}

.layout-menu-link.active {
    background: var(--primary-50);
    color: var(--primary-color);
    border-left-color: var(--primary-color);
    font-weight: 600;
}

.layout-menu-icon {
    width: 1.25rem;
    text-align: center;
}

.layout-menu-label {
    flex: 1;
}

/* Mobile responsive */
@media (max-width: 1024px) {
    .layout-sidebar {
        position: fixed;
        top: 0;
        left: -280px;
        height: 100vh;
        z-index: 50;
    }

    .layout-sidebar.visible {
        left: 0;
    }

    .layout-main-content {
        padding: 1rem;
    }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
    .layout-topbar {
        background: var(--surface-800);
    }

    .layout-sidebar {
        background: var(--surface-800);
    }

    .notification-panel,
    .user-menu-panel {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
}
</style>