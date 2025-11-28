<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widgets -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Trabajos Completados</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ completedJobsCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check-circle text-green-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">{{ completedJobsCount }} </span>
                <span class="text-muted-color">pendientes de aprobación</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Valor Total</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ totalValue.toLocaleString() }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-blue-500 font-medium">Por aprobar </span>
                <span class="text-muted-color">este mes</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Tiempo Promedio</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">2.5 días</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-clock text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-orange-500 font-medium">-0.5 </span>
                <span class="text-muted-color">vs mes anterior</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Aprobaciones</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ approvedJobsCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-thumbs-up text-purple-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-purple-500 font-medium">{{ approvedJobsCount }} </span>
                <span class="text-muted-color">aprobadas este mes</span>
            </div>
        </div>

        <!-- Main Content Table -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Trabajos Pendientes de Aprobación</div>
                    <Button icon="pi pi-refresh" label="Actualizar" @click="loadJobs" :loading="loading" />
                </div>
                <DataTable :value="jobs" :rows="10" :paginator="true" responsiveLayout="scroll" :loading="loading">
                    <Column field="id" header="ID" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.id }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Trabajo" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.description?.substring(0, 50) }}...</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="supplier" header="Proveedor" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ slotProps.data.supplier || 'No asignado' }}</div>
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="completedAt" header="Fecha Completado" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.completedAt) }}</div>
                        </template>
                    </Column>
                    <Column field="cost" header="Costo" sortable>
                        <template #body="slotProps">
                            <div class="text-sm font-medium">${{ slotProps.data.cost?.toLocaleString() || '0' }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 10rem">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" severity="info" text rounded @click="viewJob(slotProps.data)" v-tooltip="'Ver detalles'" />
                            <Button
                                icon="pi pi-check"
                                severity="success"
                                text
                                rounded
                                @click="approveJob(slotProps.data)"
                                :disabled="slotProps.data.status === 'approved_for_payment'"
                                v-tooltip="'Aprobar trabajo'"
                            />
                            <Button icon="pi pi-times" severity="danger" text rounded @click="rejectJob(slotProps.data)" v-tooltip="'Rechazar trabajo'" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Job Details Dialog -->
    <Dialog v-model:visible="showDialog" modal :style="{ width: '700px' }" header="Detalles del Trabajo">
        <div v-if="selectedJob" class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label>ID del Trabajo:</label>
                    <p class="font-medium">{{ selectedJob.id }}</p>
                </div>
                <div class="field">
                    <label>Título:</label>
                    <p class="font-medium">{{ selectedJob.title }}</p>
                </div>
                <div class="field">
                    <label>Descripción:</label>
                    <p>{{ selectedJob.description }}</p>
                </div>
                <div class="field">
                    <label>Proveedor:</label>
                    <p>{{ selectedJob.supplier || 'No asignado' }}</p>
                </div>
                <div class="field">
                    <label>Estado:</label>
                    <Tag :value="getStatusLabel(selectedJob.status)" :severity="getStatusSeverity(selectedJob.status)" class="mt-1" />
                </div>
                <div class="field">
                    <label>Costo:</label>
                    <p class="font-medium text-lg">${{ selectedJob.cost?.toLocaleString() || '0' }}</p>
                </div>
                <div v-if="selectedJob.attachments && selectedJob.attachments.length > 0" class="field">
                    <label>Evidencias:</label>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(attachment, index) in selectedJob.attachments"
                             :key="index"
                             :src="attachment.url"
                             :alt="attachment.name"
                             class="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                             @click="openImagePreview(attachment)" />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between">
                <Button label="Cerrar" icon="pi pi-times" text @click="showDialog = false" />
                <div class="flex gap-2">
                    <Button
                        label="Rechazar"
                        icon="pi pi-times"
                        severity="danger"
                        @click="rejectJob(selectedJob)"
                    />
                    <Button
                        label="Aprobar"
                        icon="pi pi-check"
                        @click="approveJob(selectedJob)"
                        :loading="approving"
                        :disabled="selectedJob.status === 'approved_for_payment'"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { translateStatus, getStatusSeverity as getStatusSev } from '@/utils/status-utils.js';

const toast = useToast();
const { user } = useAuth();

// Reactive data
const jobs = ref([]);
const selectedJob = ref(null);
const showDialog = ref(false);
const loading = ref(false);
const approving = ref(false);
const stats = ref({
    approvedCountMonth: 0,
    avgTimeMonth: 0
});

// Computed stats
const completedJobsCount = computed(() => jobs.value.length);

// Total value of pending approvals for the current month
const totalValue = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return jobs.value
        .filter(job => {
            if (!job.completedAt) return false;
            const jobDate = new Date(job.completedAt);
            return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        })
        .reduce((sum, job) => sum + (job.cost || 0), 0);
});

