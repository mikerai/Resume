<template>
    <div class="grid-cols-12">
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
                                <div class="text-sm text-muted-color">{{ truncateText(slotProps.data.description, 60) }}
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column field="maintenance_type" header="Tipo" sortable>
                        <template #body="slotProps">
                            <Tag :value="getMaintenanceTypeLabel(slotProps.data.maintenance_type)"
                                :severity="getMaintenanceTypeSeverity(slotProps.data.maintenance_type)" />
                        </template>
                    </Column>
                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag :value="getPriorityLabel(slotProps.data.priority)"
                                :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)"
                                :severity="getStatusSeverity(slotProps.data.status)" />
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
                                <Button icon="pi pi-eye" severity="info" text rounded
                                    @click="viewTicketDetails(slotProps.data)" v-tooltip.top="'Ver detalles'" />
                                <Button icon="pi pi-pencil" severity="success" text rounded
                                    @click="router.push(`/client/requests/${slotProps.data.id}`)"
                                    v-tooltip.top="'Editar'"
                                    :disabled="['completed', 'cancelled', 'closed'].includes(slotProps.data.status)" />
                                <Button icon="pi pi-ban" severity="danger" text rounded
                                    @click="cancelTicketQuick(slotProps.data)" v-tooltip.top="'Cancelar'"
                                    :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(slotProps.data.status)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Simple create dialog -->
    <Dialog v-model:visible="showCreateDialog" modal :style="{ width: '700px' }" header="Nueva Solicitud">
        <div class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label for="title">Título *</label>
                    <InputText id="title" v-model="newRequest.title" class="w-full"
                        placeholder="Ej: Reparación de aire acondicionado" />
                </div>
                <div class="field">
                    <label for="description">Descripción *</label>
                    <Textarea id="description" v-model="newRequest.description" rows="4" class="w-full"
                        placeholder="Describe el problema o mantenimiento requerido..." />
                </div>
                <div class="field">
                    <label for="maintenance_type">Tipo de Mantenimiento *</label>
                    <Dropdown id="maintenance_type" v-model="newRequest.maintenance_type"
                        :options="maintenanceTypeOptions" option-label="label" option-value="value"
                        placeholder="Selecciona el tipo" class="w-full" />
                </div>
                <div class="field">
                    <label for="category">Categoría *</label>
                    <Dropdown id="category" v-model="newRequest.category" :options="categoryOptions"
                        option-label="label" option-value="value" placeholder="Selecciona la categoría"
                        class="w-full" />
                </div>

                <!-- Branch Selector -->
                <div class="field" v-if="branches.length > 0">
                    <label for="branch">Ubicación</label>
                    <Dropdown id="branch" v-model="newRequest.branch_id" :options="branches" optionLabel="name"
                        optionValue="id" placeholder="Selecciona la sucursal" class="w-full" :showClear="true">
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex align-items-center gap-2">
                                <i
                                    :class="branches.find(b => b.id === slotProps.value)?.is_headquarters ? 'pi pi-building' : 'pi pi-map-marker'"></i>
                                <span>{{getBranchDisplayName(branches.find(b => b.id === slotProps.value))}}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                        <template #option="slotProps">
                            <div class="flex align-items-center gap-2">
                                <i
                                    :class="slotProps.option.is_headquarters ? 'pi pi-building' : 'pi pi-map-marker'"></i>
                                <div>
                                    <div class="font-medium">{{ slotProps.option.name }}</div>
                                    <div class="text-xs text-500">
                                        {{ slotProps.option.municipality_city }}, {{ slotProps.option.state }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Dropdown>
                    <small class="text-500">Selecciona la ubicación donde se requiere el servicio</small>
                </div>

                <!-- Asset Selector (conditional) -->
                <div class="field" v-if="newRequest.branch_id && branchAssets.length > 0">
                    <label for="asset">Equipo/Activo (Opcional)</label>
                    <Dropdown id="asset" v-model="newRequest.asset_id" :options="branchAssets" optionLabel="name"
                        optionValue="id" placeholder="Selecciona el equipo" class="w-full" :showClear="true" filter>
                        <template #option="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.option.name }}</div>
                                <div class="text-xs text-500">{{ slotProps.option.category }}</div>
                            </div>
                        </template>
                    </Dropdown>
                    <small class="text-500">Si el problema es con un equipo específico, selecciónalo</small>
                </div>

                <div class="field">
                    <label for="supplier">Proveedor (Opcional)</label>
                    <Dropdown id="supplier" v-model="newRequest.supplier_id" :options="suppliers"
                        option-label="company_name" option-value="id" placeholder="Selecciona un proveedor (opcional)"
                        class="w-full" :showClear="true" filter />
                </div>
                <div class="field">
                    <label for="priority">Prioridad *</label>
                    <Dropdown id="priority" v-model="newRequest.priority" :options="priorityOptions"
                        option-label="label" option-value="value" placeholder="Selecciona la prioridad"
                        class="w-full" />
                </div>

                <!-- Photo Upload -->
                <div class="field">
                    <label>Fotos del Problema (Opcional)</label>
                    <FileUpload mode="basic" name="photos[]" accept="image/*" :maxFileSize="5000000" :multiple="true"
                        :auto="false" chooseLabel="Seleccionar Fotos" @select="onPhotosSelect" />
                    <div v-if="selectedPhotos.length > 0" class="mt-2">
                        <div class="grid">
                            <div v-for="(photo, index) in selectedPhotos" :key="index"
                                class="col-6 md:col-4 lg:col-3 p-2">
                                <div class="border-round overflow-hidden relative" style="aspect-ratio: 1;">
                                    <img :src="photo.preview" class="w-full h-full" style="object-fit: cover;">
                                    <Button icon="pi pi-times"
                                        class="p-button-danger p-button-rounded p-button-sm absolute"
                                        style="top: 0.5rem; right: 0.5rem;" @click="removePhoto(index)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeCreateDialog" />
            <Button label="Crear Solicitud" icon="pi pi-check" @click="createRequest"
                :loading="creating || uploadingPhotos" />
        </template>
    </Dialog>

    <!-- Simple details dialog -->
    <Dialog v-model:visible="showDetailsDialog" modal :style="{ width: '90vw', maxWidth: '1200px' }"
        header="Detalles del Ticket">
        <div v-if="selectedTicket">
            <Splitter style="height: 600px">
                <!-- Panel 1: Mapa (30%) -->
                <SplitterPanel :size="30" :minSize="20">
                    <div class="h-full flex items-center justify-content-center">
                        <iframe v-if="selectedTicket.location_city && selectedTicket.location_state" width="100%"
                            height="100%" class="border-none" loading="lazy" :src="mapSrc"></iframe>
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
                                <h6 class="m-0 mb-3">
                                    <i class="pi pi-info-circle mr-2"></i>
                                    Detalles del Ticket
                                </h6>

                                <div class="flex align-items-center gap-2 mb-3" v-if="selectedTicket.supplier">
                                    <Avatar :label="selectedTicket.supplier.company_name[0]" shape="circle" />
                                    <div>
                                        <div class="font-semibold text-sm">{{ selectedTicket.supplier.company_name }}
                                        </div>
                                        <div class="text-xs text-500">{{ selectedTicket.supplier.contact_person }}</div>
                                    </div>
                                </div>

                                <p class="text-700 text-sm line-height-3 mb-3">{{ selectedTicket.description }}</p>

                                <!-- Indicadores (Status movido aquí) -->
                                <div class="flex flex-wrap gap-2">
                                    <Tag :value="getStatusLabel(selectedTicket.status)"
                                        :severity="getStatusSeverity(selectedTicket.status)" />
                                    <Tag :value="getMaintenanceTypeLabel(selectedTicket.maintenance_type)"
                                        icon="pi pi-wrench"
                                        :severity="getMaintenanceTypeSeverity(selectedTicket.maintenance_type)" />
                                    <Tag :value="getPriorityLabel(selectedTicket.priority)"
                                        icon="pi pi-exclamation-circle"
                                        :severity="getPrioritySeverity(selectedTicket.priority)" />
                                    <Chip v-if="selectedTicket.location_city" :label="selectedTicket.location_city"
                                        icon="pi pi-map-marker" />
                                </div>
                            </div>
                        </SplitterPanel>

                        <!-- Panel 3: Tabs (Imágenes, Cotización, Chat) (80%) -->
                        <SplitterPanel :size="80" :minSize="50">
                            <div class="card h-full">
                                <Tabs value="0" class="h-full">
                                    <TabList>
                                        <Tab value="0">
                                            <i class="pi pi-images mr-2"></i>
                                            Imágenes
                                        </Tab>
                                        <Tab value="1">
                                            <i class="pi pi-file-edit mr-2"></i>
                                            Cotización
                                        </Tab>
                                        <Tab value="2">
                                            <i class="pi pi-comments mr-2"></i>
                                            Chat
                                        </Tab>
                                    </TabList>
                                    <TabPanels class="h-full overflow-y-auto">
                                        <!-- Tab 1: Galería de Imágenes -->
                                        <TabPanel value="0">
                                            <div
                                                v-if="selectedTicket.attachments && selectedTicket.attachments.length > 0">
                                                <Galleria :value="selectedTicket.attachments"
                                                    :responsiveOptions="galleriaResponsiveOptions" :numVisible="5"
                                                    :circular="true" containerStyle="max-width: 100%">
                                                    <template #item="slotProps">
                                                        <img :src="slotProps.item.url"
                                                            :alt="slotProps.item.description || 'Imagen adjunta'"
                                                            style="width: 100%; display: block;" />
                                                    </template>
                                                    <template #thumbnail="slotProps">
                                                        <img :src="slotProps.item.url"
                                                            :alt="slotProps.item.description || 'Imagen adjunta'"
                                                            style="display: block;" />
                                                    </template>
                                                    <template #caption="slotProps">
                                                        <div class="text-center p-3">
                                                            <h4 class="mb-2">{{
                                                                getAttachmentTypeLabel(slotProps.item.type) }}</h4>
                                                            <p v-if="slotProps.item.description">{{
                                                                slotProps.item.description }}</p>
                                                        </div>
                                                    </template>
                                                </Galleria>
                                            </div>
                                            <div v-else
                                                class="flex flex-column align-items-center justify-content-center p-5 text-500">
                                                <i class="pi pi-images text-4xl mb-3"></i>
                                                <p>No hay imágenes adjuntas</p>
                                            </div>
                                        </TabPanel>

                                        <!-- Tab 2: Cotización -->
                                        <TabPanel value="1">
                                            <div class="p-3">
                                                <QuoteForm :ticketId="selectedTicket.id" />
                                            </div>
                                        </TabPanel>

                                        <!-- Tab 3: Chat -->
                                        <TabPanel value="2">
                                            <div class="flex-1">
                                                <TicketChat :ticketId="selectedTicket.id" />
                                            </div>
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </div>
                        </SplitterPanel>
                    </Splitter>
                </SplitterPanel>
            </Splitter>
        </div>

        <template #footer>
            <div class="flex justify-content-between w-full">
                <Button label="Cancelar Ticket" icon="pi pi-ban" severity="danger" outlined @click="cancelTicket"
                    :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(selectedTicket?.status)" />
                <div class="flex gap-2">
                    <Button label="Cerrar" icon="pi pi-times" text @click="showDetailsDialog = false" />
                    <Button label="Editar" icon="pi pi-pencil"
                        @click="router.push(`/client/requests/${selectedTicket?.id}`)"
                        :disabled="['completed', 'cancelled', 'closed'].includes(selectedTicket?.status)" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { useClientBranches } from '@/composables/useClientBranches';
import { useClientAssets } from '@/composables/useClientAssets';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Image from 'primevue/image';
import Divider from 'primevue/divider';
import Chip from 'primevue/chip';
import Avatar from 'primevue/avatar';
import TicketChat from '@/components/ticket/TicketChat.vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Galleria from 'primevue/galleria';
import QuoteForm from '@/components/quotes/QuoteForm.vue';
import { translateStatus, translatePriority, getPriorityColor, getStatusSeverity, formatDate, getMaintenanceTypeLabel, getMaintenanceTypeSeverity, getAttachmentTypeLabel } from '@/utils/status-utils.js';

const toast = useToast();
const router = useRouter();
const { user } = useAuth();
const { branches, fetchBranches, getBranchAddress, getBranchDisplayName } = useClientBranches();
const { fetchAssetsByBranch, getAssetDisplayName } = useClientAssets();

// Reactive data
const myTickets = ref([]);
const suppliers = ref([]);
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedTicket = ref(null);

const mapSrc = ref('');
const galleriaResponsiveOptions = ref([
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '960px', numVisible: 4 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
]);

// Form data for new request
const newRequest = ref({
    title: '',
    description: '',
    maintenance_type: 'corrective',
    category: '',
    priority: 'medium',
    supplier_id: null,
    branch_id: null,
    asset_id: null
});

// Branch and asset management
const branchAssets = ref([]);
const selectedPhotos = ref([]);
const uploadingPhotos = ref(false);

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
        console.log('Cargando tickets del usuario:', user.value?.id);

        // Buscar client_id del usuario actual en la tabla clients
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (clientError && clientError.code !== 'PGRST116') {
            console.error('Error buscando cliente:', clientError);
        }

        // Cargar tickets del cliente
        let query = supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (clientData) {
            query = query.eq('client_id', clientData.id);
        } else {
            // Si no encuentra client, usar created_by como backup
            query = query.eq('created_by', user.value.id);
        }

        const { data: tickets, error: ticketsError } = await query;

        if (ticketsError) {
            console.error('Error cargando tickets:', ticketsError);
            throw ticketsError;
        }

        myTickets.value = tickets || [];
        console.log(`Cargados ${myTickets.value.length} tickets`);

    } catch (error) {
        console.error('Error loading tickets:', error);
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
        console.log('Creating new request:', newRequest.value);

        const clientId = await getClientId();

        if (!clientId) {
            throw new Error('No se pudo obtener el ID del cliente');
        }

        // Get branch address if branch is selected
        let locationAddress = 'Por definir';
        let locationCity = 'Por definir';
        let locationState = 'Por definir';

        if (newRequest.value.branch_id) {
            const selectedBranch = branches.value.find(b => b.id === newRequest.value.branch_id);
            if (selectedBranch) {
                locationAddress = getBranchAddress(selectedBranch);
                locationCity = selectedBranch.municipality_city;
                locationState = selectedBranch.state;
            }
        }

        // Create ticket in database
        const ticketData = {
            title: newRequest.value.title,
            description: newRequest.value.description,
            maintenance_type: newRequest.value.maintenance_type,
            priority: newRequest.value.priority,
            status: 'pending',
            category: newRequest.value.category || 'general',
            supplier_id: newRequest.value.supplier_id || null,
            branch_id: newRequest.value.branch_id || null,
            asset_id: newRequest.value.asset_id || null,
            location_address: locationAddress,
            location_city: locationCity,
            location_state: locationState,
            client_id: clientId,
            created_by: user.value.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: newTicket, error } = await supabase
            .from('tickets')
            .insert([ticketData])
            .select()
            .single();

        if (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }

        console.log('Ticket created:', newTicket);

        // Upload photos if any selected
        if (selectedPhotos.value.length > 0) {
            const uploadedAttachments = await uploadPhotosToS3(newTicket.id);

            if (uploadedAttachments.length > 0) {
                // Update ticket with attachments
                const { error: updateError } = await supabase
                    .from('tickets')
                    .update({
                        attachments: uploadedAttachments,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', newTicket.id);

                if (updateError) {
                    console.error('Error updating ticket with attachments:', updateError);
                    toast.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'El ticket se creó pero hubo un error al guardar las imágenes',
                        life: 5000
                    });
                }
            }
        }

        // Add new ticket to local list
        myTickets.value.unshift(newTicket);

        toast.add({
            severity: 'success',
            summary: 'Solicitud Creada',
            detail: `Tu solicitud ${newTicket.ticket_number} ha sido enviada exitosamente`,
            life: 4000
        });

        closeCreateDialog();

        // Reload tickets to ensure synchronization
        await loadMyTickets();

    } catch (error) {
        console.error('Error creating request:', error);

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
                summary: 'Campo requerido',
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
        supplier_id: null,
        branch_id: null,
        asset_id: null
    };
    selectedPhotos.value = [];
    branchAssets.value = [];
};

