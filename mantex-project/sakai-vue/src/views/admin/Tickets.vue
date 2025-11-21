<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget - Exact Sakai StatsWidget structure -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Tickets Pendientes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ ticketStats.pending }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-clock text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">En Progreso</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ ticketStats.in_progress }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-play text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Completados</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ ticketStats.completed }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check text-green-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Este Mes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ ticketStats.total_month }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-calendar text-purple-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full width table at bottom -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Gestión de Tickets</div>
                    <Button icon="pi pi-plus" label="Crear Ticket" @click="createTicket" />
                </div>
                <DataTable :value="tickets" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column field="ticket_number" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.ticket_number }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Título" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.description?.substring(0, 60) }}...</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="client" header="Cliente" sortable>
                        <template #body="slotProps">
                            <div class="font-medium" v-if="slotProps.data.client">{{ slotProps.data.client.company_name }}</div>
                        </template>
                    </Column>
                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag :value="getPriorityLabel(slotProps.data.priority)" :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="created_at" header="Fecha" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.created_at) }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" severity="info" text rounded @click="viewTicket(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { LABELS, getSeverity, getLabel, formatDate } from '@/lib/constants.js';

const toast = useToast();

// Reactive data
const tickets = ref([]);
const loading = ref(false);

// Computed
const ticketStats = computed(() => {
    const stats = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        total_month: 0
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    tickets.value.forEach(ticket => {
        if (ticket.status === 'pending') stats.pending++;
        if (ticket.status === 'in_progress') stats.in_progress++;
        if (ticket.status === 'completed') stats.completed++;

        const ticketDate = new Date(ticket.created_at);
        if (ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear) {
            stats.total_month++;
        }
    });

    return stats;
});

// Methods
const loadTickets = async () => {
    loading.value = true;
    try {
        // Mock data for demonstration
        const mockTickets = [
            {
                id: 1,
                ticket_number: 'TKT-2024-001',
                title: 'Mantenimiento de aire acondicionado',
                description: 'Revisión y limpieza del sistema de climatización del edificio principal',
                status: 'pending',
                priority: 'high',
                client: { company_name: 'Empresa ABC' },
                created_at: '2024-11-15T10:00:00Z'
            },
            {
                id: 2,
                ticket_number: 'TKT-2024-002',
                title: 'Reparación de elevador',
                description: 'Falla en el motor del elevador principal, requiere atención inmediata',
                status: 'in_progress',
                priority: 'urgent',
                client: { company_name: 'Corporativo XYZ' },
                created_at: '2024-11-14T14:30:00Z'
            },
            {
                id: 3,
                ticket_number: 'TKT-2024-003',
                title: 'Limpieza profunda oficinas',
                description: 'Limpieza completa de todas las oficinas del piso 5',
                status: 'completed',
                priority: 'low',
                client: { company_name: 'StartUp 123' },
                created_at: '2024-11-13T09:15:00Z'
            }
        ];
        tickets.value = mockTickets;
    } catch (error) {
        console.error('Error loading tickets:', error);
    } finally {
        loading.value = false;
    }
};

const createTicket = () => {
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'Funcionalidad de creación en desarrollo',
        life: 3000
    });
};

const viewTicket = (ticket) => {
    toast.add({
        severity: 'info',
        summary: 'Ver Ticket',
        detail: `Viendo detalles de ${ticket.ticket_number}`,
        life: 3000
    });
};

// Utility functions using constants
const getStatusLabel = (status) => {
    return getLabel('ticketStatus', status);
};

const getStatusSeverity = (status) => {
    return getSeverity('ticketStatus', status);
};

const getPriorityLabel = (priority) => {
    return getLabel('priority', priority);
};

const getPrioritySeverity = (priority) => {
    return getSeverity('priority', priority);
};

onMounted(() => {
    loadTickets();
});
</script>