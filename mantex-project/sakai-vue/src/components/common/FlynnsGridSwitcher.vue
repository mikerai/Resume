<template>
    <!-- 🕶️ FLYNN'S GRID SWITCHER - MASTER OF THE DIGITAL REALM ⚡ -->
    <div
        v-if="isFlynn"
        class="flynn-grid-switcher"
        :class="{ 'flynn-mode-active': showGridPanel }"
    >
        <!-- Flynn Indicator -->
        <div class="flynn-indicator" @click="toggleGridPanel">
            <div class="flynn-avatar">
                <i class="pi pi-user flynn-icon"></i>
                <div class="flynn-glow"></div>
            </div>
            <div class="flynn-status">
                <span class="flynn-name">FLYNN</span>
                <span class="flynn-grid">{{ currentGridMode.toUpperCase() }} GRID</span>
            </div>
            <i class="pi pi-chevron-down flynn-chevron" :class="{ 'rotated': showGridPanel }"></i>
        </div>

        <!-- Grid Switcher Panel -->
        <transition name="flynn-panel">
            <div v-if="showGridPanel" class="flynn-panel">
                <div class="flynn-panel-header">
                    <h3>🌌 GRID ACCESS</h3>
                    <span class="flynn-subtitle">Master of the Digital Realm</span>
                </div>

                <div class="grid-options">
                    <div
                        v-for="grid in availableGrids"
                        :key="grid"
                        class="grid-option"
                        :class="{
                            'active': currentGridMode === grid,
                            'admin-grid': grid === 'admin',
                            'client-grid': grid === 'client',
                            'supplier-grid': grid === 'supplier'
                        }"
                        @click="switchGrid(grid)"
                    >
                        <div class="grid-icon">
                            <i :class="getGridIcon(grid)"></i>
                            <div class="grid-glow"></div>
                        </div>
                        <div class="grid-info">
                            <div class="grid-name">{{ grid.toUpperCase() }}</div>
                            <div class="grid-subtitle">{{ getGridSubtitle(grid) }}</div>
                            <div class="grid-status" v-if="currentGridMode === grid">
                                <span class="status-indicator">● ACTIVE</span>
                            </div>
                        </div>
                        <div class="grid-arrow">
                            <i class="pi pi-arrow-right"></i>
                        </div>
                    </div>
                </div>

                <div class="flynn-powers">
                    <h4>⚡ FLYNN POWERS</h4>
                    <div class="power-list">
                        <div class="power-item">
                            <i class="pi pi-eye"></i>
                            <span>Omniscient View</span>
                        </div>
                        <div class="power-item">
                            <i class="pi pi-key"></i>
                            <span>Universal Access</span>
                        </div>
                        <div class="power-item">
                            <i class="pi pi-cog"></i>
                            <span>System Override</span>
                        </div>
                        <div class="power-item">
                            <i class="pi pi-shield"></i>
                            <span>Security Bypass</span>
                        </div>
                    </div>
                </div>

                <div class="flynn-footer">
                    <div class="flynn-email">{{ user?.email }}</div>
                    <div class="flynn-motto">"I FIGHT FOR THE USER"</div>
                </div>
            </div>
        </transition>

        <!-- Background overlay when panel is open -->
        <div
            v-if="showGridPanel"
            class="flynn-overlay"
            @click="showGridPanel = false"
        ></div>
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

