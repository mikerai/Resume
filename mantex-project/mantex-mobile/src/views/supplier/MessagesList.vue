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
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner color="primary"></ion-spinner>
        <p class="ion-margin-top">Cargando conversaciones...</p>
      </div>

      <!-- Messages List -->
      <ion-list v-else-if="ticketsWithChats.length > 0">
        <ion-item
          v-for="ticket in ticketsWithChats"
          :key="ticket.id"
          button
          @click="openTicketChat(ticket)"
          detail
        >
          <ion-avatar slot="start">
            <div class="avatar-placeholder">
              {{ getInitials(ticket.client?.company_name) }}
            </div>
          </ion-avatar>

          <ion-label>
            <h2>{{ ticket.title }}</h2>
            <p>
              <ion-icon :icon="businessOutline" size="small"></ion-icon>
              {{ ticket.client?.company_name || 'Cliente' }}
            </p>
            <p class="last-message" v-if="ticket.last_message">
              {{ truncate(ticket.last_message, 50) }}
            </p>
          </ion-label>

          <div slot="end" class="chat-meta">
            <ion-chip :color="getStatusColor(ticket.status)" size="small">
              {{ translateStatus(ticket.status) }}
            </ion-chip>
            <ion-badge v-if="ticket.unread_count > 0" color="danger">
              {{ ticket.unread_count }}
            </ion-badge>
          </div>
        </ion-item>
      </ion-list>

      <!-- Empty State -->
      <div v-else class="empty-state ion-text-center ion-padding">
        <ion-icon :icon="chatbubblesOutline" size="large" color="medium"></ion-icon>
        <h3>No hay conversaciones</h3>
        <p>Las conversaciones de tus tickets aparecerán aquí</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonList, IonItem, IonLabel, IonAvatar, IonChip, IonBadge, IonSpinner
} from '@ionic/vue';
import {
  refreshOutline, businessOutline, chatbubblesOutline
} from 'ionicons/icons';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets.js';
import { translateStatus, getStatusColor } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading } = useTechnicianTickets();

const ticketsWithChats = ref([]);

const refreshData = async () => {
  const allTickets = await fetchTickets();
  
  // Filter to only show tickets that are active (not cancelled or closed)
  // and likely to have conversations
  ticketsWithChats.value = allTickets.filter(t => 
    !['cancelled', 'closed'].includes(t.status) &&
    ['in_progress', 'under_review', 'revision_requested', 'completed', 'approved'].includes(t.status)
  );
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

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 50%;
}

.last-message {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.empty-state {
  margin-top: 4rem;
}

.empty-state ion-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--ion-color-medium);
}

ion-item p ion-icon {
  margin-right: 0.25rem;
  vertical-align: middle;
}
</style>
