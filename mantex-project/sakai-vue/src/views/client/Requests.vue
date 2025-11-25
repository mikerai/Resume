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
                            <span class="font-medium text-primary">{{ slotProps.data.ticket_number }}</span>
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
                    <Column header="Acciones" :exportable="false" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-eye" 
                                    severity="info" 
                                    text 
                                    rounded 
                                    @click="viewTicket(slotProps.data)" 
                                    v-tooltip.top="'Ver detalles'"
                                />
                                <Button 
                                    icon="pi pi-pencil" 
                                    severity="success" 
                                    text 
                                    rounded 
                                    @click="router.push(`/client/requests/${slotProps.data.id}`)"
                                    v-tooltip.top="'Editar'"
                                    :disabled="['completed', 'cancelled', 'closed'].includes(slotProps.data.status)"
                                />
                                <Button 
                                    icon="pi pi-ban" 
                                    severity="danger" 
                                    text 
                                    rounded 
                                    @click="cancelTicketQuick(slotProps.data)"
                                    v-tooltip.top="'Cancelar'"
                                    :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(slotProps.data.status)"
                                />
                            </div>
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
                    <label for="category">Categoría *</label>
                    <Dropdown id="category" v-model="newRequest.category" :options="categoryOptions" option-label="label" option-value="value" placeholder="Selecciona la categoría" class="w-full" />
                </div>
                <div class="field">
                    <label for="supplier">Proveedor (Opcional)</label>
                    <Dropdown 
                        id="supplier" 
                        v-model="newRequest.supplier_id" 
                        :options="suppliers" 
                        option-label="company_name" 
                        option-value="id" 
                        placeholder="Selecciona un proveedor (opcional)" 
                        class="w-full" 
                        :showClear="true"
                        filter
                    />
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
    <Dialog 
        v-model:visible="showDetailsDialog" 
        modal 
        :style="{ width: '90vw', maxWidth: '1200px' }" 
        header="Detalles del Ticket"
    >
        <div v-if="selectedTicket">
            <Splitter style="height: 600px">
                <!-- Panel 1: Mapa (30%) -->
                <SplitterPanel :size="30" :minSize="20">
                    <div class="h-full flex items-center justify-content-center">
                        <iframe
                            v-if="selectedTicket.location_city && selectedTicket.location_state"
                            width="100%"
                            height="100%"
                            class="border-none"
                            loading="lazy"
                            :src="mapSrc"
                        ></iframe>
                        <div v-else class="flex flex-column align-items-center justify-content-center h-full text-500">
                            <i class="pi pi-map-marker text-4xl mb-2"></i>
                            <span>Sin ubicación</span>
                        </div>
                    </div>
                </SplitterPanel>

                <!-- Paneles Derecha (70%) -->
                <SplitterPanel :size="70">
                    <Splitter layout="vertical">
                        <!-- Panel 2: Detalles (20%) -->
                        <SplitterPanel :size="20" :minSize="15">
                            <div class="p-3 h-full overflow-y-auto">
                                <div class="flex align-items-center justify-content-between mb-3">
                                    <h6 class="m-0">
                                        <i class="pi pi-info-circle mr-2"></i>
                                        Detalles del Ticket
                                    </h6>
                                    <Tag :value="getStatusLabel(selectedTicket.status)" :severity="getStatusSeverity(selectedTicket.status)" />
                                </div>

                                <div class="flex flex-wrap gap-2 mb-3">
                                    <Chip :label="selectedTicket.maintenance_type === 'preventive' ? 'Preventivo' : 'Correctivo'" icon="pi pi-wrench" />
                                    <Chip :label="getPriorityLabel(selectedTicket.priority)" icon="pi pi-exclamation-circle" />
                                    <Chip v-if="selectedTicket.location_city" :label="selectedTicket.location_city" icon="pi pi-map-marker" />
                                </div>

                                <div class="flex align-items-center gap-2 mb-3" v-if="selectedTicket.supplier">
                                    <Avatar :label="selectedTicket.supplier.company_name[0]" shape="circle" />
                                    <div>
                                        <div class="font-semibold text-sm">{{ selectedTicket.supplier.company_name }}</div>
                                        <div class="text-xs text-500">{{ selectedTicket.supplier.contact_person }}</div>
                                    </div>
                                </div>

                                <p class="text-700 text-sm line-height-3 m-0">{{ selectedTicket.description }}</p>
                            </div>
                        </SplitterPanel>

                        <!-- Panel 3: Chat (80%) -->
                        <SplitterPanel :size="80" :minSize="50">
                            <div class="h-full flex flex-column">
                                <div class="p-3 surface-100 border-bottom-1 surface-border">
                                    <h6 class="m-0 flex align-items-center">
                                        <i class="pi pi-comments mr-2"></i>
                                        Chat
                                    </h6>
                                </div>
                                <div class="flex-1">
                                    <TicketChat :ticketId="selectedTicket.id" />
                                </div>
                            </div>
                        </SplitterPanel>
                    </Splitter>
                </SplitterPanel>
            </Splitter>
        </div>

        <template #footer>
            <div class="flex justify-content-between w-full">
                <Button 
                    label="Cancelar Ticket" 
                    icon="pi pi-ban" 
                    severity="danger" 
                    outlined
                    @click="cancelTicket"
                    :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(selectedTicket?.status)"
                />
                <div class="flex gap-2">
                    <Button label="Cerrar" icon="pi pi-times" text @click="showDetailsDialog = false" />
                    <Button 
                        label="Editar" 
                        icon="pi pi-pencil" 
                        @click="router.push(`/client/requests/${selectedTicket?.id}`)"
                        :disabled="['completed', 'cancelled', 'closed'].includes(selectedTicket?.status)"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Chip from 'primevue/chip';