import { useS3Upload } from '@/composables/useS3Upload';

const { getSignedUrl } = useS3Upload();

const viewTicketDetails = async (ticket) => {
    selectedTicket.value = ticket;
    showDetailsDialog.value = true;

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
    // Build Google Maps embed URL
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const query = encodeURIComponent(`${ticket.location_city}, ${ticket.location_state}`);
    mapSrc.value = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
    showDetailsDialog.value = true;
};

const cancelTicketQuick = async (ticket) => {
    if (!confirm(`¿Estás seguro de cancelar el ticket ${ticket.ticket_number}?`)) return;

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
    if (!confirm(`¿Estás seguro de cancelar el ticket ${selectedTicket.value.ticket_number}?`)) return;

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
// Utility functions using status-utils
const getStatusLabel = (status) => translateStatus(status);
const getPriorityLabel = (priority) => translatePriority(priority);
const getPrioritySeverity = (priority) => getPriorityColor(priority);

// getMaintenanceTypeLabel, getMaintenanceTypeSeverity, getAttachmentTypeLabel imported directly

const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Helper to get client_id from user
const getClientId = async () => {
    const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.value.id)
        .single();

    return clientData?.id || null;
};

// Load branches for branch selector
const loadBranches = async () => {
    const clientId = await getClientId();
    if (clientId) {
        await fetchBranches(clientId);
    }
};

