<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/constants.js';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Timeline from 'primevue/timeline';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';

const toast = useToast();
const { user } = useAuth();

// State
const loading = ref(true);
const tickets = ref([]);
const branches = ref([]);
const assets = ref([]);
const viewMode = ref('timeline'); // 'timeline' or 'table'

// Filters
const filters = ref({
    branch_id: null,
    asset_id: null,
    dateRange: null,
    status: null
});

const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Abierto', value: 'open' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'Resuelto', value: 'resolved' },
    { label: 'Cerrado', value: 'closed' }
];

// Computed
const filteredTickets = computed(() => {
    let result = tickets.value;

    if (filters.value.branch_id) {
        result = result.filter(t => t.branch_id === filters.value.branch_id);
    }

    if (filters.value.asset_id) {
        result = result.filter(t => t.asset_id === filters.value.asset_id);
    }

    if (filters.value.status) {
        result = result.filter(t => t.status === filters.value.status);
    }

    if (filters.value.dateRange && filters.value.dateRange[0] && filters.value.dateRange[1]) {
        const start = new Date(filters.value.dateRange[0]);
        const end = new Date(filters.value.dateRange[1]);
        // Adjust end date to include the full day
        end.setHours(23, 59, 59, 999);
        
        result = result.filter(t => {
            const date = new Date(t.created_at);
            return date >= start && date <= end;
        });
    }

    return result;
});

