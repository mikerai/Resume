<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title class="text-heading">Dashboard Técnico</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Stats Cards -->
      <div class="stats-container">
        <ion-card>
          <ion-card-content>
            <div class="stat-item">
              <ion-icon :icon="constructOutline" class="stat-icon pending"></ion-icon>
              <div class="stat-text">
                <h3>{{ stats.pending }}</h3>
                <p>Pendientes</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="stat-item">
              <ion-icon :icon="checkmarkCircleOutline" class="stat-icon completed"></ion-icon>
              <div class="stat-text">
                <h3>{{ stats.completed }}</h3>
                <p>Completados</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="stat-item">
              <ion-icon :icon="timeOutline" class="stat-icon urgent"></ion-icon>
              <div class="stat-text">
                <h3>{{ stats.urgent }}</h3>
                <p>Urgentes</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Next Jobs -->
      <div class="section">
        <h2 class="text-heading">Próximos Trabajos</h2>
        
        <div v-if="loading" class="ion-text-center ion-padding">
          <ion-spinner></ion-spinner>
        </div>

        <div v-else>
          <ion-card v-for="job in nextJobs" :key="job.id" class="job-card" @click="openJob(job)">
            <ion-card-content>
              <div class="job-header">
                <h3>{{ job.title }}</h3>
                <ion-chip :color="getJobPriorityColor(job.priority)">
                  {{ translatePriority(job.priority) }}
                </ion-chip>
              </div>
              <p class="job-client" v-if="job.client">
                <ion-icon :icon="businessOutline"></ion-icon> {{ job.client.company_name }}
              </p>
              <p class="job-address">{{ job.location_address || job.address }}</p>
              <div class="job-footer">
                <div class="job-time">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  {{ formatDate(job.scheduled_date) }}
                </div>
                <div class="job-status">
                  <ion-badge :color="getStatusColor(job.status)">{{ translateStatus(job.status) }}</ion-badge>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card v-if="nextJobs.length === 0">
            <ion-card-content class="empty-state">
              <ion-icon :icon="constructOutline" size="large"></ion-icon>
              <p>No hay trabajos programados</p>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2 class="text-heading">Acciones Rápidas</h2>
        <div class="quick-actions">
          <ion-button expand="block" fill="outline" @click="checkIn">
            <ion-icon :icon="locationOutline" slot="start"></ion-icon>
            Check-in en Ubicación
          </ion-button>

          <ion-button expand="block" fill="outline" @click="reportIssue">
            <ion-icon :icon="warningOutline" slot="start"></ion-icon>
            Reportar Problema
          </ion-button>

          <ion-button expand="block" fill="outline" @click="takePhoto">
            <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
            Tomar Evidencia
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonIcon, IonButton, IonButtons, IonChip, IonSpinner, IonBadge
} from '@ionic/vue';
import {
  constructOutline, checkmarkCircleOutline, timeOutline, locationOutline,
  refreshOutline, warningOutline, cameraOutline, businessOutline, calendarOutline
} from 'ionicons/icons';
import { useTechnicianTickets } from '@/composables/useTechnicianTickets.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const { fetchTickets, stats, nextJobs, loading } = useTechnicianTickets();

const refreshData = async () => {
  await fetchTickets();
};

const getJobPriorityColor = (priority) => {
  const p = priority?.toLowerCase() || '';
  if (p === 'high' || p === 'urgente') return 'danger';
  if (p === 'medium' || p === 'media') return 'warning';
  return 'success';
};

const getStatusColor = (status) => {
  const map = {
    'pending': 'warning',
    'assigned': 'secondary',
    'in_progress': 'primary',
    'completed': 'success'
  };
  return map[status] || 'medium';
};

const translatePriority = (priority) => {
  const map = { 'high': 'Alta', 'medium': 'Media', 'low': 'Baja' };
  return map[priority] || priority;
};

const translateStatus = (status) => {
  const map = { 
    'pending': 'Pendiente', 
    'assigned': 'Asignado',
    'in_progress': 'En Curso', 
    'completed': 'Completado' 
  };
  return map[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

const openJob = (job) => {
  console.log('Opening job:', job);
  router.push(`/tickets/${job.id}`);
};

// Placeholder actions
const checkIn = () => console.log('Check-in clicked');
const reportIssue = () => console.log('Report issue clicked');
const takePhoto = () => console.log('Take photo clicked');

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.8rem;
}

.stat-icon.pending { color: var(--ion-color-warning); }
.stat-icon.completed { color: var(--ion-color-success); }
.stat-icon.urgent { color: var(--ion-color-danger); }

.stat-text h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.stat-text p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.section {
  padding: 1rem;
}

.section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.job-card {
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.job-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
  margin-right: 0.5rem;
}

.job-client {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ion-color-dark);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.job-address {
  margin: 0 0 0.75rem 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  border-top: 1px solid var(--ion-color-light);
  padding-top: 0.5rem;
}

.job-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}
</style>
