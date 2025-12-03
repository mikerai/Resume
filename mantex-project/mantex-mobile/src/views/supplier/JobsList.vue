<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Trabajos</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Status Filter Tabs -->
      <ion-toolbar>
        <ion-segment v-model="selectedFilter" @ionChange="filterJobs" scrollable>
          <ion-segment-button value="marketplace">
            <ion-label>Todos ({{ jobCounts.marketplace }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="my_jobs">
            <ion-label>Mis Trabajos ({{ jobCounts.myJobs }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En Progreso ({{ jobCounts.inProgress }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completados ({{ jobCounts.completed }})</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner color="primary"></ion-spinner>
        <p class="ion-margin-top">Cargando trabajos...</p>
      </div>

      <!-- Jobs List -->
      <div v-else>
        <!-- Search Bar -->
        <ion-searchbar v-model="searchQuery" placeholder="Buscar por título, cliente o ubicación"
          @ionInput="searchJobs"></ion-searchbar>

        <!-- Jobs Cards -->
        <div v-if="filteredJobs.length > 0">
          <ion-card v-for="job in filteredJobs" :key="job.id" class="job-card" @click="openJobDetail(job)">
            <ion-card-header>
              <div class="card-header-content">
                <ion-card-subtitle>{{ job.ticket_number }}</ion-card-subtitle>
                <ion-chip :color="getStatusColor(job.status)">
                  {{ translateStatus(job.status) }}
                </ion-chip>
              </div>
              <ion-card-title>{{ job.title }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div class="job-details">
                <!-- Client Info -->
                <div class="detail-row" v-if="job.client">
                  <ion-icon :icon="businessOutline" color="medium"></ion-icon>
                  <span>{{ job.client.company_name || 'Cliente' }}</span>
                </div>

                <!-- Location -->
                <div class="detail-row">
                  <ion-icon :icon="locationOutline" color="medium"></ion-icon>
                  <span>{{ job.location_city }}, {{ job.location_state }}</span>
                </div>

                <!-- Scheduled Date -->
                <div class="detail-row" v-if="job.scheduled_date">
                  <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
                  <span>{{ formatDate(job.scheduled_date) }}</span>
                </div>

                <!-- Priority -->
                <div class="detail-row">
                  <ion-icon :icon="flagOutline" color="medium"></ion-icon>
                  <ion-chip :color="getPriorityColor(job.priority)" size="small">
                    {{ translatePriority(job.priority) }}
                  </ion-chip>
                </div>

                <!-- Price (Only if assigned or approved) -->
                <div class="detail-row" v-if="job.estimated_cost">
                  <ion-icon :icon="cashOutline" color="medium"></ion-icon>
                  <span class="text-green-600 font-bold">${{ formatCurrency(job.estimated_cost) }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state ion-text-center ion-padding">
          <ion-icon :icon="briefcaseOutline" size="large" color="medium"></ion-icon>
          <h3>No hay trabajos</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>
      </div>

      <!-- FAB for Refresh (optional) -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="refreshData">
          <ion-icon :icon="refreshOutline"></ion-icon>
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
  refreshOutline, businessOutline, locationOutline, calendarOutline,
  flagOutline, briefcaseOutline, cashOutline
} from 'ionicons/icons';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets.js';
import { useAuth } from '@/composables/useAuth.js';
import { translateStatus, translatePriority, getPriorityColor, getStatusColor, formatDate } from '@/utils/status-utils.js';

const router = useRouter();
const { fetchTickets, loading, supplierId } = useTechnicianTickets();
const { user } = useAuth();

const jobs = ref([]);
const selectedFilter = ref('marketplace'); // Changed default filter to marketplace
const searchQuery = ref('');

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value).replace('MX$', '');
};

const jobCounts = computed(() => {
  const allJobs = jobs.value;
  const currentSupplierId = supplierId.value;

  // "Todos": ALL tickets in the system
  const marketplace = allJobs.length;

  // "Mis Trabajos": Tickets assigned to this user (Any status)
  const myJobs = allJobs.filter(j => j.supplier_id === currentSupplierId).length;

  // "En Progreso": Assigned to me AND status is 'in_progress'
  const inProgress = allJobs.filter(j => j.supplier_id === currentSupplierId && j.status === 'in_progress').length;

  // "Completados": Assigned to me AND status is 'completed'
  const completed = allJobs.filter(j => j.supplier_id === currentSupplierId && j.status === 'completed').length;

  return {
    marketplace,
    myJobs,
    inProgress,
    completed
  };
});

const filteredJobs = computed(() => {
  let result = jobs.value;
  const currentSupplierId = supplierId.value;

  // Filter by status
  if (selectedFilter.value === 'marketplace') {
    // "Todos" = ALL tickets (no filter)
    result = jobs.value;
  } else if (selectedFilter.value === 'my_jobs') {
    // "Mis Trabajos" = Assigned to me
    result = result.filter(j => j.supplier_id === currentSupplierId);
  } else if (selectedFilter.value === 'in_progress') {
    // "En Progreso" = Assigned to me AND In Progress
    result = result.filter(j => j.supplier_id === currentSupplierId && j.status === 'in_progress');
  } else if (selectedFilter.value === 'completed') {
    // "Completados" = Assigned to me AND Completed
    result = result.filter(j => j.supplier_id === currentSupplierId && j.status === 'completed');
  }
  // Fallback or 'all' if it existed would be here, but we are using strict tabs now.


  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(j =>
      j.title?.toLowerCase().includes(query) ||
      j.ticket_number?.toLowerCase().includes(query) ||
      j.location_city?.toLowerCase().includes(query) ||
      j.location_state?.toLowerCase().includes(query) ||
      j.client?.company_name?.toLowerCase().includes(query)
    );
  }

  // Sort by created date (newest first)
  return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

const refreshData = async () => {
  jobs.value = await fetchTickets();
};

const filterJobs = () => {
  // Reactive computed handles this
};

const searchJobs = () => {
  // Reactive computed handles this
};

const openJobDetail = (job) => {
  router.push(`/tickets/${job.id}`);
};

const getEmptyStateMessage = () => {
  if (searchQuery.value) {
    return `No se encontraron trabajos que coincidan con "${searchQuery.value}"`;
  }

  switch (selectedFilter.value) {
    case 'pending':
      return 'No hay trabajos pendientes en este momento';
    case 'in_progress':
      return 'No hay trabajos en curso';
    case 'completed':
      return 'No hay trabajos completados';
    default:
      return 'No tienes trabajos asignados';
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.job-card {
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.job-details {
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
  font-size: 1.1rem;
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