// Watch for branch selection to load associated assets
watch(() => newRequest.value.branch_id, async (newBranchId) => {
    branchAssets.value = [];
    newRequest.value.asset_id = null;

    if (newBranchId) {
        branchAssets.value = await fetchAssetsByBranch(newBranchId);
    }
});

// Photo upload handler
const onPhotosSelect = (event) => {
    const files = event.files;
    selectedPhotos.value = [];

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedPhotos.value.push({
                file: file,
                preview: e.target.result,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    }
};

// Remove photo from selection
const removePhoto = (index) => {
    selectedPhotos.value.splice(index, 1);
};

// Upload photos to S3
// Upload photos to S3
const uploadPhotosToS3 = async (ticketId) => {
    if (selectedPhotos.value.length === 0) return [];

    uploadingPhotos.value = true;
    const uploadedAttachments = [];

    try {
        const username = user.value.email.split('@')[0];

        for (let photo of selectedPhotos.value) {
            const base64Data = photo.preview.split(',')[1];
            const timestamp = Date.now();
            const key = `users/${username}/evidence/${timestamp}_ticket_${ticketId}_${photo.name}`;

            const lambdaUrl = `${import.meta.env.VITE_AWS_LAMBDA_URL}/s3/upload`;
            const response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: 'mantex-documents-1763361307',
                    key: key,
                    body: base64Data,
                    contentType: photo.file.type,
                    metadata: {
                        username: username,
                        documentType: 'evidence',
                        ticketId: ticketId,
                        uploadTimestamp: new Date().toISOString()
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                uploadedAttachments.push({
                    url: result.fileUrl,
                    type: 'problem', // Photos uploaded during creation are problem descriptions
                    description: '', // Can be updated later
                    filename: photo.name,
                    createdAt: new Date().toISOString(),
                    key: result.key,
                    bucket: result.bucket
                });
            } else {
                console.error('Upload failed for photo:', photo.name, result);
            }
        }
    } catch (error) {
        console.error('Error uploading photos:', error);
    } finally {
        uploadingPhotos.value = false;
    }

    return uploadedAttachments;
};

onMounted(() => {
    loadMyTickets();
    loadSuppliers();
    loadBranches();
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