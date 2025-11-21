<template>
    <div class="card" style="animation: slideInUp 0.6s ease-out;">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <div>
                <h5 class="m-0">{{ title }}</h5>
                <p class="text-muted-color text-sm mt-1" v-if="subtitle">{{ subtitle }}</p>
            </div>
            <div class="flex items-center gap-2" v-if="$slots.actions || showRefresh">
                <Button
                    v-if="showRefresh"
                    icon="pi pi-refresh"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    @click="refreshChart"
                    :loading="refreshing"
                    v-tooltip.top="'Actualizar'"
                />
                <slot name="actions"></slot>
            </div>
        </div>

        <!-- Chart Container with loading state -->
        <div class="relative" :style="{ height: height }">
            <!-- Loading overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 flex items-center justify-center bg-surface-0 dark:bg-surface-900 bg-opacity-75 rounded-lg z-10"
                style="animation: fadeIn 0.3s ease-out;"
            >
                <ProgressSpinner size="40" />
            </div>

            <!-- Chart -->
            <Chart
                :type="type"
                :data="chartData"
                :options="chartOptions"
                :class="{ 'opacity-50': loading }"
                class="transition-opacity duration-300"
                :style="{ height: '100%' }"
            />

            <!-- Empty state -->
            <div
                v-if="!loading && (!chartData || !chartData.datasets || chartData.datasets.length === 0)"
                class="absolute inset-0 flex flex-col items-center justify-center text-muted-color"
            >
                <i class="pi pi-chart-line text-6xl mb-4 opacity-30"></i>
                <p class="text-lg">{{ emptyMessage }}</p>
            </div>
        </div>

        <!-- Chart legend/info (opcional) -->
        <div v-if="showLegend && chartData && chartData.datasets" class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-600">
            <div class="flex flex-wrap gap-4">
                <div
                    v-for="(dataset, index) in chartData.datasets"
                    :key="index"
                    class="flex items-center gap-2"
                >
                    <div
                        class="w-4 h-4 rounded border"
                        :style="{ backgroundColor: dataset.backgroundColor || dataset.borderColor }"
                    ></div>
                    <span class="text-sm text-surface-600 dark:text-surface-200">{{ dataset.label }}</span>
                </div>
            </div>
        </div>

        <!-- Footer slot -->
        <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-600">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLayout } from '@/layout/composables/layout'
import Chart from 'primevue/chart'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
    // Chart config
    type: { type: String, required: true }, // 'bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    height: { type: String, default: '400px' },

    // Data
    data: { type: Object, default: null },
    options: { type: Object, default: () => ({}) },

    // States
    loading: { type: Boolean, default: false },
    emptyMessage: { type: String, default: 'No hay datos disponibles' },

    // Features
    showRefresh: { type: Boolean, default: true },
    showLegend: { type: Boolean, default: false },
    animationDuration: { type: Number, default: 1000 },

    // Theme
    responsive: { type: Boolean, default: true },
    maintainAspectRatio: { type: Boolean, default: false }
})

const emit = defineEmits(['refresh'])

const { isDarkTheme } = useLayout()
const refreshing = ref(false)

// Computed chart data with theme support
const chartData = computed(() => {
    if (!props.data) return null

    // Clone data to avoid mutations
    const data = JSON.parse(JSON.stringify(props.data))

    // Apply theme colors if not explicitly set
    if (data.datasets) {
        data.datasets.forEach((dataset, index) => {
            if (!dataset.backgroundColor && !dataset.borderColor) {
                const colors = getThemeColors()
                dataset.backgroundColor = colors[index % colors.length]
                dataset.borderColor = colors[index % colors.length]
            }
        })
    }

    return data
})

// Computed chart options with theme support
const chartOptions = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement)
    const textColor = documentStyle.getPropertyValue('--text-color')
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary')
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border')

    const baseOptions = {
        responsive: props.responsive,
        maintainAspectRatio: props.maintainAspectRatio,
        animation: {
            duration: props.animationDuration,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    font: {
                        family: 'Urbanist, sans-serif',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                cornerRadius: 8,
                font: {
                    family: 'Urbanist, sans-serif'
                }
            }
        }
    }

    // Add scales for chart types that support them
    if (['bar', 'line'].includes(props.type)) {
        baseOptions.scales = {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        family: 'Urbanist, sans-serif',
                        weight: 500
                    }
                },
                grid: {
                    display: props.type === 'line',
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        family: 'Urbanist, sans-serif'
                    }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    }

    // Merge with custom options
    return { ...baseOptions, ...props.options }
})

// Theme colors
const getThemeColors = () => {
    const documentStyle = getComputedStyle(document.documentElement)
    return [
        documentStyle.getPropertyValue('--p-primary-500'),
        documentStyle.getPropertyValue('--p-blue-500'),
        documentStyle.getPropertyValue('--p-green-500'),
        documentStyle.getPropertyValue('--p-orange-500'),
        documentStyle.getPropertyValue('--p-purple-500'),
        documentStyle.getPropertyValue('--p-red-500'),
        documentStyle.getPropertyValue('--p-cyan-500'),
        documentStyle.getPropertyValue('--p-pink-500')
    ]
}

// Refresh handler
const refreshChart = async () => {
    refreshing.value = true
    try {
        emit('refresh')
        // Add small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
        refreshing.value = false
    }
}

// Watch for theme changes
watch(isDarkTheme, () => {
    // Force chart re-render when theme changes
    // Chart.js will automatically pick up new CSS variables
})
</script>

<style scoped>
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--content-border-radius);
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: var(--card-shadow);
    border-color: var(--primary-color);
}

/* Chart container styling */
:deep(.p-chart) {
    position: relative;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    :deep(.p-chart canvas) {
        max-height: 300px !important;
    }
}
</style>