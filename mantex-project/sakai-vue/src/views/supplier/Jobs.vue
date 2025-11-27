<template>
    <div class="grid">
        <!-- Mensaje para suppliers no aprobados -->
        <div class="col-12" v-if="!isSupplierApproved">
            <Message severity="warn" :closable="false">
                <div class="flex align-items-center">
                    <i class="pi pi-clock mr-2"></i>
                    <div>
                        <strong>Cuenta en revisión</strong><br>
                        Su cuenta está siendo revisada por nuestro equipo. Una vez aprobada, tendrá acceso completo a todos los tickets con información detallada y precios.
                    </div>
                </div>
            </Message>
        </div>

        <div class="col-12">
            <div class="card">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">{{ isSupplierApproved ? 'Mis Trabajos' : 'Tickets Disponibles (Vista Limitada)' }}</h5>
                    <div class="flex align-items-center gap-2">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <InputText
                                v-model="searchTerm"
                                placeholder="Buscar tickets..."
                                class="w-full md:w-20rem"
                            />
                        </span>
                        <Dropdown
                            v-model="selectedStatus"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Filtrar por estado"
                            class="w-full md:w-12rem"
                        />
                    </div>
                </div>

                <DataTable
                    :value="filteredTickets"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    responsiveLayout="scroll"
                    :rowHover="true"
                    dataKey="id"
                >
                    <Column field="ticket_number" header="Ticket" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.ticket_number }}</div>
                        </template>
                    </Column>

                    <Column field="title" header="Título" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-500 mt-1">{{ truncateText(slotProps.data.description, 60) }}</div>
                            </div>
                        </template>
                    </Column>

                    <Column field="maintenance_type" header="Tipo" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="getMaintenanceTypeLabel(slotProps.data.maintenance_type)"
                                :severity="getMaintenanceTypeSeverity(slotProps.data.maintenance_type)"
                            />
                        </template>
                    </Column>

                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="getPriorityLabel(slotProps.data.priority)"
                                :severity="getPrioritySeverity(slotProps.data.priority)"
                            />
                        </template>
                    </Column>

                    <Column field="location" header="Ubicación">
                        <template #body="slotProps">
                            <div class="text-sm">
                                <i class="pi pi-map-marker mr-1"></i>
                                {{ slotProps.data.location_city }}, {{ slotProps.data.location_state }}
                            </div>
                        </template>
                    </Column>

                    <Column field="scheduled_date" header="Fecha Programada" sortable>
                        <template #body="slotProps">
                            <div v-if="slotProps.data.scheduled_date" class="text-sm">
                                {{ formatDate(slotProps.data.scheduled_date) }}
                            </div>
                            <span v-else class="text-500">-</span>
                        </template>
                    </Column>

                    <!-- Solo mostrar precios si el supplier está aprobado -->
                    <Column v-if="isSupplierApproved" field="estimated_cost" header="Precio Est." sortable>
                        <template #body="slotProps">
                            <div v-if="slotProps.data.estimated_cost" class="font-medium text-green-600">
                                ${{ formatCurrency(slotProps.data.estimated_cost) }}
                            </div>
                            <span v-else class="text-500">-</span>
                        </template>
                    </Column>

                    <!-- Información limitada de cliente para suppliers no aprobados -->
                    <Column v-if="!isSupplierApproved" header="Cliente">
                        <template #body="slotProps">
                            <span class="text-500">Información oculta</span>
                        </template>
                    </Column>

                    <!-- Información completa de cliente para suppliers aprobados -->
                    <Column v-if="isSupplierApproved" field="client" header="Cliente">
                        <template #body="slotProps">
                            <div v-if="slotProps.data.client">
                                <div class="font-medium">{{ slotProps.data.client.company_name }}</div>
                                <div class="text-sm text-500">{{ slotProps.data.client.contact_person }}</div>
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="getStatusLabel(slotProps.data.status)"
                                :severity="getStatusSeverity(slotProps.data.status)"
                            />
                        </template>
                    </Column>

                    <Column header="Acciones" class="text-center" style="width: 200px">
                        <template #body="slotProps">
                            <div class="flex gap-1 justify-content-center">
                                <Button
                                    icon="pi pi-eye"
                                    class="p-button-rounded p-button-text p-button-sm"
                                    @click="viewTicket(slotProps.data)"
                                    v-tooltip="'Ver detalles'"
                                />
                                <Button
                                    v-if="isSupplierApproved && canAcceptTicket(slotProps.data)"
                                    icon="pi pi-check"
                                    class="p-button-rounded p-button-success p-button-sm"
                                    @click="acceptTicket(slotProps.data)"
                                    v-tooltip="'Aceptar trabajo'"
                                />
                                <Button
                                    v-if="isSupplierApproved && canRejectTicket(slotProps.data)"
                                    icon="pi pi-times"
                                    class="p-button-rounded p-button-danger p-button-sm"
                                    @click="rejectTicket(slotProps.data)"
                                    v-tooltip="'Rechazar trabajo'"
                                />
                                <Button
                                    v-if="isSupplierApproved && slotProps.data.status === 'opened' && slotProps.data.supplier_id === currentSupplierId"
                                    icon="pi pi-play"
                                    class="p-button-rounded p-button-info p-button-sm"
                                    @click="startWork(slotProps.data)"
                                    v-tooltip="'Iniciar trabajo'"
                                />
                                <Button
                                    v-if="isSupplierApproved && slotProps.data.status === 'in_progress' && slotProps.data.supplier_id === currentSupplierId"
                                    icon="pi pi-upload"
                                    class="p-button-rounded p-button-warning p-button-sm"
                                    @click="uploadEvidence(slotProps.data)"
                                    v-tooltip="'Subir evidencias'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Dialog para ver detalles del ticket -->
    <Dialog v-model:visible="showTicketDialog" modal :style="{ width: '90vw', maxWidth: '1200px' }" header="Detalles del Ticket">
        <div v-if="selectedTicket">
            <Splitter style="height: 600px">
                <!-- Panel 1: Mapa (30%) -->
                <SplitterPanel :size="30" :minSize="20">
                    <div class="h-full flex items-center justify-content-center">
                        <iframe
                            v-if="selectedTicket.location_address"
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
                                    <Tag :value="getStatusLabel(selectedTicket.status)" :severity="selectedTicket.status === 'revision_requested' ? 'warning' : getStatusSeverity(selectedTicket.status)" />
                                </div>

                                <!-- Revision Comments Alert -->
                                <Message v-if="selectedTicket.status === 'revision_requested' && selectedTicket.revision_comments" severity="warn" :closable="false" class="mb-3">
                                    <strong>Cambios solicitados:</strong>
                                    <p class="mt-2 mb-0">{{ selectedTicket.revision_comments }}</p>
                                </Message>

                                <div class="flex flex-wrap gap-2 mb-3">
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

                                <div class="flex align-items-center gap-2 mb-3" v-if="isSupplierApproved && selectedTicket.client">
                                    <Avatar :label="selectedTicket.client.company_name[0]" shape="circle" />
                                    <div>
                                        <div class="font-semibold text-sm">{{ selectedTicket.client.company_name }}</div>
                                        <div class="text-xs text-500">{{ selectedTicket.client.contact_person }}</div>
                                    </div>
                                </div>

                                <p class="text-700 text-sm line-height-3 m-0">{{ selectedTicket.description }}</p>

                                <!-- DEBUG: Log attachments -->
                                <div v-if="selectedTicket" style="display:none">
                                    {{ console.log('🖼️ Ticket attachments:', selectedTicket.attachments) }}
                                </div>

                                <!-- Galería de Imágenes Adjuntas -->
                                <div v-if="selectedTicket.attachments && selectedTicket.attachments.length > 0" class="mt-4">
                                    <Divider align="left">
                                        <span class="text-sm font-semibold">
                                            <i class="pi pi-images mr-2"></i>
                                            Imágenes Adjuntas ({{ selectedTicket.attachments.length }})
                                        </span>
                                    </Divider>
                                    
                                    <div class="grid">
                                        <div 
                                            v-for="(attachment, index) in selectedTicket.attachments" 
                                            :key="index"
                                            class="col-6 md:col-4"
                                        >
                                            <div class="border-1 surface-border border-round overflow-hidden hover:shadow-2 transition-all transition-duration-200 cursor-pointer">
                                                <Image 
                                                    :src="attachment.url" 
                                                    :alt="attachment.description || 'Imagen adjunta'"
                                                    preview
                                                    class="w-full"
                                                    imageClass="w-full h-8rem object-cover"
                                                />
                                                <div class="p-2 bg-surface-50">
                                                    <p class="text-xs text-600 m-0 line-height-2">
                                                        {{ getAttachmentTypeLabel(attachment.type) }}
                                                    </p>
                                                    <p v-if="attachment.description" class="text-xs text-500 m-0 mt-1 line-height-2">
                                                        {{ attachment.description }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                <div class="flex-1" v-if="isSupplierApproved">
                                    <TicketChat :ticketId="selectedTicket.id" />
                                </div>
                                <div v-else class="flex-1 flex align-items-center justify-content-center text-500">
                                    <i class="pi pi-lock mr-2"></i> Chat disponible al aprobarse
                                </div>
                            </div>
                        </SplitterPanel>
                    </Splitter>
                </SplitterPanel>
            </Splitter>
        </div>

        <template #footer>
            <div class="flex justify-content-between">
                <div class="flex gap-2">
                    <Button
                        v-if="isSupplierApproved && canAcceptTicket(selectedTicket)"
                        label="Aceptar Trabajo"
                        icon="pi pi-check"
                        class="p-button-success"
                        @click="acceptTicket(selectedTicket)"
                    />
                    <Button
                        v-if="isSupplierApproved && canRejectTicket(selectedTicket)"
                        label="Rechazar"
                        icon="pi pi-times"
                        class="p-button-danger"
                        @click="rejectTicket(selectedTicket)"
                    />
                    <Button
                        v-if="isSupplierApproved && selectedTicket.status === 'opened'"
                        label="Solicitar Revisión"
                        icon="pi pi-search"
                        class="p-button-info"
                        @click="requestReview(selectedTicket)"
                    />
                    <Button
                v-if="isSupplierApproved && selectedTicket.status === 'revision_requested'"
                label="Reabrir para Correcciones"
                icon="pi pi-refresh"
                class="p-button-warning"
                @click="sendCorrections(selectedTicket)"
            />

                </div>
                <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="showTicketDialog = false" />
            </div>
        </template>


            <!-- Botones de Acción -->




    </Dialog>

    <!-- Dialog para rechazar ticket -->
    <Dialog v-model:visible="showRejectDialog" modal :style="{ width: '450px' }" header="Rechazar Ticket">
        <div class="field">
            <label for="rejection-reason">Motivo del rechazo:</label>
            <Textarea
                id="rejection-reason"
                v-model="rejectionReason"
                rows="4"
                class="w-full"
                placeholder="Explica por qué no puedes realizar este trabajo..."
            />
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showRejectDialog = false" />
            <Button label="Confirmar Rechazo" icon="pi pi-check" class="p-button-danger" @click="confirmRejectTicket" />
        </template>
    </Dialog>

    <!-- Dialog para subir evidencias -->
    <Dialog
        v-model:visible="showEvidenceDialog"
        modal
        :style="{ width: '90vw', maxWidth: '1200px' }"
        header="Subir Evidencias del Trabajo"
        class="p-dialog-maximized"
    >
        <EvidenceUpload
            v-if="evidenceTicket"
            :ticket="evidenceTicket"
            @evidence-uploaded="onEvidenceUploaded"
            @status-changed="onTicketStatusChanged"
        />

        <template #footer>
            <Button
                label="Cerrar"
                icon="pi pi-times"
                class="p-button-text"
                @click="showEvidenceDialog = false"
            />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import EvidenceUpload from '@/components/ticket/EvidenceUpload.vue';
import TicketChat from '@/components/ticket/TicketChat.vue';
import { translateStatus, translatePriority, getPriorityColor, getStatusSeverity, formatDate } from '@/utils/status-utils.js';
import Image from 'primevue/image';
import Divider from 'primevue/divider';

const toast = useToast();
const { user, profile } = useAuth();

// Reactive data
const tickets = ref([]);
const suppliers = ref([]);
const loading = ref(false);
const searchTerm = ref('');
const selectedStatus = ref('all');
const showTicketDialog = ref(false);
const showRejectDialog = ref(false);
const selectedTicket = ref(null);
const rejectionReason = ref('');
const ticketToReject = ref(null);
const currentSupplier = ref(null);
const showEvidenceDialog = ref(false);
const evidenceTicket = ref(null);


// Computed properties
const isSupplierApproved = computed(() => {
    return currentSupplier.value?.status === 'approved';
});

const currentSupplierId = computed(() => {
    return currentSupplier.value?.id;
});

const filteredTickets = computed(() => {
    let filtered = tickets.value;

    // Filter by search term
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        filtered = filtered.filter(ticket =>
            ticket.ticket_number?.toLowerCase().includes(term) ||
            ticket.title?.toLowerCase().includes(term) ||
            ticket.description?.toLowerCase().includes(term) ||
            ticket.location_city?.toLowerCase().includes(term)
        );
    }

    // Filter by status
    if (selectedStatus.value !== 'all') {
        filtered = filtered.filter(ticket => ticket.status === selectedStatus.value);
    }

    return filtered;
});

