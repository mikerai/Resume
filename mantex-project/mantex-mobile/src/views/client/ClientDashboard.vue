<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mis Servicios</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding mantex-bg">
      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner color="accent"></ion-spinner>
        <p class="mantex-text-secondary">Cargando servicios...</p>
      </div>

      <div v-else>
        <!-- Welcome Header -->
        <div class="welcome-header ion-margin-bottom">
          <h1 class="mantex-gradient-text">Hola, Cliente</h1>
          <p class="mantex-text-secondary">Bienvenido a tu panel de control</p>
        </div>

        <!-- Active Service Status -->
        <div v-if="activeTicket" class="active-service-section">
          <ion-card class="mantex-card">
            <ion-card-header>
              <ion-card-subtitle class="mantex-text-accent">SERVICIO EN CURSO</ion-card-subtitle>
              <ion-card-title class="mantex-text-light">{{ activeTicket.title }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="status-badge">
                <ion-chip :class="'status-' + activeTicket.status">
                  {{ getStatusText(activeTicket.status) }}
                </ion-chip>
              </div>
              <p class="technician-info mantex-text-secondary" v-if="activeTicket.supplier">
                <ion-icon :icon="personCircleOutline" color="secondary"></ion-icon>
                Técnico: <span class="mantex-text-light">{{ activeTicket.supplier.company_name }}</span>
              </p>
              <ion-progress-bar v-if="activeTicket.status === 'in_progress'" type="indeterminate" color="accent"></ion-progress-bar>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions" v-if="canCreateTicket">
          <button class="mantex-button-primary full-width" @click="navigateToCreateTicket">
            <ion-icon :icon="addCircleOutline" style="font-size: 1.2rem; margin-right: 8px;"></ion-icon>
            Solicitar Nuevo Servicio
          </button>
        </div>
        <div v-else class="permission-notice">
          <p class="mantex-text-secondary"><small>Solo usuarios autorizados pueden solicitar servicios.</small></p>
        </div>

        <!-- Recent History -->
        <div class="history-section">
          <h3 class="mantex-text-light">Historial Reciente</h3>
          <div v-if="recentTickets.length > 0" class="history-list">
            <div v-for="ticket in recentTickets" :key="ticket.id" class="history-item mantex-glass-card" @click="viewTicketDetails(ticket)">
              <div class="history-content">
                <h4 class="mantex-text-light">{{ ticket.title }}</h4>
                <p class="mantex-text-secondary">{{ formatDate(ticket.created_at) }}</p>
              </div>
              <div class="history-status">
                <span :class="'status-dot status-' + ticket.status"></span>
                <span class="status-text mantex-text-secondary">{{ getStatusText(ticket.status) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p class="mantex-text-secondary">No hay servicios recientes.</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonChip,
  IonProgressBar, IonSpinner
} from '@ionic/vue';
import { 
  refreshOutline, personCircleOutline, addCircleOutline 
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { usePermissions } from '@/composables/usePermissions.js';

const router = useRouter();
const { fetchTickets, loading } = useClientTickets();
const { canCreateTicket } = usePermissions();

const tickets = ref([]);

const activeTicket = computed(() => {
  return tickets.value.find(t => ['pending', 'in_progress', 'assigned'].includes(t.status));
});

const recentTickets = computed(() => {
  return tickets.value.filter(t => !['pending', 'in_progress', 'assigned'].includes(t.status));
});

const loadData = async () => {
  tickets.value = await fetchTickets();
};

const refreshData = () => {
  loadData();
};

const navigateToCreateTicket = () => {
  router.push('/client/create-ticket');
};

const viewTicketDetails = (ticket) => {
  router.push(`/tickets/${ticket.id}`);
};

const getStatusText = (status) => {
  const map = {
    'pending': 'Pendiente',
    'in_progress': 'En Curso',
    'completed': 'Completado',
    'cancelled': 'Cancelado',
    'assigned': 'Asignado'
  };
  return map[status] || status;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* Scoped overrides or specific layout adjustments */
.welcome-header h1 {
  margin-bottom: 4px;
  font-size: 2rem;
}

.active-service-section {
  margin-bottom: 24px;
}

.quick-actions {
  margin-bottom: 32px;
}

.full-width {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.history-item:active {
  transform: scale(0.98);
}

.history-content h4 {
  margin: 0 0 4px 0;
  font-weight: 600;
}

.history-content p {
  margin: 0;
  font-size: 0.9rem;
}

.history-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.status-pending { background-color: var(--mantex-warning); }
.status-dot.status-in_progress { background-color: var(--mantex-accent); }
.status-dot.status-completed { background-color: var(--mantex-success); }
.status-dot.status-cancelled { background-color: var(--mantex-danger); }

.status-text {
  font-size: 0.85rem;
}

/* Chips customization for dark theme */
ion-chip {
  --background: rgba(255, 255, 255, 0.1);
  --color: var(--mantex-light);
}
ion-chip.status-pending { --color: var(--mantex-warning); }
ion-chip.status-in_progress { --color: var(--mantex-accent); }
ion-chip.status-completed { --color: var(--mantex-success); }
</style>
