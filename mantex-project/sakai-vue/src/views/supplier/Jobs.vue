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
            
            <!-- Información General -->
            <div class="surface-card p-4 border-round mb-3">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <h6 class="text-900 mb-3">Información General</h6>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Número de Ticket:</label>
                            <p class="text-900 font-medium m-0">{{ selectedTicket.ticket_number }}</p>
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Título:</label>
                            <p class="text-900 font-medium m-0">{{ selectedTicket.title }}</p>
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Descripción:</label>
                            <p class="text-900 m-0">{{ selectedTicket.description }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <h6 class="text-900 mb-3">Estado y Prioridad</h6>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Tipo de Mantenimiento:</label>
                            <Tag
                                :value="getMaintenanceTypeLabel(selectedTicket.maintenance_type)"
                                :severity="getMaintenanceTypeSeverity(selectedTicket.maintenance_type)"
                            />
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Prioridad:</label>
                            <Tag
                                :value="getPriorityLabel(selectedTicket.priority)"
                                :severity="getPrioritySeverity(selectedTicket.priority)"
                            />
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Estado:</label>
                            <Tag
                                :value="getStatusLabel(selectedTicket.status)"
                                :severity="getStatusSeverity(selectedTicket.status)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ubicación -->
            <div class="surface-card p-4 border-round mb-3">
                <h6 class="text-900 mb-3">Ubicación</h6>
                <div class="mb-2">
                    <label class="block text-600 mb-1">Dirección:</label>
                    <p class="text-900 m-0">{{ selectedTicket.location_address }}</p>
                </div>
                <div>
                    <label class="block text-600 mb-1">Ciudad:</label>
                    <p class="text-900 m-0">{{ selectedTicket.location_city }}, {{ selectedTicket.location_state }}</p>
                </div>
            </div>

            <!-- Información del Cliente -->
            <div class="surface-card p-4 border-round mb-3" v-if="isSupplierApproved && selectedTicket.client">
                <h6 class="text-900 mb-3">Información del Cliente</h6>
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Empresa:</label>
                            <p class="text-900 font-medium m-0">{{ selectedTicket.client.company_name }}</p>
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Contacto:</label>
                            <p class="text-900 m-0">{{ selectedTicket.client.contact_person }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Email:</label>
                            <p class="text-900 m-0">{{ selectedTicket.client.email }}</p>
                        </div>
                        <div class="mb-3">
                            <label class="block text-600 mb-1">Teléfono:</label>
                            <p class="text-900 m-0">{{ selectedTicket.client.phone }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información Financiera -->
            <div class="surface-card p-4 border-round mb-3" v-if="isSupplierApproved && (selectedTicket.estimated_cost || selectedTicket.supplier_quote || selectedTicket.final_cost)">
                <h6 class="text-900 mb-3">Información Financiera</h6>
                <div class="grid">
                    <div class="col-12 md:col-4" v-if="selectedTicket.estimated_cost">
                        <div class="mb-2">
                            <label class="block text-600 mb-1">Costo Estimado:</label>
                            <p class="text-green-600 font-medium m-0">${{ formatCurrency(selectedTicket.estimated_cost) }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-4" v-if="selectedTicket.supplier_quote">
                        <div class="mb-2">
                            <label class="block text-600 mb-1">Mi Cotización:</label>
                            <p class="text-blue-600 font-medium m-0">${{ formatCurrency(selectedTicket.supplier_quote) }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-4" v-if="selectedTicket.final_cost">
                        <div class="mb-2">
                            <label class="block text-600 mb-1">Costo Final:</label>
                            <p class="text-900 font-medium m-0">${{ formatCurrency(selectedTicket.final_cost) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fechas Importantes -->
            <div class="surface-card p-4 border-round mb-3">
                <h6 class="text-900 mb-3">Fechas Importantes</h6>
                <div class="grid">
                    <div class="col-12 md:col-6" v-if="selectedTicket.created_at">
                        <div class="mb-2">
                            <label class="block text-600 mb-1">Creado:</label>
                            <p class="text-900 m-0">{{ formatDate(selectedTicket.created_at) }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-6" v-if="selectedTicket.updated_at">
                        <div class="mb-2">
                            <label class="block text-600 mb-1">Última Actualización:</label>
                            <p class="text-900 m-0">{{ formatDate(selectedTicket.updated_at) }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fotos Adjuntas -->
            <div class="surface-card p-4 border-round mb-3" v-if="selectedTicket.attachments && selectedTicket.attachments.length > 0">
                <h6 class="text-900 mb-3">Fotos del Cliente</h6>
                <div class="grid">
                    <div class="col-12 md:col-4 text-center mb-3" v-for="(photo, index) in selectedTicket.attachments" :key="index">
                        <Image :src="photo" alt="Foto del ticket" width="200" preview />
                    </div>
                </div>
            </div>

            <!-- Mapa de Ubicación -->
            <div class="surface-card p-4 border-round mb-3" v-if="selectedTicket.location_address">
                <h6 class="text-900 mb-3">Ubicación del Servicio</h6>
                <iframe
                    width="100%"
                    height="400"
                    style="border:0; border-radius: 8px;"
                    loading="lazy"
                    :src="mapSrc"
                ></iframe>
            </div>

            </div>
            <!-- Chat Dialog -->
            <Dialog v-model:visible="showChatDialog" modal :style="{ width: '90vw', maxWidth: '1200px' }" header="Chat del Ticket">
                <TicketChat :ticketId="selectedTicket.id" />
            </Dialog>

            <!-- Botones de Acción -->



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
                        v-if="isSupplierApproved && selectedTicket.status === 'under_review'"
                        label="Cerrar Ticket"
                        icon="pi pi-check"
                        class="p-button-warning"
                        @click="closeTicket(selectedTicket)"
                    />
                    <Button
                        v-if="isSupplierApproved"
                        label="Chat"
                        icon="pi pi-comments"
                        class="p-button-secondary"
                        @click="showChatDialog = true"
                    />
                </div>
                <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="showTicketDialog = false" />
            </div>
        </template>
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
        header="📸 Subir Evidencias del Trabajo"
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
import TicketChat from '@/components/TicketChat.vue';

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
const showChatDialog = ref(false);

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
                client:client_profiles(*)
            `)
            .order('created_at', { ascending: false });

        // Si el supplier no está aprobado, solo mostrar tickets básicos sin cliente
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
            // Si está aprobado, mostrar todos los tickets relevantes
            query = query.or(`supplier_id.eq.${currentSupplierId.value},supplier_id.is.null,status.eq.pending,status.eq.opened`);
        }

        const { data, error } = await query;

        if (error) throw error;
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

const viewTicket = (ticket) => {
  selectedTicket.value = ticket;
  showTicketDialog.value = true;
  // Initialize chat for this ticket
  const { messages, isTyping, sendMessage, markAsRead, setTypingStatus } = useFirebaseChat(ticket.id);
  // expose to template via refs (optional)
  chatData.value = { messages, isTyping, sendMessage, markAsRead, setTypingStatus };
};
    selectedTicket.value = ticket;
    showTicketDialog.value = true;
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

// Utility functions
const getStatusLabel = (status) => {
    const labels = {
        'pending': 'Pendiente',
        'opened': 'Abierto',
        'in_progress': 'En Progreso',
        'completed': 'Completado',
        'approved': 'Aprobado',
        'rejected': 'Rechazado',
        'cancelled': 'Cancelado',
        'under_review': 'En Revisión',
        'revision_requested': 'Revisión Solicitada',
        'payment_pending': 'Pago Pendiente',
        'ready_for_payment': 'Listo para Pago',
        'paid': 'Pagado',
        'closed': 'Cerrado'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        'pending': 'warning',
        'opened': 'info',
        'in_progress': 'info',
        'completed': 'success',
        'approved': 'success',
        'rejected': 'danger',
        'cancelled': 'secondary',
        'under_review': 'warning',
        'revision_requested': 'warning',
        'payment_pending': 'warning',
        'ready_for_payment': 'success',
        'paid': 'success',
        'closed': 'secondary'
    };
    return severities[status] || 'secondary';
};

const getMaintenanceTypeLabel = (type) => {
    return type === 'preventive' ? 'Preventivo' : 'Correctivo';
};

const getMaintenanceTypeSeverity = (type) => {
    return type === 'preventive' ? 'info' : 'warning';
};

const getPriorityLabel = (priority) => {
    const labels = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta',
        'urgent': 'Urgente'
    };
    return labels[priority] || priority;
};

const getPrioritySeverity = (priority) => {
    const severities = {
        'low': 'secondary',
        'medium': 'info',
        'high': 'warning',
        'urgent': 'danger'
    };
    return severities[priority] || 'secondary';
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

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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