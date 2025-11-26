<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/tickets"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Ticket</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="canEdit" @click="openEditModal">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="ticket">
      <!-- Status Banner -->
      <div class="status-banner" :class="`status-${ticket.status}`">
        <ion-icon :icon="getStatusIcon(ticket.status)"></ion-icon>
        <span>{{ getStatusLabel(ticket.status) }}</span>
      </div>

      <!-- Ticket Header -->
      <div class="ion-padding">
        <h1>{{ ticket.title }}</h1>
        <p class="ticket-number">#{{ ticket.ticket_number }}</p>
        <div class="badges">
          <ion-chip :color="getPriorityColor(ticket.priority)">
            {{ getPriorityLabel(ticket.priority) }}
          </ion-chip>
          <ion-chip color="medium" outline>
            {{ ticket.category }}
          </ion-chip>
        </div>
      </div>

      <!-- Photo Gallery -->
      <div v-if="photos.length > 0" class="photo-gallery">
        <h3 class="ion-padding-horizontal">Fotos del Ticket</h3>
        <swiper
          :modules="modules"
          :slides-per-view="1.2"
          :space-between="10"
          :pagination="{ clickable: true }"
          :centered-slides="true"
          class="photo-swiper"
        >
          <swiper-slide v-for="(photo, index) in photos" :key="index">
            <img :src="photo.url" :alt="`Foto ${index + 1}`" @click="openPhotoModal(index)" />
          </swiper-slide>
        </swiper>
      </div>

      <!-- Description -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Descripción</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          {{ ticket.description }}
        </ion-card-content>
      </ion-card>

      <!-- Google Maps -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Ubicaciones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div id="map" ref="mapContainer" style="height: 300px; width: 100%;"></div>
        </ion-card-content>
      </ion-card>

      <!-- Details -->
      <ion-list>
        <ion-list-header>
          <ion-label>Detalles</ion-label>
        </ion-list-header>

        <ion-item v-if="ticket.branch">
          <ion-icon :icon="businessOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Sucursal</h3>
            <p>{{ ticket.branch.name }}</p>
          </ion-label>
        </ion-item>

        <ion-item v-if="ticket.asset">
          <ion-icon :icon="cubeOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Activo</h3>
            <p>{{ ticket.asset.name }} ({{ ticket.asset.category }})</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Fecha Programada</h3>
            <p>{{ formatDate(ticket.scheduled_date) }}</p>
          </ion-label>
        </ion-item>

        <ion-item v-if="ticket.supplier">
          <ion-icon :icon="personOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Proveedor Asignado</h3>
            <p>{{ ticket.supplier.company_name }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Action Buttons -->
      <div class="ion-padding" v-if="showActionButtons">
        <ion-button 
          v-if="canCancel" 
          expand="block" 
          color="danger" 
          @click="confirmCancelTicket"
        >
          <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
          Cancelar Ticket
        </ion-button>
      </div>

      <!-- Chat Section -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Chat con el Proveedor</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <!-- Messages List -->
          <div class="messages-container" ref="messagesContainer">
            <div v-if="messages.length === 0" class="empty-chat">
              <p>No hay mensajes aún. Inicia la conversación.</p>
            </div>
            <div 
              v-for="message in messages" 
              :key="message.id"
              :class="['message', message.sender_role === 'client' ? 'message-sent' : 'message-received']"
            >
              <div class="message-header">
                <strong>{{ message.sender_name }}</strong>
                <span class="message-time">{{ formatMessageTime(message.created_at) }}</span>
              </div>
              <div class="message-content">{{ message.message }}</div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-container">
            <ion-item lines="none">
              <ion-textarea
                v-model="newMessage"
                placeholder="Escribe un mensaje..."
                :rows="2"
                @keyup.enter.exact="sendMessage"
              ></ion-textarea>
              <ion-button 
                slot="end" 
                @click="sendMessage" 
                :disabled="!newMessage.trim() || sendingMessage"
              >
                <ion-icon :icon="sendOutline"></ion-icon>
              </ion-button>
            </ion-item>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Evidence Gallery (After Work) -->
      <div v-if="evidence.length > 0" class="ion-padding">
        <h3>Evidencias del Trabajo</h3>
        <swiper
          :modules="modules"
          :slides-per-view="1.2"
          :space-between="10"
          :pagination="{ clickable: true }"
          :centered-slides="true"
          class="evidence-swiper"
        >
          <swiper-slide v-for="(item, index) in evidence" :key="index">
            <img :src="item.url" :alt="`Evidencia ${index + 1}`" @click="openEvidenceModal(index)" />
          </swiper-slide>
        </swiper>
      </div>
    </ion-content>

    <!-- Cancel Confirmation Alert -->
    <ion-alert
      :is-open="showCancelAlert"
      header="Cancelar Ticket"
      message="¿Estás seguro de que deseas cancelar este ticket?"
      :buttons="cancelAlertButtons"
      @didDismiss="showCancelAlert = false"
    ></ion-alert>

    <!-- Edit Modal -->
    <ion-modal :is-open="showEditModal" @didDismiss="closeEditModal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="closeEditModal">Cancelar</ion-button>
          </ion-buttons>
          <ion-title>Editar Ticket</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="saveTicket" :disabled="saving">Guardar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Título</ion-label>
            <ion-input v-model="editForm.title"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea v-model="editForm.description" :rows="4"></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Prioridad</ion-label>
            <ion-select v-model="editForm.priority">
              <ion-select-option value="low">Baja</ion-select-option>
              <ion-select-option value="medium">Media</ion-select-option>
              <ion-select-option value="high">Alta</ion-select-option>
              <ion-select-option value="urgent">Urgente</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Fecha Programada</ion-label>
            <ion-datetime-button datetime="scheduled-datetime"></ion-datetime-button>
            <ion-modal :keep-contents-mounted="true">
              <ion-datetime 
                id="scheduled-datetime" 
                v-model="editForm.scheduled_date"
                presentation="date-time"
              ></ion-datetime>
            </ion-modal>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Photo Viewer Modal -->
    <ion-modal :is-open="showPhotoModal" @didDismiss="closePhotoModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Foto {{ currentPhotoIndex + 1 }} de {{ photos.length }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePhotoModal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <img v-if="photos[currentPhotoIndex]" :src="photos[currentPhotoIndex].url" style="width: 100%; height: auto;" />
      </ion-content>
    </ion-modal>

    <!-- Evidence Viewer Modal -->
    <ion-modal :is-open="showEvidenceModal" @didDismiss="closeEvidenceModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Evidencia {{ currentEvidenceIndex + 1 }} de {{ evidence.length }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeEvidenceModal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <img v-if="evidence[currentEvidenceIndex]" :src="evidence[currentEvidenceIndex].url" style="width: 100%; height: auto;" />
      </ion-content>
    </ion-modal>

    <ion-loading :is-open="loading" message="Cargando..."></ion-loading>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton,
  IonIcon, IonChip, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonListHeader, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonDatetime, IonDatetimeButton, IonModal, IonLoading, IonAlert,
  toastController, alertController
} from '@ionic/vue';
import {
  createOutline, businessOutline, cubeOutline, calendarOutline, personOutline,
  checkmarkCircleOutline, timeOutline, alertCircleOutline, closeCircleOutline,
  hourglassOutline, sendOutline
} from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';
import { supabase } from '@/lib/supabaseClient';
import { useS3Upload } from '@/composables/useS3Upload';
import { useAuth } from '@/composables/useAuth';
import 'swiper/css';
import 'swiper/css/pagination';