import Avatar from 'primevue/avatar';
import TicketChat from '@/components/ticket/TicketChat.vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { getLabel, getSeverity, formatDate } from '@/lib/constants.js';

const toast = useToast();
const router = useRouter();
const { user } = useAuth();

// Reactive data
const myTickets = ref([]);
const suppliers = ref([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedTicket = ref(null);
const mapSrc = ref('');

// Form data for new request
const newRequest = ref({
    title: '',
    description: '',
    maintenance_type: 'corrective',
    category: '',
    priority: 'medium',
    supplier_id: null
});

// Options
const maintenanceTypeOptions = [
    { label: 'Correctivo (Reparación)', value: 'corrective' },
    { label: 'Preventivo (Mantenimiento)', value: 'preventive' }
];

const categoryOptions = [
    { label: 'Electricidad', value: 'electricidad' },
    { label: 'Plomería', value: 'plomeria' },
    { label: 'Climatización', value: 'climatizacion' },
    { label: 'Pintura', value: 'pintura' },
    { label: 'Otro', value: 'otro' }
];

const priorityOptions = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
    { label: 'Urgente', value: 'urgent' }
];

// Methods
const loadSuppliers = async () => {
    try {
        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('id, company_name, contact_person')
            .order('company_name');
        
        if (error) throw error;
        suppliers.value = data || [];
    } catch (e) {
        console.error('Error loading suppliers:', e);
    }
};

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
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los tickets',
            life: 3000
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

        // Crear el ticket en la base de datos
        const ticketData = {
            // ticket_number: Generated by DB trigger
            title: newRequest.value.title,
            description: newRequest.value.description,
            maintenance_type: newRequest.value.maintenance_type,
            priority: newRequest.value.priority,
            status: 'pending',
            category: newRequest.value.category || 'general',
            supplier_id: newRequest.value.supplier_id || null, // Asignación de proveedor
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
            detail: `Tu solicitud ${newTicket.ticket_number} ha sido enviada exitosamente`,
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
    const required = ['title', 'description', 'maintenance_type', 'category'];

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
        maintenance_type: 'corrective',
        category: '',
        priority: 'medium',
        supplier_id: null
    };
};

const viewTicket = (ticket) => {
    selectedTicket.value = ticket;
    // Build Google Maps embed URL
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const query = encodeURIComponent(`${ticket.location_city}, ${ticket.location_state}`);
    mapSrc.value = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
    showDetailsDialog.value = true;
};

const cancelTicketQuick = async (ticket) => {
    if (!confirm(`¿Está seguro de cancelar el ticket ${ticket.ticket_number}?`)) return;
    
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'cancelled' })
            .eq('id', ticket.id);
        
        if (error) throw error;
        
        // Refresh data
        await loadTickets();
        toast.add({ severity: 'success', summary: 'Ticket cancelado', detail: 'El ticket ha sido cancelado exitosamente', life: 3000 });
    } catch (error) {
        console.error('Error cancelling ticket:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar el ticket', life: 3000 });
    }
};

const cancelTicket = async () => {
    if (!selectedTicket.value) return;
    if (!confirm(`¿Está seguro de cancelar el ticket ${selectedTicket.value.ticket_number}?`)) return;
    
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'cancelled' })
            .eq('id', selectedTicket.value.id);
        
        if (error) throw error;
        
        // Refresh data
        await loadTickets();
        showDetailsDialog.value = false;
        selectedTicket.value = null;
        toast.add({ severity: 'success', summary: 'Ticket cancelado', detail: 'El ticket ha sido cancelado exitosamente', life: 3000 });
    } catch (error) {
        console.error('Error cancelling ticket:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar el ticket', life: 3000 });
    }
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
    loadSuppliers();
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