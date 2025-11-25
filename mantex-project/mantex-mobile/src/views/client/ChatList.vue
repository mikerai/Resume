<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Chat</ion-title>
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

      <!-- Chat List -->
      <ion-list v-else-if="activeTickets.length > 0">
        <ion-item
          v-for="ticket in activeTickets"
          :key="ticket.id"
          button
          @click="openChat(ticket)"
          detail
        >
          <ion-avatar slot="start">
            <div class="avatar-placeholder">
              {{ getInitials(ticket.supplier?.company_name) }}
            </div>
          </ion-avatar>

          <ion-label>
            <h2>{{ ticket.title }}</h2>
            <p v-if="ticket.supplier">
              <ion-icon :icon="personOutline" size="small"></ion-icon>
              {{ ticket.supplier.company_name }}
            </p>
            <p class="ticket-number">{{ ticket.ticket_number }}</p>
          </ion-label>

          <div slot="end" class="chat-meta">
            <ion-chip :color="getStatusColor(ticket.status)" size="small">
              {{ translateStatus(ticket.status) }}
            </ion-chip>
          </div>
        </ion-item>
      </ion-list>

      <!-- Empty State -->
      <div v-else class="empty-state ion-text-center ion-padding">
        <ion-icon :icon="chatbubblesOutline" size="large" color="medium"></ion-icon>
        <h3>No hay conversaciones activas</h3>
        <p>Las conversaciones con tus proveedores aparecerán aquí</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonList, IonItem, IonLabel, IonAvatar, IonChip, IonSpinner
} from '@ionic/vue';
import { refreshOutline, personOutline, chatbubblesOutline } from 'ionicons/icons';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { translateStatus, getStatusColor } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading } = useClientTickets();

const activeTickets = ref([]);

const refreshData = async () => {
  const allTickets = await fetchTickets();
  activeTickets.value = allTickets.filter(t => 
    !['cancelled', 'closed'].includes(t.status) && t.supplier
  );
};

const openChat = (ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
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
  background: var(--ion-color-secondary);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 50%;
}

.ticket-number {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
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
