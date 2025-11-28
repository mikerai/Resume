<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mensajes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <!-- Filter Tabs -->
      <ion-toolbar>
        <ion-segment v-model="selectedFilter" @ionChange="filterTickets">
          <ion-segment-button value="all">
            <ion-label>Todos ({{ ticketCounts.all }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="active">
            <ion-label>Activos ({{ ticketCounts.active }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completados ({{ ticketCounts.completed }})</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner color="primary"></ion-spinner>
        <p class="ion-margin-top">Cargando conversaciones...</p>
      </div>

      <!-- Messages List -->
      <div v-else-if="filteredTickets.length > 0" class="messages-grid">
        <ion-card
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="message-card"
          button
          @click="openTicketChat(ticket)"
        >
          <ion-card-content>
            <div class="card-header">
              <div class="avatar-section">
                <div class="avatar-placeholder">
                  {{ getInitials(ticket.client?.company_name) }}
                </div>
                <div class="ticket-info">
                  <h3>{{ ticket.title }}</h3>
                  <p class="company-name">
                    <ion-icon :icon="businessOutline"></ion-icon>
                    {{ ticket.client?.company_name || 'Cliente' }}
                  </p>
                </div>
              </div>
              <ion-chip :color="getStatusColor(ticket.status)" size="small">
                {{ translateStatus(ticket.status) }}
              </ion-chip>
            </div>

            <div class="ticket-meta">
              <div class="meta-item">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span>{{ ticket.location_city || 'Sin ubicación' }}</span>
              </div>
              <div class="meta-item">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatDate(ticket.scheduled_date) }}</span>
              </div>
            </div>

            <div v-if="ticket.last_message" class="last-message">
              <ion-icon :icon="chatbubbleOutline"></ion-icon>
              {{ truncate(ticket.last_message, 60) }}
            </div>

            <div v-if="ticket.unread_count > 0" class="unread-badge">
              <ion-badge color="danger">{{ ticket.unread_count }} nuevos</ion-badge>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state ion-text-center">
        <ion-icon :icon="chatbubblesOutline" size="large" color="medium"></ion-icon>
        <h3>{{ getEmptyStateMessage() }}</h3>
        <p>Las conversaciones de tus tickets aparecerán aquí</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonChip, IonBadge, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/vue';
import {
  refreshOutline, businessOutline, chatbubblesOutline, chatbubbleOutline,
  locationOutline, calendarOutline
} from 'ionicons/icons';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets.js';
import { translateStatus, getStatusColor } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading } = useTechnicianTickets();

const allTickets = ref([]);
const selectedFilter = ref('active');

const ticketCounts = computed(() => ({
  all: allTickets.value.length,
  active: allTickets.value.filter(t => 
    ['pending', 'opened', 'in_progress', 'under_review', 'revision_requested'].includes(t.status)
  ).length,
  completed: allTickets.value.filter(t => 
    ['completed', 'approved', 'ready_for_payment', 'paid'].includes(t.status)
  ).length
}));

const filteredTickets = computed(() => {
  let tickets = allTickets.value;
  
  if (selectedFilter.value === 'active') {
    tickets = tickets.filter(t => 
      ['pending', 'opened', 'in_progress', 'under_review', 'revision_requested'].includes(t.status)
    );
  } else if (selectedFilter.value === 'completed') {
    tickets = tickets.filter(t => 
      ['completed', 'approved', 'ready_for_payment', 'paid'].includes(t.status)
    );
  }
  
  // Exclude cancelled and closed
  return tickets.filter(t => !['cancelled', 'closed'].includes(t.status));
});

const refreshData = async () => {
  const tickets = await fetchTickets();
  allTickets.value = tickets || [];
};

const filterTickets = () => {
  // Reactive computed handles this
};

const openTicketChat = (ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
};

const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getEmptyStateMessage = () => {
  if (selectedFilter.value === 'active') {
    return 'No hay conversaciones activas';
  } else if (selectedFilter.value === 'completed') {
    return 'No hay conversaciones completadas';
  }
  return 'No hay conversaciones';
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.messages-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-card {
  margin: 0;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.message-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.avatar-section {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 12px;
}

.ticket-info {
  flex: 1;
  min-width: 0;
}

.ticket-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-name {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.company-name ion-icon {
  font-size: 0.9rem;
}

.ticket-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.meta-item ion-icon {
  font-size: 1rem;
}

.last-message {
  padding: 0.75rem;
  background: var(--ion-color-light);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--ion-color-dark);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.last-message ion-icon {
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.unread-badge {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  margin-top: 4rem;
  padding: 2rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--ion-color-dark);
}

.empty-state p {
  color: var(--ion-color-medium);
}
</style>
