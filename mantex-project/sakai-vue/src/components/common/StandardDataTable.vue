<template>
    <div class="card">
        <!-- Header con título y controles -->
        <div class="flex justify-between items-center mb-4">
            <div>
                <h5 class="m-0">{{ title }}</h5>
                <p class="text-muted-color text-sm mt-1" v-if="subtitle">{{ subtitle }}</p>
            </div>
            <div class="flex items-center gap-2">
                <!-- Search -->
                <span class="p-input-icon-left" v-if="showSearch">
                    <i class="pi pi-search"></i>
                    <InputText
                        v-model="searchTerm"
                        :placeholder="searchPlaceholder"
                        class="w-full md:w-20rem transition-all duration-300 focus:shadow-lg"
                    />
                </span>

                <!-- Filters -->
                <slot name="filters"></slot>

                <!-- Actions -->
                <slot name="actions"></slot>
            </div>
        </div>

        <!-- Stats Cards (si se proporcionan) -->
        <div class="grid mb-4" v-if="stats && stats.length > 0">
            <div
                v-for="(stat, index) in stats"
                :key="index"
                :class="statsColClass"
                style="animation: fadeInUp 0.5s ease-out;"
                :style="{ animationDelay: `${index * 0.1}s` }"
            >
                <div class="surface-card p-3 border-round transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <div class="flex justify-between mb-3">
                        <div>
                            <span class="block text-muted-color font-medium mb-1">{{ stat.label }}</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stat.value }}</div>
                        </div>
                        <div
                            class="flex items-center justify-center border-round transition-all duration-300 hover:scale-110"
                            :class="stat.iconBg"
                            style="width: 2.5rem; height: 2.5rem"
                        >
                            <i :class="[stat.icon, stat.iconColor, 'text-xl']"></i>
                        </div>
                    </div>
                    <span v-if="stat.detail" :class="stat.detailColor || 'text-primary'">{{ stat.detail }}</span>
                    <span v-if="stat.description" class="text-muted-color">{{ stat.description }}</span>
                </div>
            </div>
        </div>

        <!-- DataTable con animaciones -->
        <div class="table-container" style="animation: slideInUp 0.6s ease-out;">
            <DataTable
                :value="filteredData"
                :paginator="paginator"
                :rows="rows"
                :loading="loading"
                :responsive-layout="responsiveLayout"
                :row-hover="rowHover"
                :data-key="dataKey"
                :selection="selection"
                @update:selection="$emit('update:selection', $event)"
                @row-click="$emit('row-click', $event)"
                :class="tableClass"
                :scrollable="scrollable"
                :scroll-height="scrollHeight"
            >
                <!-- Selection column -->
                <Column
                    v-if="showSelection"
                    selection-mode="multiple"
                    :header-style="{ width: '3rem' }"
                />

                <!-- Dynamic columns -->
                <slot></slot>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    data: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },

    // Search
    showSearch: { type: Boolean, default: true },
    searchPlaceholder: { type: String, default: 'Buscar...' },
    searchFields: { type: Array, default: () => [] },

    // Stats
    stats: { type: Array, default: () => [] },
    statsColClass: { type: String, default: 'col-12 md:col-3' },

    // Table options
    paginator: { type: Boolean, default: true },
    rows: { type: Number, default: 15 },
    responsiveLayout: { type: String, default: 'scroll' },
    rowHover: { type: Boolean, default: true },
    dataKey: { type: String, default: 'id' },
    showSelection: { type: Boolean, default: false },
    selection: { type: Array, default: () => [] },
    tableClass: { type: String, default: 'w-full' },
    scrollable: { type: Boolean, default: false },
    scrollHeight: { type: String, default: '400px' }
})

const emit = defineEmits(['update:selection', 'row-click'])

const searchTerm = ref('')

// Computed filtered data
const filteredData = computed(() => {
    if (!searchTerm.value || props.searchFields.length === 0) {
        return props.data
    }

    return props.data.filter(item => {
        return props.searchFields.some(field => {
            const value = getNestedValue(item, field)
            return value?.toString().toLowerCase().includes(searchTerm.value.toLowerCase())
        })
    })
})

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Watch for external search changes
watch(() => props.data, () => {
    // Reset search when data changes
    if (searchTerm.value && filteredData.value.length === 0) {
        searchTerm.value = ''
    }
})
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

.table-container {
    overflow: hidden;
    border-radius: var(--content-border-radius);
}

.p-datatable .p-datatable-tbody > tr {
    transition: all 0.2s ease;
}

.p-datatable .p-datatable-tbody > tr:hover {
    background-color: var(--highlight-bg);
    transform: translateX(2px);
}

.surface-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
}

.surface-card:hover {
    border-color: var(--primary-color);
}

/* Responsive animations */
@media (max-width: 768px) {
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
</style>