const mapSrc = computed(() => {
  if (!selectedTicket.value) return '';
  const address = `${selectedTicket.value.location_address}, ${selectedTicket.value.location_city}, ${selectedTicket.value.location_state}`;
  return `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}`;
});

// Options
const statusOptions = ref([
    { label: 'Todos', value: 'all' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Abiertos', value: 'opened' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'Completados', value: 'completed' },
    { label: 'Aprobados', value: 'approved' }
]);

// Methods
const loadCurrentSupplier = async () => {
    try {
        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        currentSupplier.value = data;
    } catch (error) {
        console.error('Error loading supplier:', error);
    }
};

const loadTickets = async () => {
    loading.value = true;
    try {
        let query = supabase
            .from('tickets')
            .select(`
                *,
                client:clients(*),
                branch:client_branches(*),
                asset:client_assets(*),
                supplier:supplier_profiles(*)
            `)
            .order('created_at', { ascending: false });

        if (!isSupplierApproved.value) {
            query = supabase
                .from('tickets')
                .select(`
                    id, ticket_number, title, description, maintenance_type,
                    priority, location_city, location_state, location_address,
                    scheduled_date, status, created_at, category
                `)
                .in('status', ['pending', 'opened'])
                .order('created_at', { ascending: false });
        } else {
            query = query.or(`supplier_id.eq.${currentSupplierId.value},supplier_id.is.null,status.eq.pending,status.eq.opened`);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        console.log('📦 Raw tickets data from Supabase:', data);
        console.log('📦 First ticket attachments (JSONB):', data?.[0]?.attachments);
        
        // Attachments are already in JSONB format, no transformation needed
        tickets.value = data || [];
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

import { useSecureImage } from '@/composables/useSecureImage';

const { refreshAttachments } = useSecureImage();

const viewTicket = async (ticket) => {
  selectedTicket.value = ticket;
  showTicketDialog.value = true;
  
  // Refresh attachment URLs if needed
  if (ticket.attachments && ticket.attachments.length > 0) {
      const refreshedAttachments = await refreshAttachments(ticket.attachments);
      selectedTicket.value = { ...ticket, attachments: refreshedAttachments };
  }

  // TODO: Initialize chat for this ticket when Firebase chat is implemented
  // const { messages, isTyping, sendMessage, markAsRead, setTypingStatus } = useFirebaseChat(ticket.id);
  // chatData.value = { messages, isTyping, sendMessage, markAsRead, setTypingStatus };
};

const canAcceptTicket = (ticket) => {
    return ['pending', 'opened'].includes(ticket.status) &&
           (ticket.maintenance_type === 'corrective' || !ticket.supplier_id);
};

const canRejectTicket = (ticket) => {
    return ['pending', 'opened'].includes(ticket.status) &&
           (ticket.maintenance_type === 'corrective' || !ticket.supplier_id);
};

const acceptTicket = async (ticket) => {
  if (!isSupplierApproved.value) {
    toast.add({
      severity: 'warn',
      summary: 'Acceso Restringido',
      detail: 'Debe ser aprobado antes de aceptar trabajos',
      life: 3000
    });
    return;
  }

  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        supplier_id: currentSupplierId.value,
        status: 'opened',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id);

    if (error) throw error;

    // Create Google Calendar event if scheduled_date exists
    if (ticket.scheduled_date) {
      try {
        const { useGoogleCalendar } = await import('@/composables/useGoogleCalendar.js');
        const calendar = useGoogleCalendar();
        
        // Initialize if not already done
        if (!calendar.isGapiLoaded.value) {
          await calendar.initializeGoogleCalendar();
        }
        
        // Authorize if needed
        if (!calendar.isAuthorized.value) {
          const authorized = await calendar.authorizeUser();
          if (!authorized) {
            console.warn('Google Calendar authorization failed, skipping event creation');
          }
        }
        
        // Create event if authorized
        if (calendar.isAuthorized.value) {
          const scheduledDate = new Date(ticket.scheduled_date);
          const endDate = new Date(scheduledDate);
          endDate.setHours(scheduledDate.getHours() + 2); // Default 2 hour duration
          
          await calendar.createEvent({
            title: `Mantex: ${ticket.title}`,
            description: `Ticket #${ticket.ticket_number}\n\n${ticket.description}\n\nCliente: ${ticket.client?.company_name || 'N/A'}\nCategoría: ${ticket.category}`,
            location: ticket.location_address ? `${ticket.location_address}, ${ticket.location_city}, ${ticket.location_state}` : '',
            startDateTime: scheduledDate.toISOString(),
            endDateTime: endDate.toISOString(),
            attendees: ticket.client?.email ? [{ email: ticket.client.email }] : []
          });
          
          console.log('✅ Google Calendar event created for ticket:', ticket.ticket_number);
        }
      } catch (calendarError) {
        // Don't fail ticket acceptance if calendar fails
        console.error('Error creating calendar event:', calendarError);
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Trabajo Aceptado',
      detail: `Has aceptado el trabajo ${ticket.ticket_number}`,
      life: 3000
    });

    await loadTickets();
    showTicketDialog.value = false;
  } catch (error) {
    console.error('Error accepting ticket:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al aceptar el trabajo',
      life: 3000
    });
  }
};

const rejectTicket = (ticket) => {
    ticketToReject.value = ticket;
    rejectionReason.value = '';
    showRejectDialog.value = true;
};

const confirmRejectTicket = async () => {
    if (!rejectionReason.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Atención',
            detail: 'Debe proporcionar un motivo de rechazo',
            life: 3000
        });
        return;
    }

    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                status: 'rejected',
                rejection_reason: rejectionReason.value,
                supplier_notes: rejectionReason.value,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketToReject.value.id);

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Trabajo Rechazado',
            detail: `Has rechazado el trabajo ${ticketToReject.value.ticket_number}`,
            life: 3000
        });

        await loadTickets();
        showRejectDialog.value = false;
        showTicketDialog.value = false;
    } catch (error) {
        console.error('Error rejecting ticket:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al rechazar el trabajo',
            life: 3000
        });
    }
};