export default {
    name: 'FlynnsGridSwitcher',
    setup() {
        const {
            isFlynn,
            currentGridMode,
            availableGrids,
            enterGrid,
            user
        } = useAuth()

        const router = useRouter()
        const showGridPanel = ref(false)

        // Grid switching logic
        const switchGrid = async (gridType) => {
            if (enterGrid(gridType)) {
                // Play sound effect
                playGridSound(gridType)

                // Show entering message
                showEnteringMessage(gridType)

                // Close panel after switch
                setTimeout(() => {
                    showGridPanel.value = false
                }, 1500)

                // Navigate to appropriate dashboard
                const routes = {
                    admin: '/admin/dashboard',
                    client: '/client/dashboard',
                    supplier: '/supplier/dashboard'
                }

                if (routes[gridType]) {
                    router.push(routes[gridType])
                }
            }
        }

        const toggleGridPanel = () => {
            showGridPanel.value = !showGridPanel.value
        }

        const getGridIcon = (grid) => {
            const icons = {
                admin: 'pi pi-cog',
                client: 'pi pi-shopping-cart',
                supplier: 'pi pi-truck'
            }
            return icons[grid] || 'pi pi-circle'
        }

        const getGridSubtitle = (grid) => {
            const subtitles = {
                admin: 'System Control',
                client: 'Marketplace Access',
                supplier: 'Asset Management'
            }
            return subtitles[grid] || 'Unknown Grid'
        }

        const playGridSound = (gridType) => {
            // Create audio context for "The Grid" style sounds
            if (typeof window !== 'undefined' && window.AudioContext) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)()

                // Different frequencies for different grids
                const frequencies = {
                    admin: 220,    // Low, powerful
                    client: 330,   // Mid, welcoming
                    supplier: 440  // High, energetic
                }

                // Create oscillator for synth sound
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = frequencies[gridType]
                oscillator.type = 'sine'

                // Envelope
                gainNode.gain.setValueAtTime(0, audioContext.currentTime)
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.8)
            }

            console.log(`🎵 Playing ${gridType.toUpperCase()} GRID entry sound...`)
        }

        const showEnteringMessage = (gridType) => {
            // Create a temporary notification
            const notification = document.createElement('div')
            notification.className = 'flynn-entering-message'
            notification.innerHTML = `
                <div class="entering-content">
                    <div class="entering-icon">🌌</div>
                    <div class="entering-text">ENTERING ${gridType.toUpperCase()} GRID...</div>
                    <div class="entering-loader"></div>
                </div>
            `

            document.body.appendChild(notification)

            // Remove after animation
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 2000)
        }

        // Close panel when clicking outside
        const handleClickOutside = (event) => {
            if (showGridPanel.value && !event.target.closest('.flynn-grid-switcher')) {
                showGridPanel.value = false
            }
        }

        // Add global click listener
        if (typeof window !== 'undefined') {
            document.addEventListener('click', handleClickOutside)
        }

        return {
            isFlynn,
            currentGridMode,
            availableGrids,
            user,
            showGridPanel,
            switchGrid,
            toggleGridPanel,
            getGridIcon,
            getGridSubtitle
        }
    }
}
</script>

<style scoped>
/* 🌌 FLYNN'S GRID SWITCHER STYLES */
.flynn-grid-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    font-family: 'Courier New', monospace;
}

.flynn-indicator {
    display: flex;
    align-items: center;
    background: rgba(0, 20, 40, 0.95);
    border: 1px solid #00d4ff;
    border-radius: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.flynn-indicator:hover {
    background: rgba(0, 30, 60, 0.95);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    transform: translateY(-2px);
}

.flynn-avatar {
    position: relative;
    width: 32px;
    height: 32px;
    margin-right: 12px;
}

.flynn-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(45deg, #00d4ff, #0099cc);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    font-size: 16px;
    font-weight: bold;
}

.flynn-glow {
    position: absolute;
    top: -4px;
    left: -4px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent);
    animation: flynn-pulse 2s ease-in-out infinite;
}

@keyframes flynn-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 0.3; }
}

.flynn-status {
    display: flex;
    flex-direction: column;
    margin-right: 12px;
}

.flynn-name {
    color: #00d4ff;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
}

.flynn-grid {
    color: #66ccff;
    font-size: 10px;
    letter-spacing: 0.5px;
    opacity: 0.8;
}

.flynn-chevron {
    color: #00d4ff;
    transition: transform 0.3s ease;
    font-size: 12px;
}

.flynn-chevron.rotated {
    transform: rotate(180deg);
}

/* Flynn Panel */
.flynn-panel {
    position: absolute;
    top: 60px;
    right: 0;
    width: 380px;
    background: rgba(0, 15, 30, 0.98);
    border: 1px solid #00d4ff;
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(15px);
    box-shadow:
        0 0 40px rgba(0, 212, 255, 0.4),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
}

.flynn-panel-header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.3);
    padding-bottom: 15px;
}