const route = useRoute();
const { getSignedUrl } = useS3Upload();
const { user, profile } = useAuth();

const modules = [Pagination];
const ticket = ref(null);
const photos = ref([]);
const evidence = ref([]);
const messages = ref([]);
const loading = ref(true);
const showEditModal = ref(false);
const showPhotoModal = ref(false);
const showEvidenceModal = ref(false);
const showCancelAlert = ref(false);
const currentPhotoIndex = ref(0);
const currentEvidenceIndex = ref(0);
const saving = ref(false);
const sendingMessage = ref(false);
const newMessage = ref('');
const mapContainer = ref(null);
const messagesContainer = ref(null);
let map = null;
let messageSubscription = null;

const editForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  scheduled_date: new Date().toISOString()
});

const canEdit = computed(() => {
  return ticket.value && ['pending', 'opened'].includes(ticket.value.status);
});

const canCancel = computed(() => {
  return ticket.value && ['pending', 'opened', 'assigned'].includes(ticket.value.status);
});

const showActionButtons = computed(() => {
  return canCancel.value;
});

const cancelAlertButtons = [
  {
    text: 'No',
    role: 'cancel'
  },
  {
    text: 'Sí, cancelar',
    role: 'confirm',
    handler: () => cancelTicket()
  }
];