const startWork = async (ticket) => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Trabajo Iniciado',
            detail: `Has iniciado el trabajo ${ticket.ticket_number}`,
            life: 3000
        });

        await loadTickets();
    } catch (error) {
        console.error('Error starting work:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al iniciar el trabajo',
            life: 3000
        });
    }
};

    const sendCorrections = async (ticket) => {
        try {
            // Change status to in_progress and clear revision comments
            const { error } = await supabase
                .from('tickets')
                .update({
                    status: 'in_progress',
                    revision_comments: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', ticket.id);

            if (error) throw error;

            // Open evidence upload dialog for the ticket
            evidenceTicket.value = ticket;
            showEvidenceDialog.value = true;

            toast.add({
                severity: 'success',
                summary: 'Ticket Reabierto',
                detail: `El ticket ${ticket.ticket_number} ha sido reabierto para subir evidencias`,
                life: 3000
            });

            await loadTickets();
            showTicketDialog.value = false;
        } catch (error) {
            console.error('Error reopening ticket:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al reabrir el ticket',
                life: 3000
            });
        }
    };

const uploadEvidence = (ticket) => {
    evidenceTicket.value = ticket;
    showEvidenceDialog.value = true;
};

const onEvidenceUploaded = (data) => {
    toast.add({
        severity: 'success',
        summary: 'Evidencia subida',
        detail: `Se subieron ${data.files.length} archivos de ${data.type}`,
        life: 3000
    });
};

const onTicketStatusChanged = async (newStatus) => {
    if (evidenceTicket.value) {
        evidenceTicket.value.status = newStatus;
        await loadTickets();
    }
};

// Translation functions now imported from @/utils/status-utils.js
// Using translateStatus as getStatusLabel, translatePriority as getPriorityLabel
const getStatusLabel = translateStatus;
const getPriorityLabel = translatePriority;

const getPrioritySeverity = (priority) => {
    const severities = {
        'low': 'secondary',
        'medium': 'info',
        'high': 'warning',
        'urgent': 'danger'
    };
    return severities[priority] || 'secondary';
};

const getMaintenanceTypeLabel = (type) => {
    const labels = {
        preventive: 'Preventivo',
        corrective: 'Correctivo',
        installation: 'Instalación'
    };
    return labels[type] || type;
};

const getAttachmentTypeLabel = (type) => {
    const labels = {
        branch: 'Foto de la sucursal',
        asset: 'Foto del activo',
        problem: 'Descripción del problema',
        additional: 'Información adicional',
        evidence: 'Evidencia del trabajo'
    };
    return labels[type] || 'Imagen adjunta';
};

const getMaintenanceTypeSeverity = (type) => {
    return type === 'preventive' ? 'info' : 'warning';
};

const getMaintenanceTypeClass = (type) => {
    const classes = {
        preventive: 'bg-blue-100 text-blue-700',
        corrective: 'bg-orange-100 text-orange-700',
        installation: 'bg-purple-100 text-purple-700'
    };
    return classes[type] || '';
};

const getPriorityClass = (priority) => {
    const classes = {
        low: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-red-100 text-red-700',
        urgent: 'bg-red-200 text-red-900'
    };
    return classes[priority] || '';
};

const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Lifecycle
onMounted(async () => {
    await loadCurrentSupplier();
    await loadTickets();
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