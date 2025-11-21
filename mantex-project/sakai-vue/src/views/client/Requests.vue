<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Full width table at bottom -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Mis Solicitudes de Mantenimiento</div>
                    <Button icon="pi pi-plus" label="Nueva Solicitud" @click="showCreateDialog = true" />
                </div>
                <DataTable :value="myTickets" :rows="10" :paginator="true" responsiveLayout="scroll" :loading="loading">
                    <Column field="ticket_number" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.ticket_number || `REQ-${slotProps.data.id}` }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Solicitud" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-muted-color">{{ truncateText(slotProps.data.description, 60) }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="maintenance_type" header="Tipo" sortable>
                        <template #body="slotProps">
                            <Tag :value="getMaintenanceTypeLabel(slotProps.data.maintenance_type)" :severity="getMaintenanceTypeSeverity(slotProps.data.maintenance_type)" />
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

    <!-- Simple create dialog -->
    <Dialog v-model:visible="showCreateDialog" modal :style="{ width: '600px' }" header="Nueva Solicitud">
        <div class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label for="title">Título *</label>
                    <InputText id="title" v-model="newRequest.title" class="w-full" placeholder="Ej: Reparación de aire acondicionado" />
                </div>
                <div class="field">
                    <label for="description">Descripción *</label>
                    <Textarea id="description" v-model="newRequest.description" rows="4" class="w-full" placeholder="Describe el problema o mantenimiento requerido..." />
                </div>
                <div class="field">
                    <label for="maintenance_type">Tipo de Mantenimiento *</label>
                    <Dropdown id="maintenance_type" v-model="newRequest.maintenance_type" :options="maintenanceTypeOptions" option-label="label" option-value="value" placeholder="Selecciona el tipo" class="w-full" />
                </div>
                <div class="field">
                    <label for="priority">Prioridad *</label>
                    <Dropdown id="priority" v-model="newRequest.priority" :options="priorityOptions" option-label="label" option-value="value" placeholder="Selecciona la prioridad" class="w-full" />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeCreateDialog" />
            <Button label="Crear Solicitud" icon="pi pi-check" @click="createRequest" :loading="creating" />
        </template>
    </Dialog>

    <!-- Simple details dialog -->
    <Dialog v-model:visible="showDetailsDialog" modal :style="{ width: '600px' }" header="Detalles de la Solicitud">
        <div v-if="selectedTicket" class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label>Número:</label>
                    <p class="font-medium">{{ selectedTicket.ticket_number || `REQ-${selectedTicket.id}` }}</p>
                </div>
                <div class="field">
                    <label>Título:</label>
                    <p class="font-medium">{{ selectedTicket.title }}</p>
                </div>
                <div class="field">
                    <label>Descripción:</label>
                    <p>{{ selectedTicket.description }}</p>
                </div>
                <div class="field">
                    <label>Estado:</label>
                    <Tag :value="getStatusLabel(selectedTicket.status)" :severity="getStatusSeverity(selectedTicket.status)" class="mt-1" />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" text @click="showDetailsDialog = false" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { getLabel, getSeverity, formatDate } from '@/lib/constants.js';

const toast = useToast();
const { user } = useAuth();

// Reactive data
const myTickets = ref([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedTicket = ref(null);

// Form data for new request
const newRequest = ref({
    title: '',
    description: '',
    maintenance_type: '',
    priority: 'medium'
});

// Options
const maintenanceTypeOptions = [
    { label: 'Correctivo (Reparación)', value: 'corrective' },
    { label: 'Preventivo (Mantenimiento)', value: 'preventive' }
];

const priorityOptions = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
];

// Methods
const loadMyTickets = async () => {
    loading.value = true;
    try {
        console.log('🎫 Cargando tickets del usuario:', user.value?.id);

        // Buscar client_id del usuario actual
        const { data: clientProfile, error: clientError } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        let clientId = null;
        if (clientProfile) {
            clientId = clientProfile.id;
        } else {
            // Si no hay client_profile, buscar en la tabla clients por user_id
            const { data: clientData, error: clientDataError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (clientData) {
                clientId = clientData.id;
            }
        }

        // Cargar tickets del cliente
        let query = supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (clientId) {
            query = query.eq('client_id', clientId);
        } else {
            // Si no encuentra client_id, usar user_id directamente como backup
            query = query.eq('created_by', user.value.id);
        }

        const { data: tickets, error: ticketsError } = await query;

        if (ticketsError) {
            console.error('❌ Error cargando tickets:', ticketsError);
            throw ticketsError;
        }

        myTickets.value = tickets || [];
        console.log(`✅ Cargados ${myTickets.value.length} tickets`);

    } catch (error) {
        console.error('💥 Error loading tickets:', error);

        // En caso de error, mostrar datos mock como fallback
        const mockTickets = [
            {
                id: 'mock-1',
                ticket_number: 'REQ-001',
                title: 'Reparación de aire acondicionado',
                description: 'El sistema de climatización del edificio principal no está funcionando correctamente',
                status: 'pending',
                priority: 'high',
                maintenance_type: 'corrective',
                created_at: '2024-11-15T10:00:00Z'
            }
        ];
        myTickets.value = mockTickets;

        toast.add({
            severity: 'warn',
            summary: 'Modo Demo',
            detail: 'Mostrando datos de demostración. Verifica la conexión a la base de datos.',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const createRequest = async () => {
    if (!validateForm()) return;

    creating.value = true;
    try {
        console.log('📝 Creando nueva solicitud:', newRequest.value);

        // Buscar client_id del usuario actual
        const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        let clientId = null;
        if (clientProfile) {
            clientId = clientProfile.id;
        } else {
            // Si no hay client_profile, buscar en clients
            const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (clientData) {
                clientId = clientData.id;
            }
        }

        // Generar número de ticket único
        const ticketNumber = `REQ-${Date.now().toString().slice(-6)}`;

        // Crear el ticket en la base de datos
        const ticketData = {
            ticket_number: ticketNumber,
            title: newRequest.value.title,
            description: newRequest.value.description,
            maintenance_type: newRequest.value.maintenance_type,
            priority: newRequest.value.priority,
            status: 'pending',
            category: 'general', // Categoría por defecto
            location_address: 'Por definir', // Se puede mejorar después
            location_city: 'Por definir',
            location_state: 'Por definir',
            client_id: clientId,
            created_by: user.value.id, // Backup para identificar el creador
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: newTicket, error } = await supabase
            .from('tickets')
            .insert([ticketData])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creando ticket:', error);
            throw error;
        }

        console.log('✅ Ticket creado:', newTicket);

        // Agregar el nuevo ticket a la lista local
        myTickets.value.unshift(newTicket);

        toast.add({
            severity: 'success',
            summary: 'Solicitud Creada',
            detail: `Tu solicitud ${ticketNumber} ha sido enviada exitosamente`,
            life: 4000
        });

        closeCreateDialog();

        // Recargar tickets para asegurar sincronización
        await loadMyTickets();

    } catch (error) {
        console.error('💥 Error creating request:', error);

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear la solicitud. Inténtalo de nuevo.',
            life: 4000
        });
    } finally {
        creating.value = false;
    }
};

const validateForm = () => {
    const required = ['title', 'description', 'maintenance_type'];

    for (const field of required) {
        if (!newRequest.value[field] || newRequest.value[field].trim() === '') {
            toast.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: `El campo es obligatorio`,
                life: 3000
            });
            return false;
        }
    }
    return true;
};

const closeCreateDialog = () => {
    showCreateDialog.value = false;
    newRequest.value = {
        title: '',
        description: '',
        maintenance_type: '',
        priority: 'medium'
    };
};

const viewTicket = (ticket) => {
    selectedTicket.value = ticket;
    showDetailsDialog.value = true;
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

const getMaintenanceTypeLabel = (type) => {
    return type === 'preventive' ? 'Preventivo' : 'Correctivo';
};

const getMaintenanceTypeSeverity = (type) => {
    return type === 'preventive' ? 'info' : 'warn';
};

const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

onMounted(() => {
    loadMyTickets();
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