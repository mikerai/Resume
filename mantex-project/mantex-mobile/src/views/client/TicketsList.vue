<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mis Tickets</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Filter Tabs -->
      <ion-toolbar>
        <ion-segment v-model="selectedFilter" @ionChange="filterTickets">
          <ion-segment-button value="active">
            <ion-label>Activos ({{ ticketCounts.active }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completados ({{ ticketCounts.completed }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="all">
            <ion-label>Todos ({{ ticketCounts.all }})</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner color="primary"></ion-spinner>
        <p class="ion-margin-top">Cargando tickets...</p>
      </div>

      <!-- Tickets List -->
      <div v-else>
        <!-- Search Bar -->
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Buscar por título o ubicación"
          @ionInput="searchTickets"
        ></ion-searchbar>

        <!-- Tickets Cards -->
        <div v-if="filteredTickets.length > 0">
          <ion-card
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            class="ticket-card"
            @click="openTicketDetail(ticket)"
          >
            <ion-card-header>
              <div class="card-header-content">
                <ion-card-subtitle>{{ ticket.ticket_number }}</ion-card-subtitle>
                <ion-chip :color="getStatusColor(ticket.status)">
                  {{ translateStatus(ticket.status) }}
                </ion-chip>
              </div>
              <ion-card-title>{{ ticket.title }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div class="ticket-details">
                <!-- Supplier Info -->
                <div class="detail-row" v-if="ticket.supplier">
                  <ion-icon :icon="personOutline" color="medium"></ion-icon>
                  <span>{{ ticket.supplier.company_name || 'Proveedor Asignado' }}</span>
                </div>

                <!-- Location -->
                <div class="detail-row">
                  <ion-icon :icon="locationOutline" color="medium"></ion-icon>
                  <span>{{ ticket.location_city }}, {{ ticket.location_state }}</span>
                </div>

                <!-- Scheduled Date -->
                <div class="detail-row" v-if="ticket.scheduled_date">
                  <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
                  <span>{{ formatDate(ticket.scheduled_date) }}</span>
                </div>

                <!-- Priority -->
                <div class="detail-row">
                  <ion-chip :color="getPriorityColor(ticket.priority)" size="small">
                    Prioridad: {{ translatePriority(ticket.priority) }}
                  </ion-chip>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state ion-text-center ion-padding">
          <ion-icon :icon="listOutline" size="large" color="medium"></ion-icon>
          <h3>No hay tickets</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>
      </div>

      <!-- FAB for Create Ticket -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createTicket" color="secondary">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSearchbar, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonCardContent, IonChip, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
  IonFab, IonFabButton
} from '@ionic/vue';
import {
  refreshOutline, personOutline, locationOutline, calendarOutline,
  listOutline, addOutline
} from 'ionicons/icons';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { translateStatus, translatePriority, getPriorityColor, getStatusColor, formatDate } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading } = useClientTickets();

const tickets = ref([]);
const selectedFilter = ref('active');
const searchQuery = ref('');

const ticketCounts = computed(() => ({
  all: tickets.value.length,
  active: tickets.value.filter(t => !['closed', 'cancelled', 'paid'].includes(t.status)).length,
  completed: tickets.value.filter(t => ['completed', 'approved', 'ready_for_payment', 'paid', 'closed'].includes(t.status)).length
}));

const filteredTickets = computed(() => {
  let result = tickets.value;

  // Filter by status
  if (selectedFilter.value === 'active') {
    result = result.filter(t => !['closed', 'cancelled', 'paid'].includes(t.status));
  } else if (selectedFilter.value === 'completed') {
    result = result.filter(t => ['completed', 'approved', 'ready_for_payment', 'paid', 'closed'].includes(t.status));
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.ticket_number?.toLowerCase().includes(query) ||
      t.location_city?.toLowerCase().includes(query) ||
      t.location_state?.toLowerCase().includes(query)
    );
  }

  // Sort by created date (newest first)
  return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const refreshData = async () => {
  tickets.value = await fetchTickets();
};

const filterTickets = () => {
  // Reactive computed handles this
};

const searchTickets = () => {
  // Reactive computed handles this
};

const openTicketDetail = (ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

const createTicket = () => {
  router.push('/client/create-ticket');
};

const getEmptyStateMessage = () => {
  if (searchQuery.value) {
    return `No se encontraron tickets que coincidan con "${searchQuery.value}"`;
  }
  
  switch (selectedFilter.value) {
    case 'active':
      return 'No hay tickets activos en este momento';
    case 'completed':
      return 'No hay tickets completados';
    default:
      return 'No tienes tickets registrados. Crea tu primer ticket usando el botón +';
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.ticket-card {
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.ticket-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.detail-row ion-icon {
  font-size:  1.1rem;
}

.detail-row ion-chip {
  margin: 0;
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
</style>
