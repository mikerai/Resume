<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Servicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" v-if="ticket">
      <!-- Status Banner -->
      <div class="status-banner" :class="ticket.status">
        <ion-icon :icon="getStatusIcon(ticket.status)"></ion-icon>
        <span>{{ translateStatus(ticket.status) }}</span>
      </div>

      <div class="ion-padding">
        <!-- Header Info -->
        <div class="ticket-header">
          <h1>{{ ticket.title }}</h1>
          <p class="ticket-number">#{{ ticket.ticket_number }}</p>
          <div class="badges">
            <ion-chip :color="getPriorityColor(ticket.priority)">
              {{ translatePriority(ticket.priority) }}
            </ion-chip>
            <ion-chip color="medium" outline>
              {{ ticket.category }}
            </ion-chip>
          </div>
        </div>

        <!-- Location Card -->
        <ion-card class="location-card">
          <ion-card-content>
            <div class="location-info">
              <ion-icon :icon="locationOutline" size="large" color="primary"></ion-icon>
              <div>
                <h3>Ubicación del Servicio</h3>
                <p>{{ ticket.location_address }}</p>
                <p class="sub-text">{{ ticket.location_city }}, {{ ticket.location_state }}</p>
              </div>
            </div>
            <div class="map-actions">
              <ion-button expand="block" fill="outline" @click="openInMaps">
                <ion-icon :icon="mapOutline" slot="start"></ion-icon>
                Ver en Mapa / Navegar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Description -->
        <div class="section">
          <h3>Descripción</h3>
          <p class="description-text">{{ ticket.description }}</p>
        </div>

        <!-- Dates -->
        <div class="section">
          <h3>Fechas</h3>
          <ion-list lines="none">
            <ion-item>
              <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
              <ion-label>
                <h2>Programado</h2>
                <p>{{ formatDate(ticket.scheduled_date) }}</p>
              </ion-label>
            </ion-item>
            <ion-item v-if="ticket.started_at">
              <ion-icon :icon="timeOutline" slot="start"></ion-icon>
              <ion-label>
                <h2>Iniciado</h2>
                <p>{{ formatDate(ticket.started_at) }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>

        <!-- Role Specific Info -->
        <div class="section" v-if="isTechnician">
          <h3>Cliente</h3>
          <ion-item lines="none" class="contact-card">
            <ion-avatar slot="start">
              <div class="avatar-placeholder">{{ getInitials(ticket.client?.company_name) }}</div>
            </ion-avatar>
            <ion-label>
              <h2>{{ ticket.client?.company_name }}</h2>
              <p>{{ ticket.client?.contact_person }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="callClient(ticket.client?.phone)">
              <ion-icon :icon="callOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </div>

        <div class="section" v-if="isClient && ticket.supplier">
          <h3>Técnico Asignado</h3>
          <ion-item lines="none" class="contact-card">
            <ion-avatar slot="start">
              <div class="avatar-placeholder">{{ getInitials(ticket.supplier?.company_name) }}</div>
            </ion-avatar>
            <ion-label>
              <h2>{{ ticket.supplier?.company_name }}</h2>
              <p>{{ ticket.supplier?.contact_person }}</p>
            </ion-label>
          </ion-item>
        </div>

        <!-- Technician Actions -->
        <div class="action-footer" v-if="isTechnician">
          <!-- Pending -> Open/Reject -->
          <div v-if="ticket.status === 'pending'" class="button-group">
            <ion-button expand="block" color="success" @click="handleStatusChange('opened')">
              Aceptar Trabajo
            </ion-button>
            <ion-button expand="block" color="danger" fill="outline" @click="handleStatusChange('rejected')">
              Rechazar
            </ion-button>
          </div>

          <!-- Opened -> In Progress -->
          <ion-button 
            v-if="ticket.status === 'opened'" 
            expand="block" 
            size="large"
            @click="handleStatusChange('in_progress')"
          >
            <ion-icon :icon="playOutline" slot="start"></ion-icon>
            Iniciar Trabajo
          </ion-button>

          <!-- In Progress -> Completed -->
          <ion-button 
            v-if="ticket.status === 'in_progress'" 
            expand="block" 
            size="large" 
            color="success"
            @click="handleStatusChange('completed')"
          >
            <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
            Finalizar Trabajo
          </ion-button>

          <!-- Revision Requested -> Under Review -->
          <div v-if="ticket.status === 'revision_requested'">
            <p class="instruction-text">Se han solicitado cambios. Realiza las correcciones y envía a revisión.</p>
            <ion-button expand="block" color="warning" @click="handleStatusChange('under_review')">
              Enviar Correcciones
            </ion-button>
          </div>

          <!-- Ready for Payment -> Paid -->
          <div v-if="ticket.status === 'ready_for_payment'">
             <ion-button expand="block" color="success" @click="handleStatusChange('paid')">
              Registrar Pago Recibido
            </ion-button>
          </div>
        </div>

        <!-- Evidence Gallery (for Client) -->
        <div class="section" v-if="isClient && ['completed', 'under_review', 'approved', 'ready_for_payment', 'paid', 'closed'].includes(ticket.status)">
          <h3>Evidencias del Trabajo</h3>
          
          <div v-if="loadingEvidence" class="loading-evidence">
            <ion-spinner></ion-spinner>
            <p>Cargando evidencias...</p>
          </div>

          <div v-else-if="evidence.length === 0" class="empty-evidence">
            <ion-icon :icon="imagesOutline" size="large" color="medium"></ion-icon>
            <p>No hay evidencias disponibles aún</p>
          </div>

          <div v-else class="evidence-grid">
            <!-- Before Photos -->
            <div v-if="beforePhotos.length > 0" class="evidence-section">
              <h4 class="evidence-type-title">Fotos Iniciales</h4>
              <div class="evidence-photos">
                <div 
                  v-for="photo in beforePhotos" 
                  :key="photo.id" 
                  class="evidence-photo"
                  @click="openPhotoViewer(photo)"
                >
                  <img :src="photo.url" :alt="photo.file_name" />
                </div>
              </div>
            </div>

            <!-- Progress Photos -->
            <div v-if="progressPhotos.length > 0" class="evidence-section">
              <h4 class="evidence-type-title">Fotos del Proceso</h4>
              <div class="evidence-photos">
                <div 
                  v-for="photo in progressPhotos" 
                  :key="photo.id" 
                  class="evidence-photo"
                  @click="openPhotoViewer(photo)"
                >
                  <img :src="photo.url" :alt="photo.file_name" />
                </div>
              </div>
            </div>

            <!-- After Photos -->
            <div v-if="afterPhotos.length > 0" class="evidence-section">
              <h4 class="evidence-type-title">Fotos Finales</h4>
              <div class="evidence-photos">
                <div 
                  v-for="photo in afterPhotos" 
                  :key="photo.id" 
                  class="evidence-photo"
                  @click="openPhotoViewer(photo)"
                >
                  <img :src="photo.url" :alt="photo.file_name" />
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div v-if="documents.length > 0" class="evidence-section">
              <h4 class="evidence-type-title">Documentos</h4>
              <ion-list>
                <ion-item 
                  v-for="doc in documents" 
                  :key="doc.id"
                  button
                  @click="openDocument(doc.url)"
                >
                  <ion-icon :icon="documentTextOutline" slot="start" color="primary"></ion-icon>
                  <ion-label>
                    <h3>{{ doc.file_name }}</h3>
                    <p>{{ formatFileSize(doc.file_size) }} - {{ formatDate(doc.uploaded_at) }}</p>
                  </ion-label>
                  <ion-icon :icon="downloadOutline" slot="end"></ion-icon>
                </ion-item>
              </ion-list>
            </div>
          </div>
        </div>

        <!-- Photo Viewer Modal -->
        <ion-modal :is-open="showPhotoViewer" @didDismiss="showPhotoViewer = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ selectedPhoto?.file_name }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showPhotoViewer = false">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="photo-viewer-content">
            <img v-if="selectedPhoto" :src="selectedPhoto.url" :alt="selectedPhoto.file_name" class="full-photo" />
          </ion-content>
        </ion-modal>

        <!-- Client Actions -->
        <div class="action-footer" v-if="isClient">
          <!-- Pending/Opened -> Cancel -->
          <div v-if="['pending', 'opened'].includes(ticket.status)">
            <ion-button expand="block" color="danger" fill="outline" @click="handleStatusChange('cancelled')">
              Cancelar Solicitud
            </ion-button>
          </div>



          <!-- Rejected -> Reassign -->
          <div v-if="ticket.status === 'rejected'">
            <p class="instruction-text error-text">El proveedor ha rechazado esta solicitud. Por favor, reasigna a otro proveedor.</p>
            <ion-button expand="block" color="primary" @click="openReassignModal">
              Reasignar Proveedor
            </ion-button>
          </div>

          <!-- Completed/Under Review -> Approve/Reject/Request Changes -->
          <div v-if="['completed', 'under_review'].includes(ticket.status)" class="button-group-vertical">
            <ion-button expand="block" color="success" @click="handleStatusChange('approved')">
              Aprobar Trabajo
            </ion-button>
            <ion-button expand="block" color="warning" fill="outline" @click="openRevisionModal">
              Solicitar Cambios
            </ion-button>
            <ion-button expand="block" color="danger" fill="clear" @click="handleStatusChange('rejected')">
              Rechazar Trabajo
            </ion-button>
          </div>

          <!-- Approved -> Accept (Ready for Payment) -->
          <div v-if="ticket.status === 'approved'">
            <p class="instruction-text">El trabajo ha sido aprobado. Confirma para proceder al pago.</p>
            <ion-button expand="block" color="primary" @click="handleStatusChange('ready_for_payment')">
              Aceptar y Proceder al Pago
            </ion-button>
          </div>

          <!-- Paid -> Closed -->
          <div v-if="ticket.status === 'paid'">
             <ion-button expand="block" color="medium" fill="outline" @click="handleStatusChange('closed')">
              Cerrar Ticket
            </ion-button>
          </div>
        </div>

        <!-- Reassign Modal -->
        <ion-modal :is-open="showReassignModal" @didDismiss="showReassignModal = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>Reasignar Proveedor</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showReassignModal = false">Cerrar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-list>
              <ion-item v-for="supplier in suppliers" :key="supplier.id" button @click="handleReassign(supplier.id)">
                <ion-label>
                  <h2>{{ supplier.company_name || supplier.contact_person }}</h2>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-content>
        </ion-modal>

        <!-- Revision Request Modal -->
        <ion-modal :is-open="showRevisionModal" @didDismiss="showRevisionModal = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>Solicitar Cambios</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showRevisionModal = false">Cancelar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <p class="instruction-text">Por favor, describe qué cambios necesitas que realice el técnico:</p>
            <ion-textarea
              v-model="revisionComments"
              placeholder="Ej: Las fotos finales no muestran X, falta Y, etc."
              :rows="6"
              counter
              :maxlength="500"
              fill="outline"
            ></ion-textarea>
            <ion-button 
              expand="block" 
              color="warning" 
              @click="submitRevisionRequest"
              :disabled="!revisionComments || revisionComments.trim().length < 10"
              class="ion-margin-top"
            >
              Enviar Solicitud de Cambios
            </ion-button>
          </ion-content>
        </ion-modal>

        <!-- Chat Section (NEW) -->
        <div class="section">
          <h3>Chat con {{ isTechnician ? 'Cliente' : 'Técnico' }}</h3>
          <TicketChat :ticketId="ticket.id" />
        </div>
      </div>
    </ion-content>

    <ion-content v-else class="ion-padding ion-text-center">
      <ion-spinner v-if="loading"></ion-spinner>
      <div v-else>
        <p>No se encontró el ticket.</p>
        <ion-button router-link="/">Volver</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonIcon, IonButton, IonChip, IonList, IonItem, IonLabel,
  IonAvatar, IonSpinner, toastController, IonModal, IonTextarea
} from '@ionic/vue';
import { 
  locationOutline, mapOutline, calendarOutline, timeOutline, callOutline,
  playOutline, checkmarkCircleOutline, alertCircleOutline, timeSharp,
  documentTextOutline, cashOutline, closeCircleOutline, syncOutline,
  imagesOutline, downloadOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets.js';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { useGoogleMaps } from '@/composables/useGoogleMaps.js';
import TicketChat from '@/components/TicketChat.vue';

const route = useRoute();
const router = useRouter();
const { user, isSupplier, isClient, isFlynn } = useAuth();
const { openAddress } = useGoogleMaps();

// Composables based on role
const techTickets = useTechnicianTickets();
const clientTickets = useClientTickets();

const ticket = ref(null);
const loading = ref(true);
const showReassignModal = ref(false);
const showRevisionModal = ref(false);
const revisionComments = ref('');
const suppliers = ref([]);

const isTechnician = computed(() => isSupplier.value || (isFlynn.value && !isClient.value));

onMounted(async () => {
  const ticketId = route.params.id;
  if (!ticketId) return;

  loading.value = true;
  try {
    // Fetch logic based on role
    // Note: We need to implement fetchTicketById in composables
    let data;
    if (isTechnician.value) {
      data = await techTickets.fetchTicketById(ticketId);
    } else {
      data = await clientTickets.fetchTicketById(ticketId);
    }
    ticket.value = data;
  } catch (e) {
    console.error('Error loading ticket:', e);
  } finally {
    loading.value = false;
  }
});

// Evidence state
const evidence = ref([]);
const loadingEvidence = ref(false);
const showPhotoViewer = ref(false);
const selectedPhoto = ref(null);

// Computed evidence by type
const beforePhotos = computed(() => evidence.value.filter(e => e.evidence_type === 'before' && e.file_type === 'image'));
const progressPhotos = computed(() => evidence.value.filter(e => e.evidence_type === 'progress' && e.file_type === 'image'));
const afterPhotos = computed(() => evidence.value.filter(e => e.evidence_type === 'after' && e.file_type === 'image'));
const documents = computed(() => evidence.value.filter(e => e.file_type === 'document'));

// Load evidence when ticket changes
watch(ticket, async (newTicket) => {
  if (newTicket && isClient.value && ['completed', 'under_review', 'approved', 'ready_for_payment', 'paid', 'closed'].includes(newTicket.status)) {
    await loadEvidence();
  }
});

// Load evidence from Supabase
const loadEvidence = async () => {
  if (!ticket.value) return;
  
  loadingEvidence.value = true;
  try {
    const { supabase } = await import('@/lib/supabaseClient.js');
    const { data, error } = await supabase
      .from('ticket_evidence')
      .select('*')
      .eq('ticket_id', ticket.value.id)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;
    evidence.value = data || [];
  } catch (error) {
    console.error('Error loading evidence:', error);
    evidence.value = [];
  } finally {
    loadingEvidence.value = false;
  }
};

// Open photo viewer
const openPhotoViewer = (photo) => {
  selectedPhoto.value = photo;
  showPhotoViewer.value = true;
};

// Open document in browser
const openDocument = (url) => {
  window.open(url, '_blank');
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleStatusChange = async (newStatus) => {
  // Determine which composable to use based on role
  const updater = isTechnician.value ? techTickets : clientTickets;
  
  let result;
  if (isTechnician.value) {
    result = await techTickets.updateTicketStatus(ticket.value.id, newStatus);
  } else {
    result = await clientTickets.updateTicketStatus(ticket.value.id, newStatus);
  }

  if (result.success) {
    ticket.value = { ...ticket.value, ...result.data };
    const toast = await toastController.create({
      message: `Estado actualizado a: ${translateStatus(newStatus)}`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } else {
    const toast = await toastController.create({
      message: 'Error al actualizar estado',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const openReassignModal = async () => {
  suppliers.value = await clientTickets.fetchSuppliers();
  showReassignModal.value = true;
};

const openRevisionModal = () => {
  revisionComments.value = '';
  showRevisionModal.value = true;
};

const submitRevisionRequest = async () => {
  if (!revisionComments.value || revisionComments.value.trim().length < 10) {
    return;
  }

  try {
    const { supabase } = await import('@/lib/supabaseClient.js');
    
    // Update ticket status and save revision comments
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'revision_requested',
        revision_comments: revisionComments.value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.value.id);

    if (error) throw error;

    ticket.value.status = 'revision_requested';
    ticket.value.revision_comments = revisionComments.value.trim();
    
    showRevisionModal.value = false;
    
    const toast = await toastController.create({
      message: 'Solicitud de cambios enviada al técnico',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  } catch (error) {
    console.error('Error requesting revision:', error);
    const toast = await toastController.create({
      message: 'Error al solicitar cambios',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const handleReassign = async (supplierId) => {
  const result = await clientTickets.reassignTicket(ticket.value.id, supplierId);
  
  if (result.success) {
    ticket.value = { ...ticket.value, ...result.data };
    showReassignModal.value = false;
    const toast = await toastController.create({
      message: 'Ticket reasignado exitosamente',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  } else {
    const toast = await toastController.create({
      message: 'Error al reasignar ticket',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const openInMaps = () => {
  if (ticket.value?.location_address) {
    openAddress(ticket.value.location_address);
  }
};

const callClient = (phone) => {
  if (phone) window.open(`tel:${phone}`);
};

// Helpers
const getStatusIcon = (status) => {
  const map = {
    'pending': timeSharp,
    'opened': documentTextOutline,
    'in_progress': playOutline,
    'completed': checkmarkCircleOutline,
    'revision_requested': syncOutline,
    'under_review': documentTextOutline,
    'approved': checkmarkCircleOutline,
    'rejected': closeCircleOutline,
    'ready_for_payment': cashOutline,
    'payment_pending': cashOutline,
    'paid': cashOutline,
    'closed': checkmarkCircleOutline,
    'cancelled': closeCircleOutline
  };
  return map[status] || alertCircleOutline;
};

const translateStatus = (status) => {
  const map = { 
    'pending': 'Pendiente', 
    'opened': 'Abierto',
    'assigned': 'Asignado',
    'in_progress': 'En Curso', 
    'completed': 'Completado',
    'revision_requested': 'Cambios Solicitados',
    'under_review': 'En Revisión',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'ready_for_payment': 'Listo para Pago',
    'payment_pending': 'Pago Pendiente',
    'paid': 'Pagado',
    'closed': 'Cerrado',
    'cancelled': 'Cancelado'
  };
  return map[status] || status;
};

const getPriorityColor = (priority) => {
  const colorMap = {
    'urgent': 'danger',      // Rojo - Urgente/Crítico
    'high': 'warning',       // Naranja - Alta
    'medium': 'warning',     // Amarillo - Media
    'low': 'success'         // Verde - Baja
  };
  return colorMap[priority?.toLowerCase()] || 'medium';
};

const translatePriority = (priority) => {
  const map = { 
    'urgent': 'Urgente', 
    'high': 'Alta', 
    'medium': 'Media', 
    'low': 'Baja' 
  };
  return map[priority] || priority;
};

const formatDate = (date) => {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
};
</script>

<style scoped>
.status-banner {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  color: white;
}
.status-banner.pending { background-color: var(--ion-color-warning); color: black; }
.status-banner.assigned { background-color: var(--ion-color-secondary); }
.status-banner.in_progress { background-color: var(--ion-color-primary); }
.status-banner.completed { background-color: var(--ion-color-success); }

.ticket-header {
  margin-bottom: 20px;
}
.ticket-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.ticket-number {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 12px;
}
.badges {
  display: flex;
  gap: 8px;
}

.location-card {
  margin: 0 0 24px 0;
  border-radius: 16px;
}
.location-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.location-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.location-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.section {
  margin-bottom: 24px;
}
.section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ion-color-dark);
}
.description-text {
  line-height: 1.5;
  color: var(--ion-color-dark);
}

.contact-card {
  --background: var(--ion-color-light);
  border-radius: 12px;
}
.avatar-placeholder {
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.action-footer {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Evidence Gallery Styles */
.loading-evidence,
.empty-evidence {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
  gap: 12px;
}

.evidence-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.evidence-section {
  margin-bottom: 16px;
}

.evidence-type-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
  margin-bottom: 12px;
}

.evidence-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.evidence-photo {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.evidence-photo:active {
  transform: scale(0.95);
}

.evidence-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-viewer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.full-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

</style>