const approvedJobsCount = computed(() => stats.value.approvedCountMonth);

// Methods
const getClientId = async () => {
    const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.value.id)
        .single();

    if (clientProfile) return clientProfile.id;

    const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.value.id)
        .single();

    return clientData?.id || null;
};

const loadStats = async (clientId) => {
    if (!clientId) return;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    try {
        // Get approved count for this month
        const { count, error } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'approved_for_payment')
            .gte('approved_at', firstDayOfMonth)
            .lte('approved_at', lastDayOfMonth);

        if (error) throw error;
        stats.value.approvedCountMonth = count || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
};

const loadJobs = async () => {
    loading.value = true;
    try {
        const clientId = await getClientId();

        if (!clientId) {
            console.warn('No client_id found');
            jobs.value = [];
            return;
        }

        // Load stats
        loadStats(clientId);

        // Load tickets that are completed but not yet ready for payment (pre-approval)
        const { data: ticketsData, error } = await supabase
            .from('tickets')
            .select(`
                id,
                ticket_number,
                title,
                description,
                status,
                completed_at,
                total_cost,
                supplier:supplier_id(company_name)
            `)
            .eq('client_id', clientId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });
        
        if (error) throw error;

        jobs.value = (ticketsData || []).map(t => ({
            id: t.ticket_number || t.id,
            title: t.title,
            description: t.description,
            supplier: t.supplier?.company_name || 'No asignado',
            status: t.status,
            completedAt: t.completed_at,
            cost: t.total_cost || 0,
            attachments: [] // TODO: Load from storage
        }));

        console.log('✅ Cargados', jobs.value.length, 'trabajos pendientes de aprobación');
    } catch (error) {
        console.error('Error loading jobs:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los trabajos',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const viewJob = (job) => {
    selectedJob.value = job;
    showDialog.value = true;
};

const approveJob = async (job) => {
    approving.value = true;
    try {
        // Update ticket status to approved_for_payment
        const { error } = await supabase
            .from('tickets')
            .update({ 
                status: 'approved_for_payment',
                approved_at: new Date().toISOString()
            })
            .eq('ticket_number', job.id);

        if (error) throw error;

        // Remove from list
        jobs.value = jobs.value.filter(j => j.id !== job.id);
        
        // Update stats
        stats.value.approvedCountMonth++;

        toast.add({
            severity: 'success',
            summary: 'Trabajo Aprobado',
            detail: `El trabajo ${job.id} ha sido aprobado para pago`,
            life: 3000
        });

        showDialog.value = false;
    } catch (error) {
        console.error('Error approving job:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al aprobar el trabajo',
            life: 3000
        });
    } finally {
        approving.value = false;
    }
};

const rejectJob = async (job) => {
    try {
        // Update ticket status to rejected
        const { error } = await supabase
            .from('tickets')
            .update({ 
                status: 'rejected',
                rejected_at: new Date().toISOString()
            })
            .eq('ticket_number', job.id);

        if (error) throw error;

        toast.add({
            severity: 'warn',
            summary: 'Trabajo Rechazado',
            detail: `El trabajo ${job.id} ha sido rechazado`,
            life: 3000
        });

        // Remove from pending list
        jobs.value = jobs.value.filter(j => j.id !== job.id);
        showDialog.value = false;
    } catch (error) {
        console.error('Error rejecting job:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al rechazar el trabajo',
            life: 3000
        });
    }
};

const openImagePreview = (attachment) => {
    // Mock image preview functionality
    window.open(attachment.url, '_blank');
};

// Utility functions
const getStatusLabel = translateStatus;
const getStatusSeverity = getStatusSev;

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

onMounted(() => {
    loadJobs();
});
</script>

<style scoped>
.field {
    margin-bottom: 1rem;
}

.field label {
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    color: var(--text-color-secondary);
}
</style>