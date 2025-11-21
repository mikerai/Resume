<template>
    <div :class="containerClass">
        <div
            v-for="(stat, index) in stats"
            :key="stat.key || index"
            :class="itemClass"
            style="animation: fadeInUp 0.6s ease-out;"
            :style="{ animationDelay: `${index * animationDelay}ms` }"
        >
            <div
                class="card mb-0 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                @click="onStatClick(stat)"
            >
                <div class="flex justify-between mb-4">
                    <div class="flex-1">
                        <span class="block text-muted-color font-medium mb-4 transition-colors duration-300">
                            {{ stat.label }}
                        </span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl transition-all duration-300">
                            {{ formatValue(stat.value, stat.format) }}
                        </div>
                        <div v-if="stat.subtitle" class="text-sm text-muted-color mt-1">
                            {{ stat.subtitle }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center rounded-border transition-all duration-300 hover:scale-110"
                        :class="stat.iconBg || getDefaultIconBg(index)"
                        :style="{ width: iconSize, height: iconSize }"
                    >
                        <i
                            :class="[
                                stat.icon,
                                stat.iconColor || getDefaultIconColor(index),
                                '!text-xl',
                                { 'animate-spin': stat.loading }
                            ]"
                        ></i>
                    </div>
                </div>

                <!-- Progress indicator -->
                <div v-if="stat.showProgress && stat.progress !== undefined" class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-muted-color">Progreso</span>
                        <span class="font-medium">{{ Math.round(stat.progress) }}%</span>
                    </div>
                    <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                        <div
                            class="h-2 rounded-full transition-all duration-700 ease-out"
                            :class="getProgressColor(stat.progress)"
                            :style="{ width: `${Math.min(stat.progress, 100)}%` }"
                        ></div>
                    </div>
                </div>

                <!-- Change indicator -->
                <div v-if="stat.change !== undefined" class="flex items-center gap-2">
                    <span
                        class="font-medium transition-colors duration-300"
                        :class="getChangeColor(stat.change)"
                    >
                        <i
                            :class="[
                                'pi',
                                stat.change > 0 ? 'pi-arrow-up' : stat.change < 0 ? 'pi-arrow-down' : 'pi-minus',
                                'text-xs mr-1'
                            ]"
                        ></i>
                        {{ formatChange(stat.change) }}
                    </span>
                    <span class="text-muted-color">{{ stat.changeLabel || 'desde el último período' }}</span>
                </div>

                <!-- Custom footer content -->
                <div v-if="stat.footer" class="mt-3 pt-3 border-t border-surface-200 dark:border-surface-600">
                    <div class="text-sm text-muted-color">{{ stat.footer }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    // Main data
    stats: {
        type: Array,
        required: true,
        default: () => []
    },

    // Layout options
    columns: {
        type: [Number, String, Object],
        default: 4,
        validator: (value) => {
            if (typeof value === 'number') return value >= 1 && value <= 12
            if (typeof value === 'string') return ['auto', 'fit'].includes(value)
            if (typeof value === 'object') {
                return value.sm || value.md || value.lg || value.xl
            }
            return false
        }
    },

    // Styling
    gap: { type: String, default: '4' },
    iconSize: { type: String, default: '2.5rem' },
    animationDelay: { type: Number, default: 100 },

    // Responsive behavior
    responsive: { type: Boolean, default: true }
})

const emit = defineEmits(['stat-click'])

// Computed classes
const containerClass = computed(() => {
    let classes = ['grid']

    // Grid gap
    classes.push(`gap-${props.gap}`)

    // Column classes
    if (typeof props.columns === 'number') {
        classes.push(`grid-cols-1`)
        if (props.responsive) {
            classes.push(`md:grid-cols-${Math.min(props.columns, 2)}`)
            classes.push(`lg:grid-cols-${Math.min(props.columns, 3)}`)
            classes.push(`xl:grid-cols-${props.columns}`)
        } else {
            classes.push(`grid-cols-${props.columns}`)
        }
    } else if (typeof props.columns === 'object') {
        if (props.columns.sm) classes.push(`sm:grid-cols-${props.columns.sm}`)
        if (props.columns.md) classes.push(`md:grid-cols-${props.columns.md}`)
        if (props.columns.lg) classes.push(`lg:grid-cols-${props.columns.lg}`)
        if (props.columns.xl) classes.push(`xl:grid-cols-${props.columns.xl}`)
    }

    return classes
})

const itemClass = computed(() => {
    return 'col-span-1'
})

// Default styling functions
const getDefaultIconBg = (index) => {
    const backgrounds = [
        'bg-blue-100 dark:bg-blue-400/10',
        'bg-orange-100 dark:bg-orange-400/10',
        'bg-cyan-100 dark:bg-cyan-400/10',
        'bg-purple-100 dark:bg-purple-400/10',
        'bg-green-100 dark:bg-green-400/10',
        'bg-red-100 dark:bg-red-400/10',
        'bg-pink-100 dark:bg-pink-400/10',
        'bg-indigo-100 dark:bg-indigo-400/10'
    ]
    return backgrounds[index % backgrounds.length]
}

const getDefaultIconColor = (index) => {
    const colors = [
        'text-blue-500',
        'text-orange-500',
        'text-cyan-500',
        'text-purple-500',
        'text-green-500',
        'text-red-500',
        'text-pink-500',
        'text-indigo-500'
    ]
    return colors[index % colors.length]
}

const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-yellow-500'
    if (progress >= 30) return 'bg-orange-500'
    return 'bg-red-500'
}

const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-muted-color'
}

// Formatting functions
const formatValue = (value, format) => {
    if (!format) return value

    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(value)
        case 'percentage':
            return `${value}%`
        case 'number':
            return new Intl.NumberFormat('es-MX').format(value)
        case 'compact':
            return new Intl.NumberFormat('es-MX', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value)
        default:
            return value
    }
}

const formatChange = (change) => {
    const absChange = Math.abs(change)
    if (absChange >= 1) {
        return `${absChange.toFixed(1)}%`
    }
    return `${(absChange * 100).toFixed(1)}%`
}

// Event handlers
const onStatClick = (stat) => {
    if (stat.clickable !== false) {
        emit('stat-click', stat)
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

.card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--content-border-radius);
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.card:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
}

/* Icon animation for loading states */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .card {
        padding: 1rem;
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

/* Progress bar animations */
.progress-bar {
    animation: progressFill 1.5s ease-out forwards;
}

@keyframes progressFill {
    from {
        width: 0%;
    }
    to {
        width: var(--progress-width, 0%);
    }
}
</style>