<template>
    <div
        class="card transition-all duration-300"
        :class="cardClasses"
        style="animation: fadeInUp 0.6s ease-out;"
        :style="{ animationDelay: `${animationDelay}ms` }"
    >
        <!-- Header -->
        <div
            v-if="title || subtitle || $slots.header || $slots.actions"
            class="flex justify-between items-start mb-4"
            :class="{ 'pb-4 border-b border-surface-200 dark:border-surface-600': headerBorder }"
        >
            <div class="flex-1">
                <!-- Custom header slot -->
                <slot name="header">
                    <div v-if="title || subtitle">
                        <h5 v-if="title" class="m-0 font-semibold text-surface-900 dark:text-surface-0">
                            <i v-if="icon" :class="[icon, 'mr-2', iconColor || 'text-primary']"></i>
                            {{ title }}
                        </h5>
                        <p v-if="subtitle" class="text-muted-color text-sm mt-1 mb-0">
                            {{ subtitle }}
                        </p>
                    </div>
                </slot>
            </div>

            <!-- Actions slot -->
            <div v-if="$slots.actions" class="flex items-center gap-2 ml-4">
                <slot name="actions"></slot>
            </div>
        </div>

        <!-- Loading state -->
        <div
            v-if="loading"
            class="flex items-center justify-center py-8"
            style="animation: pulse 2s ease-in-out infinite;"
        >
            <ProgressSpinner size="40" />
        </div>

        <!-- Content -->
        <div v-else class="card-content" :class="contentClass">
            <!-- Stats/Metrics (if provided) -->
            <div v-if="stats && stats.length > 0" class="mb-4">
                <div class="grid gap-4" :class="statsGridClass">
                    <div
                        v-for="(stat, index) in stats"
                        :key="index"
                        class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                        style="animation: slideInRight 0.5s ease-out;"
                        :style="{ animationDelay: `${index * 100}ms` }"
                    >
                        <div
                            v-if="stat.icon"
                            class="flex items-center justify-center rounded-full transition-all duration-300"
                            :class="stat.iconBg || 'bg-primary-100 dark:bg-primary-900'"
                            style="width: 2.5rem; height: 2.5rem"
                        >
                            <i :class="[stat.icon, stat.iconColor || 'text-primary', 'text-lg']"></i>
                        </div>
                        <div class="flex-1">
                            <div class="text-surface-900 dark:text-surface-0 font-medium">
                                {{ stat.value }}
                            </div>
                            <div class="text-muted-color text-sm">
                                {{ stat.label }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main content slot -->
            <slot></slot>

            <!-- Chart container (if chart type specified) -->
            <div v-if="chartData && chartType" class="mt-4">
                <StandardChart
                    :type="chartType"
                    :data="chartData"
                    :options="chartOptions"
                    :height="chartHeight"
                    :title="chartTitle"
                    :show-legend="showChartLegend"
                />
            </div>

            <!-- Image (if provided) -->
            <div v-if="image" class="mt-4">
                <img
                    :src="image"
                    :alt="imageAlt"
                    class="w-full rounded-lg shadow-sm transition-transform duration-300 hover:scale-105"
                    :class="imageClass"
                />
            </div>
        </div>

        <!-- Footer -->
        <div
            v-if="$slots.footer"
            class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-600"
        >
            <slot name="footer"></slot>
        </div>

        <!-- Empty state -->
        <div
            v-if="!loading && !$slots.default && !stats?.length && !chartData && !image"
            class="flex flex-col items-center justify-center py-8 text-muted-color"
        >
            <i class="pi pi-inbox text-4xl mb-4 opacity-50"></i>
            <p class="text-lg">{{ emptyMessage }}</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import StandardChart from './StandardChart.vue'

const props = defineProps({
    // Header
    title: { type: String, default: null },
    subtitle: { type: String, default: null },
    icon: { type: String, default: null },
    iconColor: { type: String, default: null },
    headerBorder: { type: Boolean, default: true },

    // States
    loading: { type: Boolean, default: false },
    emptyMessage: { type: String, default: 'No hay contenido disponible' },

    // Styling
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'elevated', 'outlined', 'filled'].includes(value)
    },
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    hoverable: { type: Boolean, default: true },
    clickable: { type: Boolean, default: false },
    contentClass: { type: String, default: '' },

    // Stats
    stats: { type: Array, default: () => [] },
    statsGridClass: { type: String, default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' },

    // Chart integration
    chartType: { type: String, default: null },
    chartData: { type: Object, default: null },
    chartOptions: { type: Object, default: () => ({}) },
    chartHeight: { type: String, default: '300px' },
    chartTitle: { type: String, default: null },
    showChartLegend: { type: Boolean, default: false },

    // Image
    image: { type: String, default: null },
    imageAlt: { type: String, default: 'Image' },
    imageClass: { type: String, default: '' },

    // Animation
    animationDelay: { type: Number, default: 0 }
})

const emit = defineEmits(['click'])

const cardClasses = computed(() => {
    const classes = []

    // Variant classes
    switch (props.variant) {
        case 'elevated':
            classes.push('shadow-lg border-0')
            break
        case 'outlined':
            classes.push('border-2 border-surface-300 dark:border-surface-600')
            break
        case 'filled':
            classes.push('bg-surface-100 dark:bg-surface-800 border-0')
            break
        default:
            classes.push('shadow-md')
    }

    // Size classes
    switch (props.size) {
        case 'small':
            classes.push('p-3')
            break
        case 'large':
            classes.push('p-6')
            break
        default:
            classes.push('p-4')
    }

    // Interactive classes
    if (props.hoverable) {
        classes.push('hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700')
    }

    if (props.clickable) {
        classes.push('cursor-pointer hover:scale-[1.02]')
    }

    return classes
})

// Handle card click
const handleCardClick = (event) => {
    if (props.clickable) {
        emit('click', event)
    }
}
</script>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

.card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--content-border-radius);
}

.card-content {
    line-height: 1.6;
}

/* Hover effects */
.card:hover {
    transform: translateY(-2px);
}

.card.cursor-pointer:active {
    transform: translateY(0) scale(0.98);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .card {
        margin: 0.5rem 0;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
    .card {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
}
</style>