.flynn-panel-header h3 {
    color: #00d4ff;
    font-size: 18px;
    margin: 0 0 5px 0;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.flynn-subtitle {
    color: #66ccff;
    font-size: 12px;
    opacity: 0.8;
}

/* Grid Options */
.grid-options {
    margin-bottom: 20px;
}

.grid-option {
    display: flex;
    align-items: center;
    padding: 15px;
    margin-bottom: 10px;
    background: rgba(0, 30, 60, 0.3);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.grid-option:hover {
    background: rgba(0, 40, 80, 0.5);
    border-color: #00d4ff;
    transform: translateX(5px);
}

.grid-option.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: #00d4ff;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.grid-option.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: #00d4ff;
}

.grid-icon {
    position: relative;
    width: 40px;
    height: 40px;
    margin-right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 18px;
}

.admin-grid .grid-icon {
    background: linear-gradient(45deg, #ff6b6b, #ff4757);
    color: white;
}

.client-grid .grid-icon {
    background: linear-gradient(45deg, #4ecdc4, #44bd32);
    color: white;
}

.supplier-grid .grid-icon {
    background: linear-gradient(45deg, #ffa726, #ff9800);
    color: white;
}

.grid-glow {
    position: absolute;
    top: -2px;
    left: -2px;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.grid-option:hover .grid-glow {
    opacity: 0.3;
}

.admin-grid .grid-glow {
    background: radial-gradient(circle, rgba(255, 107, 107, 0.4), transparent);
}

.client-grid .grid-glow {
    background: radial-gradient(circle, rgba(78, 205, 196, 0.4), transparent);
}

.supplier-grid .grid-glow {
    background: radial-gradient(circle, rgba(255, 167, 38, 0.4), transparent);
}

.grid-info {
    flex: 1;
}

.grid-name {
    color: #00d4ff;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
}

.grid-subtitle {
    color: #66ccff;
    font-size: 12px;
    opacity: 0.8;
    margin-top: 2px;
}

.grid-status {
    margin-top: 5px;
}

.status-indicator {
    color: #44bd32;
    font-size: 10px;
    font-weight: bold;
    animation: flynn-blink 1.5s ease-in-out infinite;
}

@keyframes flynn-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
}

.grid-arrow {
    color: #00d4ff;
    opacity: 0.7;
    transition: all 0.3s ease;
}

.grid-option:hover .grid-arrow {
    opacity: 1;
    transform: translateX(5px);
}

/* Flynn Powers */
.flynn-powers {
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(0, 40, 80, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(0, 212, 255, 0.2);
}

.flynn-powers h4 {
    color: #00d4ff;
    font-size: 14px;
    margin: 0 0 10px 0;
    letter-spacing: 1px;
}

.power-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.power-item {
    display: flex;
    align-items: center;
    color: #66ccff;
    font-size: 11px;
}

.power-item i {
    margin-right: 6px;
    width: 12px;
}

/* Flynn Footer */
.flynn-footer {
    text-align: center;
    padding-top: 15px;
    border-top: 1px solid rgba(0, 212, 255, 0.3);
}

.flynn-email {
    color: #00d4ff;
    font-size: 12px;
    font-weight: bold;
}

.flynn-motto {
    color: #66ccff;
    font-size: 10px;
    margin-top: 5px;
    font-style: italic;
    opacity: 0.8;
}

/* Panel Animation */
.flynn-panel-enter-active,
.flynn-panel-leave-active {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.flynn-panel-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
}

.flynn-panel-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

/* Overlay */
.flynn-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
    z-index: -1;
}

/* Entering Message */
.flynn-entering-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: rgba(0, 15, 30, 0.95);
    border: 2px solid #00d4ff;
    border-radius: 12px;
    padding: 30px 40px;
    text-align: center;
    animation: flynn-entering 2s ease-out forwards;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 50px rgba(0, 212, 255, 0.6);
}

.entering-content {
    color: #00d4ff;
    font-family: 'Courier New', monospace;
}

.entering-icon {
    font-size: 32px;
    margin-bottom: 10px;
    animation: flynn-spin 1s linear infinite;
}

.entering-text {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 15px;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8);
}

.entering-loader {
    width: 200px;
    height: 4px;
    background: rgba(0, 212, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
}

.entering-loader::after {
    content: '';
    position: absolute;
    left: -100%;
    top: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent);
    animation: flynn-loading 1.5s ease-in-out infinite;
}

@keyframes flynn-entering {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.05);
    }
    80% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
}

@keyframes flynn-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes flynn-loading {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* Responsive */
@media (max-width: 768px) {
    .flynn-grid-switcher {
        top: 10px;
        right: 10px;
    }

    .flynn-panel {
        width: calc(100vw - 40px);
        right: -10px;
    }
}
</style>