const filteredAssets = computed(() => {
    if (!filters.value.branch_id) return assets.value;
    return assets.value.filter(a => a.branch_id === filters.value.branch_id);
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        // 1. Get Client ID
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.value.id)
            .single();
            
        if (clientError) throw clientError;
        const clientId = clientData.id;

        // 2. Load Branches
        const { data: branchData } = await supabase
            .from('client_branches')
            .select('id, name')
            .eq('client_id', clientId);
        branches.value = branchData || [];

        // 3. Load Assets
        const { data: assetData } = await supabase
            .from('client_assets')
            .select('id, name, branch_id')
            .eq('client_id', clientId);
        assets.value = assetData || [];

        // 4. Load Tickets (History)
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select(`
                *,
                branch:client_branches(name),
                asset:client_assets(name, category)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (ticketError) throw ticketError;
        tickets.value = ticketData || [];

    } catch (error) {
        console.error('Error loading history:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const getStatusLabel = (status) => {
    const map = {
        'open': 'Abierto',
        'in_progress': 'En Progreso',
        'resolved': 'Resuelto',
        'closed': 'Cerrado',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
};

const getStatusSeverity = (status) => {
    const map = {
        'open': 'info',
        'in_progress': 'warn',
        'resolved': 'success',
        'closed': 'success',
        'cancelled': 'danger'
    };
    return map[status] || 'secondary';
};

const clearFilters = () => {
    filters.value = {
        branch_id: null,
        asset_id: null,
        dateRange: null,
        status: null
    };
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12">
            <div class="card">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h5 class="m-0 text-xl font-semibold">Bitácora de Mantenimiento</h5>
                    
                    <div class="flex gap-2">
                        <Button 
                            icon="pi pi-list" 
                            class="p-button-sm" 
                            :class="{ 'p-button-outlined': viewMode !== 'timeline' }"
                            @click="viewMode = 'timeline'"
                            v-tooltip="'Vista de Línea de Tiempo'"
                        />
                        <Button 
                            icon="pi pi-table" 
                            class="p-button-sm" 
                            :class="{ 'p-button-outlined': viewMode !== 'table' }"
                            @click="viewMode = 'table'"
                            v-tooltip="'Vista de Tabla'"
                        />
                    </div>
                </div>

                <!-- Filters -->
                <div class="grid grid-cols-12 gap-4 mb-6 p-4 surface-50 border-round">
                    <div class="col-span-12 md:col-span-3">
                        <label class="block text-sm font-medium mb-2">Sucursal</label>
                        <Dropdown 
                            v-model="filters.branch_id" 
                            :options="branches" 
                            optionLabel="name" 
                            optionValue="id" 
                            placeholder="Todas las sucursales" 
                            class="w-full"
                            showClear
                        />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label class="block text-sm font-medium mb-2">Activo</label>
                        <Dropdown 
                            v-model="filters.asset_id" 
                            :options="filteredAssets" 
                            optionLabel="name" 
                            optionValue="id" 
                            placeholder="Todos los activos" 
                            class="w-full"
                            showClear
                            :disabled="!assets.length"
                        />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label class="block text-sm font-medium mb-2">Estado</label>
                        <Dropdown 
                            v-model="filters.status" 
                            :options="statusOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Todos los estados" 
                            class="w-full"
                            showClear
                        />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label class="block text-sm font-medium mb-2">Fecha</label>
                        <Calendar 
                            v-model="filters.dateRange" 
                            selectionMode="range" 
                            :manualInput="false" 
                            placeholder="Rango de fechas" 
                            class="w-full"
                            showButtonBar
                        />
                    </div>
                </div>

                <!-- Timeline View -->
                <div v-if="viewMode === 'timeline'" class="px-4">
                    <div v-if="filteredTickets.length === 0" class="text-center p-6 text-500">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron registros con los filtros seleccionados
                    </div>
                    <Timeline :value="filteredTickets" align="alternate" class="customized-timeline">
                        <template #marker="slotProps">
                            <span class="flex w-2rem h-2rem items-center justify-center text-white border-circle z-1 shadow-1" 
                                :class="{
                                    'bg-blue-500': slotProps.item.status === 'open',
                                    'bg-orange-500': slotProps.item.status === 'in_progress',
                                    'bg-green-500': slotProps.item.status === 'resolved' || slotProps.item.status === 'closed',
                                    'bg-red-500': slotProps.item.status === 'cancelled'
                                }">
                                <i :class="{
                                    'pi pi-exclamation-circle': slotProps.item.status === 'open',
                                    'pi pi-cog': slotProps.item.status === 'in_progress',
                                    'pi pi-check': slotProps.item.status === 'resolved' || slotProps.item.status === 'closed',
                                    'pi pi-times': slotProps.item.status === 'cancelled'
                                }"></i>
                            </span>
                        </template>
                        <template #content="slotProps">
                            <Card class="mb-4 shadow-2">
                                <template #title>
                                    <div class="flex justify-between items-start">
                                        <span class="text-lg font-bold">{{ slotProps.item.title }}</span>
                                        <Tag :value="getStatusLabel(slotProps.item.status)" :severity="getStatusSeverity(slotProps.item.status)" />
                                    </div>
                                </template>
                                <template #subtitle>
                                    <div class="flex flex-col gap-1 text-sm">
                                        <span class="text-primary font-medium">{{ formatDate(slotProps.item.created_at) }}</span>
                                        <span v-if="slotProps.item.branch" class="text-600">
                                            <i class="pi pi-building mr-1"></i> {{ slotProps.item.branch.name }}
                                        </span>
                                        <span v-if="slotProps.item.asset" class="text-600">
                                            <i class="pi pi-box mr-1"></i> {{ slotProps.item.asset.name }}
                                        </span>
                                    </div>
                                </template>
                                <template #content>
                                    <p class="m-0 text-700 line-height-3">
                                        {{ slotProps.item.description }}
                                    </p>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </div>

                <!-- Table View -->
                <div v-else>
                    <DataTable :value="filteredTickets" :paginator="true" :rows="10" responsiveLayout="scroll" stripedRows>
                        <Column field="created_at" header="Fecha" sortable>
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.created_at) }}
                            </template>
                        </Column>
                        <Column field="title" header="Asunto" sortable></Column>
                        <Column header="Ubicación" sortable field="branch.name">
                            <template #body="slotProps">
                                {{ slotProps.data.branch?.name || 'N/A' }}
                            </template>
                        </Column>
                        <Column header="Activo" sortable field="asset.name">
                            <template #body="slotProps">
                                {{ slotProps.data.asset?.name || 'N/A' }}
                            </template>
                        </Column>
                        <Column field="status" header="Estado" sortable>
                            <template #body="slotProps">
                                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                        <Column header="Acciones">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip="'Ver Detalles'" />
                            </template>
                        </Column>
                        <template #empty>
                            <div class="text-center p-4">No se encontraron registros</div>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.customized-timeline {
    ::v-deep(.p-timeline-event-opposite) {
        display: none;
    }
    ::v-deep(.p-timeline-event-content) {
        padding-bottom: 2rem;
    }
}

@media (min-width: 960px) {
    .customized-timeline {
        ::v-deep(.p-timeline-event-opposite) {
            display: block;
            flex: 1;
            padding: 0 1rem;
            text-align: right;
        }
        ::v-deep(.p-timeline-event-content) {
            flex: 1;
        }
    }
}
</style>
