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
          <h1 class="mantex-gradient-text">Hola, {{ displayName }}</h1>
          <p class="mantex-text-secondary">Bienvenido a tu panel de control</p>
        </div>

        <!-- Active Service Status -->
        <div v-if="activeTickets.length > 0" class="active-service-section">
          <h3 class="mantex-text-light ion-margin-bottom">Servicios Activos</h3>
          <ion-card v-for="ticket in activeTickets" :key="ticket.id" class="mantex-card ion-margin-bottom"
            @click="viewTicketDetails(ticket)">
            <ion-card-header>
              <ion-card-subtitle class="mantex-text-accent">SERVICIO EN CURSO</ion-card-subtitle>
              <ion-card-title class="mantex-text-light">{{ ticket.title }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="status-badge">
                <ion-chip :color="getStatusColor(ticket.status)">
                  {{ translateStatus(ticket.status) }}
                </ion-chip>
                <ion-chip v-if="ticket.supplier" color="secondary" outline>
                  <ion-icon :icon="personCircleOutline"></ion-icon>
                  <ion-label>{{ ticket.supplier.company_name || ticket.supplier.contact_person }}</ion-label>
                </ion-chip>
              </div>
              <ion-progress-bar v-if="ticket.status === 'in_progress'" type="indeterminate"
                color="accent"></ion-progress-bar>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions" v-if="canCreateTicket">
          <button class="mantex-button-primary full-width" @click="navigateToCreateTicket">
            <ion-icon :icon="addCircleOutline" style="font-size: 1.2rem; margin-right: 8px;"></ion-icon>
            Solicitar Nuevo Servicio
          </button>

          <button class="mantex-button-secondary full-width ion-margin-top" @click="router.push('/client/scan')">
            <ion-icon :icon="scanOutline" style="font-size: 1.2rem; margin-right: 8px;"></ion-icon>
            Validar Técnico
          </button>
        </div>
        <div v-else class="permission-notice">
          <p class="mantex-text-secondary"><small>Solo usuarios autorizados pueden solicitar servicios.</small></p>
        </div>

        <!-- Recent History -->
        <div class="history-section">
          <h3 class="mantex-text-light">Historial Reciente</h3>
          <div v-if="recentTickets.length > 0" class="history-list">
            <div v-for="ticket in recentTickets" :key="ticket.id" class="history-item mantex-glass-card"
              @click="viewTicketDetails(ticket)">
              <div class="history-content">
                <h4 class="mantex-text-light">{{ ticket.title }}</h4>
                <p class="mantex-text-secondary">{{ formatDate(ticket.created_at) }}</p>
              </div>
              <div class="history-status">
                <span :class="'status-dot status-' + ticket.status"></span>
                <span class="status-text mantex-text-secondary">{{ translateStatus(ticket.status) }}</span>
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
  refreshOutline, personCircleOutline, addCircleOutline, scanOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { usePermissions } from '@/composables/usePermissions.js';
import { useAuth } from '@/composables/useAuth.js';
import { translateStatus, getStatusColor, formatDate } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading } = useClientTickets();
const { canCreateTicket } = usePermissions();
const { profile } = useAuth();

const tickets = ref([]);

// Homologated with Desktop Dashboard.vue logic
const activeTickets = computed(() => {
  // Active = NOT in ['closed', 'cancelled', 'paid'] (matches desktop)
  return tickets.value.filter(t => !['closed', 'cancelled', 'paid'].includes(t.status));
});

const recentTickets = computed(() => {
  // Recent = last 5 tickets, sorted by date
  return [...tickets.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
});

// Stats matching desktop Dashboard
const stats = computed(() => {
  const active = tickets.value.filter(t => !['closed', 'cancelled', 'paid'].includes(t.status)).length;
  const pendingApproval = tickets.value.filter(t => ['under_review', 'completed'].includes(t.status)).length;
  const total = tickets.value.length;
  return { active, pendingApproval, total };
});

const displayName = computed(() => {
  if (!profile.value) return 'Cliente';

  // Try to build full name from profile fields
  const firstName = profile.value.first_name;
  const lastName = profile.value.last_name;
  const secondLastName = profile.value.second_last_name;

  if (firstName || lastName || secondLastName) {
    return [firstName, lastName, secondLastName].filter(Boolean).join(' ');
  }

  // Fallback to company name if available
  if (profile.value.company_name) {
    return profile.value.company_name;
  }

  // Final fallback
  return 'Cliente';
});

const loadData = async () => {
  tickets.value = await fetchTickets();
};

const refreshData = async () => {
  await loadData();
};

const navigateToCreateTicket = () => {
  router.push('/client/create-ticket');
};

const viewTicketDetails = (ticket) => {
  router.push(`/client/tickets/${ticket.id}`);
};

// Translation functions now imported from @/utils/status-utils.js
// Using translateStatus as getStatusText

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

.status-dot.status-pending {
  background-color: var(--mantex-warning);
}

.status-dot.status-in_progress {
  background-color: var(--mantex-accent);
}

.status-dot.status-completed {
  background-color: var(--mantex-success);
}

.status-dot.status-cancelled {
  background-color: var(--mantex-danger);
}

.status-text {
  font-size: 0.85rem;
}

/* Chips customization for dark theme */
ion-chip {
  --background: rgba(255, 255, 255, 0.1);
  --color: var(--mantex-light);
}

ion-chip.status-pending {
  --color: var(--mantex-warning);
}

ion-chip.status-in_progress {
  --color: var(--mantex-accent);
}

ion-chip.status-completed {
  --color: var(--mantex-success);
}
</style>
