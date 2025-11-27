<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/constants.js';
import { useS3Upload } from '@/composables/useS3Upload';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Timeline from 'primevue/timeline';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Image from 'primevue/image';
import Divider from 'primevue/divider';
import Avatar from 'primevue/avatar';
import Chip from 'primevue/chip';

const toast = useToast();
const { user } = useAuth();
const { getSignedUrl } = useS3Upload();

// State
const loading = ref(true);
const tickets = ref([]);
const viewMode = ref('timeline'); // 'timeline' or 'table'
const showTicketDialog = ref(false);
const selectedTicket = ref({});

// Filters
const filters = ref({
    dateRange: null,
    status: null
});

const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Resuelto', value: 'resolved' },
    { label: 'Cerrado', value: 'closed' },
    { label: 'Cancelado', value: 'cancelled' }
];

// Computed
const filteredTickets = computed(() => {
    let result = tickets.value;

    if (filters.value.status) {
        result = result.filter(t => t.status === filters.value.status);
    }

    if (filters.value.dateRange && filters.value.dateRange[0] && filters.value.dateRange[1]) {
        const start = new Date(filters.value.dateRange[0]);
        const end = new Date(filters.value.dateRange[1]);
        end.setHours(23, 59, 59, 999);
        
        result = result.filter(t => {
            const date = new Date(t.created_at);
            return date >= start && date <= end;
        });
    }

    return result;
});

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        // 1. Get Supplier ID
        const { data: supplierData, error: supplierError } = await supabase
            .from('supplier_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();
            
        if (supplierError) throw supplierError;
        const supplierId = supplierData.id;

        // 2. Load Tickets (History - only completed/cancelled)
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select(`
                *,
                client:clients(company_name, contact_person),
                branch:client_branches(name, address, city, state),
                asset:client_assets(name, category)
            `)
            .eq('supplier_id', supplierId)
            .in('status', ['resolved', 'closed', 'cancelled'])
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

const viewTicket = async (ticket) => {
    selectedTicket.value = ticket;
    showTicketDialog.value = true;
    
    // Refresh signed URLs for attachments if needed
    if (ticket.attachments && ticket.attachments.length > 0) {
        const refreshedAttachments = await Promise.all(
            ticket.attachments.map(async (att) => ({
                ...att,
                url: att.key ? await getSignedUrl(att.key) : att.url
            }))
        );
        selectedTicket.value = { ...ticket, attachments: refreshedAttachments };
    }
};

const getStatusLabel = (status) => {
    const map = {
        'resolved': 'Resuelto',
        'closed': 'Cerrado',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
};

const getStatusSeverity = (status) => {
    const map = {
        'resolved': 'success',
        'closed': 'success',
        'cancelled': 'danger'
    };
    return map[status] || 'secondary';
};

const getMaintenanceTypeLabel = (type) => {
    return type === 'preventive' ? 'Preventivo' : 'Correctivo';
};

const getMaintenanceTypeSeverity = (type) => {
    return type === 'preventive' ? 'info' : 'warn';
};

const getPriorityLabel = (priority) => {
    const map = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'urgent': 'Urgente'
    };
    return map[priority] || priority;
};

const getPrioritySeverity = (priority) => {
    const map = {
        'low': 'success',
        'medium': 'info',
        'high': 'warning',
        'urgent': 'danger'
    };
    return map[priority] || 'info';
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
                    <h5 class="m-0 text-xl font-semibold">Historial de Trabajos</h5>
                    
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
                    <div class="col-span-12 md:col-span-6">
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
                    <div class="col-span-12 md:col-span-6">
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
                                    'bg-green-500': slotProps.item.status === 'resolved' || slotProps.item.status === 'closed',
                                    'bg-red-500': slotProps.item.status === 'cancelled'
                                }">
                                <i :class="{
                                    'pi pi-check': slotProps.item.status === 'resolved' || slotProps.item.status === 'closed',
                                    'pi pi-times': slotProps.item.status === 'cancelled'
                                }"></i>
                            </span>
                        </template>
                        <template #content="slotProps">
                            <Card class="mb-4 shadow-2 cursor-pointer hover:shadow-4 transition-duration-200" @click="viewTicket(slotProps.item)">
                                <template #title>
                                    <div class="flex justify-between items-start">
                                        <span class="text-lg font-bold">{{ slotProps.item.ticket_number }}</span>
                                        <Tag :value="getStatusLabel(slotProps.item.status)" :severity="getStatusSeverity(slotProps.item.status)" />
                                    </div>
                                </template>
                                <template #subtitle>
                                    <div class="flex flex-col gap-1 text-sm">
                                        <span class="text-primary font-medium">{{ formatDate(slotProps.item.created_at) }}</span>
                                        <span class="font-bold">{{ slotProps.item.title }}</span>
                                        <span v-if="slotProps.item.client" class="text-600">
                                            <i class="pi pi-building mr-1"></i> {{ slotProps.item.client.company_name }}
                                        </span>
                                    </div>
                                </template>
                                <template #content>
                                    <p class="m-0 text-700 line-height-3 text-sm">
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
                        <Column field="ticket_number" header="Ticket" sortable></Column>
                        <Column field="created_at" header="Fecha" sortable>
                            <template #body="slotProps">
                                {{ formatDate(slotProps.data.created_at) }}
                            </template>
                        </Column>
                        <Column field="title" header="Asunto" sortable></Column>
                        <Column header="Cliente" sortable field="client.company_name">
                            <template #body="slotProps">
                                {{ slotProps.data.client?.company_name || 'N/A' }}
                            </template>
                        </Column>
                        <Column field="status" header="Estado" sortable>
                            <template #body="slotProps">
                                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                        <Column header="Acciones">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" text rounded severity="info" v-tooltip="'Ver Detalles'" @click="viewTicket(slotProps.data)" />
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

    <!-- Ticket Detail Dialog -->
    <Dialog v-model:visible="showTicketDialog" :header="selectedTicket.ticket_number" :modal="true" :style="{ width: '50vw' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
        <div v-if="selectedTicket" class="flex flex-col gap-4">
            
            <!-- Header Info -->
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold m-0">{{ selectedTicket.title }}</h3>
                    <span class="text-sm text-500">{{ formatDate(selectedTicket.created_at) }}</span>
                </div>
                <Tag :value="getStatusLabel(selectedTicket.status)" :severity="getStatusSeverity(selectedTicket.status)" size="large" />
            </div>

            <Divider />

            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
                <Tag 
                    :value="getMaintenanceTypeLabel(selectedTicket.maintenance_type)" 
                    icon="pi pi-wrench"
                    :severity="getMaintenanceTypeSeverity(selectedTicket.maintenance_type)"
                />
                <Tag 
                    :value="getPriorityLabel(selectedTicket.priority)" 
                    icon="pi pi-exclamation-circle"
                    :severity="getPrioritySeverity(selectedTicket.priority)"
                />
                <Chip v-if="selectedTicket.location_city" :label="selectedTicket.location_city" icon="pi pi-map-marker" />
            </div>

            <!-- Client Info -->
            <div class="flex align-items-center gap-3 p-3 surface-50 border-round" v-if="selectedTicket.client">
                <Avatar :label="selectedTicket.client.company_name[0]" shape="circle" size="large" />
                <div>
                    <div class="font-bold">{{ selectedTicket.client.company_name }}</div>
                    <div class="text-sm text-600">{{ selectedTicket.client.contact_person }}</div>
                </div>
            </div>

            <!-- Description -->
            <div>
                <label class="font-bold block mb-2">Descripción</label>
                <p class="m-0 line-height-3 text-700">{{ selectedTicket.description }}</p>
            </div>

            <!-- Location -->
            <div v-if="selectedTicket.branch">
                <label class="font-bold block mb-2">Ubicación</label>
                <div class="text-sm">
                    <div class="font-medium">{{ selectedTicket.branch.name }}</div>
                    <div class="text-600">{{ selectedTicket.branch.address }}, {{ selectedTicket.branch.city }}, {{ selectedTicket.branch.state }}</div>
                </div>
            </div>

            <!-- Evidence Gallery -->
            <div v-if="selectedTicket.attachments && selectedTicket.attachments.length > 0">
                <Divider />
                <label class="font-bold block mb-3">
                    <i class="pi pi-images mr-2"></i>Evidencias y Adjuntos
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div v-for="(att, index) in selectedTicket.attachments" :key="index" class="relative">
                        <Image :src="att.url" :alt="att.filename" preview imageClass="w-full border-round h-32 object-cover" />
                        <div class="text-xs text-center mt-1 text-600 truncate">{{ att.filename }}</div>
                    </div>
                </div>
            </div>
            <div v-else class="text-center p-4 surface-50 border-round text-500">
                No hay evidencias adjuntas
            </div>

        </div>
        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" text @click="showTicketDialog = false" />
        </template>
    </Dialog>
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
