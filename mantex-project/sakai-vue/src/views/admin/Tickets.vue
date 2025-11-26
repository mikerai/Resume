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
                <DataTable 
                    :value="tickets" 
                    :rows="10" 
                    :paginator="true" 
                    responsiveLayout="scroll"
                    :filters="filters"
                    :loading="loading"
                    :globalFilterFields="['ticket_number', 'title', 'client.company_name', 'supplier.company_name', 'status']"
                >
                    <template #header>
                        <div class="flex justify-content-end">
                            <IconField iconPosition="left">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                            </IconField>
                        </div>
                    </template>
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
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { FilterMatchMode } from '@primevue/core/api';

const toast = useToast();
const router = useRouter();

// Reactive data
const tickets = ref([]);
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

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
        if (['pending', 'opened'].includes(ticket.status)) stats.pending++;
        if (['in_progress', 'assigned'].includes(ticket.status)) stats.in_progress++;
        if (['completed', 'paid', 'closed'].includes(ticket.status)) stats.completed++;

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
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                client:client_id(id, company_name, contact_person, full_address),
                supplier:supplier_id(id, company_name, contact_person),
                branch:branch_id(id, name, full_address)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        tickets.value = data || [];
    } catch (error) {
        console.error('Error loading tickets:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tickets', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const createTicket = () => {
    // Future: Navigate to create page or open dialog
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'Funcionalidad de creación en desarrollo',
        life: 3000
    });
};

const viewTicket = (ticket) => {
    router.push(`/admin/tickets/${ticket.id}`);
};

// Utility functions
const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        opened: 'Abierto',
        assigned: 'Asignado',
        in_progress: 'En Proceso',
        completed: 'Completado',
        cancelled: 'Cancelado',
        closed: 'Cerrado',
        paid: 'Pagado'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        opened: 'info',
        assigned: 'info',
        in_progress: 'warn', // Orange/Yellow
        completed: 'success',
        cancelled: 'danger',
        closed: 'secondary',
        paid: 'success'
    };
    return severities[status] || 'info';
};

const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
};

const getPrioritySeverity = (priority) => {
    const severities = {
        low: 'success',
        medium: 'info',
        high: 'warning',
        urgent: 'danger'
    };
    return severities[priority] || 'info';
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
    loadTickets();
});
</script>