const loadTicket = async () => {
  try {
    loading.value = true;
    const ticketId = route.params.id;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        branch:client_branches(id, name, full_address, latitude, longitude),
        asset:client_assets(id, name, category),
        supplier:supplier_profiles!tickets_supplier_id_fkey(id, company_name, full_address, latitude, longitude)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    ticket.value = data;

    // Load photos
    await loadPhotos();
    // Load evidence
    await loadEvidence();
    // Load messages
    await loadMessages();
    // Initialize map
    await initMap();
    // Subscribe to new messages
    subscribeToMessages();
  } catch (error) {
    console.error('Error loading ticket:', error);
    showToast('Error al cargar el ticket', 'danger');
  } finally {
    loading.value = false;
  }
};

const loadPhotos = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticket.value.id)
      .eq('attachment_type', 'photo')
      .order('uploaded_at', { ascending: true });

    if (error) throw error;

    photos.value = await Promise.all(
      (data || []).map(async (photo) => ({
        ...photo,
        url: await getSignedUrl(photo.s3_key)
      }))
    );
  } catch (error) {
    console.error('Error loading photos:', error);
  }
};

const loadEvidence = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticket.value.id)
      .eq('attachment_type', 'evidence')
      .order('uploaded_at', { ascending: true });

    if (error) throw error;

    evidence.value = await Promise.all(
      (data || []).map(async (item) => ({
        ...item,
        url: await getSignedUrl(item.s3_key)
      }))
    );
  } catch (error) {
    console.error('Error loading evidence:', error);
  }
};

const loadMessages = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.value.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    messages.value = data || [];
    
    // Scroll to bottom after messages load
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const subscribeToMessages = () => {
  messageSubscription = supabase
    .channel(`ticket-messages-${ticket.value.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticket.value.id}`
      },
      (payload) => {
        messages.value.push(payload.new);
        nextTick(() => scrollToBottom());
      }
    )
    .subscribe();
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || sendingMessage.value) return;

  try {
    sendingMessage.value = true;
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.value.id,
        sender_id: user.value.id,
        sender_role: 'client',
        sender_name: profile.value?.full_name || profile.value?.username || 'Cliente',
        message: newMessage.value.trim()
      });

    if (error) throw error;

    newMessage.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Error al enviar mensaje', 'danger');
  } finally {
    sendingMessage.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const confirmCancelTicket = () => {
  showCancelAlert.value = true;
};

const cancelTicket = async () => {
  try {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.value.id);

    if (error) throw error;

    showToast('Ticket cancelado correctamente', 'success');
    await loadTicket();
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    showToast('Error al cancelar el ticket', 'danger');
  }
};

