<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/supplier/jobs"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Trabajo</ion-title>
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

      <!-- Photo Gallery (Initial Photos from Client) -->
      <div v-if="photos.length > 0" class="photo-gallery">
        <h3 class="ion-padding-horizontal">Fotos del Cliente</h3>
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
          <ion-card-title>Descripción del Problema</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          {{ ticket.description }}
        </ion-card-content>
      </ion-card>

      <!-- Google Maps -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Ubicación del Servicio</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div id="map" ref="mapContainer" style="height: 300px; width: 100%;"></div>
          <div class="ion-margin-top">
             <p class="location-text">
               <ion-icon :icon="locationOutline" color="primary"></ion-icon>
               {{ ticket.location_address }}
             </p>
             <ion-button expand="block" fill="outline" @click="openInMaps">
               <ion-icon :icon="mapOutline" slot="start"></ion-icon>
               Navegar con Google Maps
             </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Client Info -->
      <ion-list>
        <ion-list-header>
          <ion-label>Información del Cliente</ion-label>
        </ion-list-header>

        <ion-item v-if="ticket.client">
          <ion-icon :icon="businessOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Empresa</h3>
            <p>{{ ticket.client.company_name }}</p>
          </ion-label>
        </ion-item>

        <ion-item v-if="ticket.client">
          <ion-icon :icon="personOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Contacto</h3>
            <p>{{ ticket.client.contact_person }}</p>
          </ion-label>
          <ion-button slot="end" fill="clear" @click="callClient(ticket.client.phone)">
            <ion-icon :icon="callOutline"></ion-icon>
          </ion-button>
        </ion-item>

        <ion-item>
          <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Fecha Programada</h3>
            <p>{{ formatDate(ticket.scheduled_date) }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Supplier Actions -->
      <div class="ion-padding action-footer">
        
        <!-- Pending -> Accept/Reject -->
        <div v-if="ticket.status === 'pending'" class="button-group">
          <ion-button expand="block" color="success" @click="handleStatusChange('opened')">
            <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
            Aceptar Trabajo
          </ion-button>
          <ion-button expand="block" color="danger" fill="outline" @click="handleStatusChange('rejected')">
            <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
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
          <ion-card color="warning">
            <ion-card-content>
              <strong>Cambios Solicitados:</strong>
              <p>{{ ticket.revision_comments }}</p>
            </ion-card-content>
          </ion-card>
          <ion-button expand="block" color="warning" @click="handleStatusChange('under_review')">
            <ion-icon :icon="sendOutline" slot="start"></ion-icon>
            Enviar Correcciones
          </ion-button>
        </div>

        <!-- Ready for Payment -> Paid -->
        <div v-if="ticket.status === 'ready_for_payment'">
           <ion-button expand="block" color="success" @click="handleStatusChange('paid')">
            <ion-icon :icon="cashOutline" slot="start"></ion-icon>
            Registrar Pago Recibido
          </ion-button>
        </div>

      </div>

      <!-- Quote Section -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Cotización</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <QuoteForm :ticketId="ticketId" />
        </ion-card-content>
      </ion-card>

      <!-- Chat Section -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Chat con el Cliente</ion-card-title>
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
              :class="['message', message.sender_role === 'supplier' ? 'message-sent' : 'message-received']"
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

      <!-- Evidence Gallery (My Work) -->
      <div class="ion-padding">
        <h3>Mis Evidencias</h3>
        <!-- TODO: Add Evidence Upload Component here later -->
        <div v-if="evidence.length > 0">
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
        <div v-else class="empty-state-small">
            <p>No has subido evidencias aun.</p>
        </div>
      </div>

      <!-- Client Review Section -->
      <ion-card v-if="review">
        <ion-card-header>
          <ion-card-title>Calificacion del Cliente</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="review-rating">
            <ion-icon v-for="star in 5" :key="star" :icon="star <= review.rating ? starIcon : starOutlineIcon" :class="['star-icon', { 'star-filled': star <= review.rating }]"></ion-icon>
            <span class="rating-value">{{ review.rating }}/5</span>
          </div>
          <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
          <p class="review-date">Calificado el {{ formatDate(review.created_at) }}</p>
        </ion-card-content>
      </ion-card>

    </ion-content>

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

    <ion-loading :is-open="loading" message="Cargando trabajo..."></ion-loading>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton,
  IonIcon, IonChip, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonListHeader, IonItem, IonLabel, IonInput, IonTextarea,
  IonModal, IonLoading, toastController
} from '@ionic/vue';
import {
  businessOutline, calendarOutline, personOutline,
  checkmarkCircleOutline, timeOutline, alertCircleOutline, closeCircleOutline,
  hourglassOutline, sendOutline, playOutline, cashOutline, mapOutline, locationOutline, callOutline,
  star as starIcon, starOutline as starOutlineIcon
} from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';
import { supabase } from '@/lib/supabaseClient';
import { useS3Upload } from '@/composables/useS3Upload';
import { useAuth } from '@/composables/useAuth';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets';
import { useGoogleMaps } from '@/composables/useGoogleMaps';
import QuoteForm from '@/components/quotes/QuoteForm.vue';
import 'swiper/css';
import 'swiper/css/pagination';