const initMap = async () => {
  if (!window.google) {
    await loadGoogleMapsScript();
  }

  const mapOptions = {
    zoom: 12,
    center: { lat: 19.4326, lng: -99.1332 }, // Default to Mexico City
    mapTypeControl: false,
    streetViewControl: false,
  };

  map = new window.google.maps.Map(mapContainer.value, mapOptions);
  const bounds = new window.google.maps.LatLngBounds();
  const markers = [];

  // Add ticket location marker (main location)
  if (ticket.value.latitude && ticket.value.longitude) {
    const ticketMarker = new window.google.maps.Marker({
      position: { lat: parseFloat(ticket.value.latitude), lng: parseFloat(ticket.value.longitude) },
      map: map,
      title: 'Ubicación del Trabajo',
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
    });
    markers.push(ticketMarker);
    bounds.extend(ticketMarker.getPosition());

    const ticketInfo = new window.google.maps.InfoWindow({
      content: `<div><strong>Ubicación del Trabajo</strong><br/>${ticket.value.location_address || 'Sin dirección'}</div>`
    });
    ticketMarker.addListener('click', () => ticketInfo.open(map, ticketMarker));
  }

  // Add supplier location marker
  if (ticket.value.supplier?.latitude && ticket.value.supplier?.longitude) {
    const supplierMarker = new window.google.maps.Marker({
      position: { lat: parseFloat(ticket.value.supplier.latitude), lng: parseFloat(ticket.value.supplier.longitude) },
      map: map,
      title: 'Ubicación del Proveedor',
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
    });
    markers.push(supplierMarker);
    bounds.extend(supplierMarker.getPosition());

    const supplierInfo = new window.google.maps.InfoWindow({
      content: `<div><strong>${ticket.value.supplier.company_name}</strong><br/>${ticket.value.supplier.full_address || 'Sin dirección'}</div>`
    });
    supplierMarker.addListener('click', () => supplierInfo.open(map, supplierMarker));
  }

  // Add branch location marker
  if (ticket.value.branch?.latitude && ticket.value.branch?.longitude) {
    const branchMarker = new window.google.maps.Marker({
      position: { lat: parseFloat(ticket.value.branch.latitude), lng: parseFloat(ticket.value.branch.longitude) },
      map: map,
      title: 'Sucursal',
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }
    });
    markers.push(branchMarker);
    bounds.extend(branchMarker.getPosition());

    const branchInfo = new window.google.maps.InfoWindow({
      content: `<div><strong>Sucursal: ${ticket.value.branch.name}</strong><br/>${ticket.value.branch.full_address || 'Sin dirección'}</div>`
    });
    branchMarker.addListener('click', () => branchInfo.open(map, branchMarker));
  }

  if (markers.length > 0) {
    map.fitBounds(bounds);
  }
};

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const openEditModal = () => {
  editForm.value = {
    title: ticket.value.title,
    description: ticket.value.description,
    priority: ticket.value.priority,
    scheduled_date: ticket.value.scheduled_date
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const saveTicket = async () => {
  try {
    saving.value = true;
    const { error } = await supabase
      .from('tickets')
      .update({
        title: editForm.value.title,
        description: editForm.value.description,
        priority: editForm.value.priority,
        scheduled_date: editForm.value.scheduled_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.value.id);

    if (error) throw error;

    showToast('Ticket actualizado correctamente', 'success');
    await loadTicket();
    closeEditModal();
  } catch (error) {
    console.error('Error saving ticket:', error);
    showToast('Error al actualizar el ticket', 'danger');
  } finally {
    saving.value = false;
  }
};

const openPhotoModal = (index) => {
  currentPhotoIndex.value = index;
  showPhotoModal.value = true;
};

const closePhotoModal = () => {
  showPhotoModal.value = false;
};

const openEvidenceModal = (index) => {
  currentEvidenceIndex.value = index;
  showEvidenceModal.value = true;
};

const closeEvidenceModal = () => {
  showEvidenceModal.value = false;
};

const getStatusIcon = (status) => {
  const icons = {
    pending: hourglassOutline,
    opened: checkmarkCircleOutline,
    in_progress: timeOutline,
    completed: checkmarkCircleOutline,
    cancelled: closeCircleOutline,
    rejected: alertCircleOutline
  };
  return icons[status] || hourglassOutline;
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    opened: 'Abierto',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    rejected: 'Rechazado'
  };
  return labels[status] || status;
};

const getPriorityColor = (priority) => {
  const colors = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  };
  return colors[priority] || 'medium';
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

const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  await toast.present();
};

onMounted(() => {
  loadTicket();
});

onUnmounted(() => {
  if (messageSubscription) {
    messageSubscription.unsubscribe();
  }
});
</script>

<style scoped>
.status-banner {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  justify-content: center;
}

.status-pending { background: var(--ion-color-warning-tint); color: var(--ion-color-warning-contrast); }
.status-opened { background: var(--ion-color-primary-tint); color: var(--ion-color-primary-contrast); }
.status-in_progress { background: var(--ion-color-tertiary-tint); color: var(--ion-color-tertiary-contrast); }
.status-completed { background: var(--ion-color-success-tint); color: var(--ion-color-success-contrast); }
.status-cancelled { background: var(--ion-color-medium-tint); color: var(--ion-color-medium-contrast); }
.status-rejected { background: var(--ion-color-danger-tint); color: var(--ion-color-danger-contrast); }

.ticket-number {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.photo-gallery, .evidence-gallery {
  margin: 1rem 0;
}

.photo-swiper, .evidence-swiper {
  padding-bottom: 2rem;
}

.photo-swiper img, .evidence-swiper img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

#map {
  border-radius: 8px;
}

/* Chat Styles */
.messages-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.empty-chat {
  text-align: center;
  color: var(--ion-color-medium);
  padding: 2rem;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 80%;
}

.message-sent {
  background: var(--ion-color-primary);
  color: white;
  margin-left: auto;
  text-align: right;
}

.message-received {
  background: white;
  color: var(--ion-color-dark);
  margin-right: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.message-sent .message-header {
  flex-direction: row-reverse;
}

.message-time {
  opacity: 0.7;
  font-size: 0.75rem;
}

.message-content {
  word-wrap: break-word;
}

.message-input-container {
  border-top: 1px solid var(--ion-color-light-shade);
  padding-top: 0.5rem;
}

.message-input-container ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.message-input-container ion-textarea {
  --padding-start: 0.5rem;
}

.message-input-container ion-button {
  margin-left: 0.5rem;
}
</style>