const route = useRoute();
const { getSignedUrl } = useS3Upload();
const { user, profile } = useAuth();
const techTickets = useTechnicianTickets();
const { openAddress } = useGoogleMaps();

const modules = [Pagination];
const ticketId = route.params.id;
const ticket = ref(null);
const photos = ref([]);
const evidence = ref([]);
const review = ref(null);
const messages = ref([]);
const loading = ref(true);
const showPhotoModal = ref(false);
const showEvidenceModal = ref(false);
const currentPhotoIndex = ref(0);
const currentEvidenceIndex = ref(0);
const sendingMessage = ref(false);
const newMessage = ref('');
const mapContainer = ref(null);
const messagesContainer = ref(null);
let map = null;
let messageSubscription = null;

const loadTicket = async () => {
  try {
    loading.value = true;
    
    // Fetch ticket with technician composable
    const data = await techTickets.fetchTicketById(ticketId);
    ticket.value = data;

    // Load related data
    await Promise.all([
        loadPhotos(),
        loadEvidence(),
        loadMessages(),
        loadReview()
    ]);

    // Initialize map
    await initMap();
    // Subscribe to new messages
    subscribeToMessages();
  } catch (error) {
    console.error('Error loading ticket:', error);
    showToast('Error al cargar el trabajo', 'danger');
  } finally {
    loading.value = false;
  }
};

const loadPhotos = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
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
      .eq('ticket_id', ticketId)
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

const loadReview = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    review.value = data || null;
  } catch (error) {
    console.error('Error loading review:', error);
  }
};

const loadMessages = async () => {
  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    messages.value = data || [];
    
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const subscribeToMessages = () => {
  messageSubscription = supabase
    .channel(`ticket-messages-${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`
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
        ticket_id: ticketId,
        sender_id: user.value.id,
        sender_role: 'supplier', // Supplier sending message
        sender_name: profile.value?.company_name || profile.value?.username || 'Proveedor',
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

const handleStatusChange = async (newStatus) => {
  const result = await techTickets.updateTicketStatus(ticketId, newStatus);

  if (result.success) {
    ticket.value = { ...ticket.value, ...result.data };
    showToast(`Estado actualizado a: ${getStatusLabel(newStatus)}`, 'success');
  } else {
    showToast('Error al actualizar estado', 'danger');
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const initMap = async () => {
  if (!window.google) {
    await loadGoogleMapsScript();
  }

  const mapOptions = {
    zoom: 14,
    center: { lat: 19.4326, lng: -99.1332 },
    mapTypeControl: false,
    streetViewControl: false,
  };

  map = new window.google.maps.Map(mapContainer.value, mapOptions);
  
  if (ticket.value?.latitude && ticket.value?.longitude) {
      const pos = { 
          lat: parseFloat(ticket.value.latitude), 
          lng: parseFloat(ticket.value.longitude) 
      };
      
      new window.google.maps.Marker({
          position: pos,
          map: map,
          title: 'Ubicación del Trabajo',
          icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
      });
      
      map.setCenter(pos);
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

const openInMaps = () => {
  if (ticket.value?.location_address) {
    openAddress(ticket.value.location_address);
  }
};

const callClient = (phone) => {
  if (phone) window.open(`tel:${phone}`);
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

// Status Utils (Duplicated for simplicity or import if available)
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
    opened: 'Aceptado',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
    revision_requested: 'Cambios Solicitados',
    under_review: 'En Revisión',
    ready_for_payment: 'Listo para Pago',
    paid: 'Pagado'
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
  color: white;
}
.status-pending { background-color: var(--ion-color-warning); color: black; }
.status-opened { background-color: var(--ion-color-success); }
.status-in_progress { background-color: var(--ion-color-primary); }
.status-completed { background-color: var(--ion-color-success); }
.status-rejected { background-color: var(--ion-color-danger); }
.status-cancelled { background-color: var(--ion-color-medium); }

.ticket-number {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 12px;
}
.badges {
  display: flex;
  gap: 8px;
}

.photo-gallery {
  margin-bottom: 1rem;
}
.photo-swiper {
  padding-bottom: 2rem;
}
.photo-swiper img {
  border-radius: 12px;
  width: 100%;
  height: 200px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.location-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
  color: var(--ion-color-dark);
}

.action-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.button-group {
  display: flex;
  gap: 1rem;
}
.button-group ion-button {
  flex: 1;
}

.messages-container {
  height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--ion-background-color);
  border-radius: 8px;
  margin-bottom: 1rem;
}
.message {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border-radius: 12px;
  max-width: 85%;
}
.message-sent {
  background: var(--ion-color-primary);
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 2px;
}
.message-received {
  background: var(--ion-color-light);
  color: black;
  margin-right: auto;
  border-bottom-left-radius: 2px;
}
.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
  opacity: 0.8;
}
.empty-chat {
  text-align: center;
  color: var(--ion-color-medium);
  margin-top: 2rem;
}
.empty-state-small {
    text-align: center;
    color: var(--ion-color-medium);
    padding: 1rem;
    border: 1px dashed var(--ion-color-medium);
    border-radius: 8px;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.star-icon {
  font-size: 1.5rem;
  color: var(--ion-color-medium);
}

.star-icon.star-filled {
  color: var(--ion-color-warning);
}

.rating-value {
  margin-left: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.review-comment {
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.review-date {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}
</style>
