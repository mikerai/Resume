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
                <h3>{{ pendingJobs }}</h3>
                <p>Trabajos Pendientes</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="stat-item">
              <ion-icon :icon="checkmarkCircleOutline" class="stat-icon completed"></ion-icon>
              <div class="stat-text">
                <h3>{{ completedToday }}</h3>
                <p>Completados Hoy</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <div class="stat-item">
              <ion-icon :icon="timeOutline" class="stat-icon urgent"></ion-icon>
              <div class="stat-text">
                <h3>{{ urgentJobs }}</h3>
                <p>Urgentes</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Next Jobs -->
      <div class="section">
        <h2 class="text-heading">Próximos Trabajos</h2>
        <ion-card v-for="job in nextJobs" :key="job.id" class="job-card" @click="openJob(job)">
          <ion-card-content>
            <div class="job-header">
              <h3>{{ job.title }}</h3>
              <ion-chip :color="getJobPriorityColor(job.priority)">
                {{ job.priority }}
              </ion-chip>
            </div>
            <p class="job-address">{{ job.address }}</p>
            <div class="job-footer">
              <div class="job-time">
                <ion-icon :icon="timeOutline"></ion-icon>
                {{ job.scheduled_time }}
              </div>
              <div class="job-distance">
                <ion-icon :icon="locationOutline"></ion-icon>
                {{ job.distance }}
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

      <!-- Loading -->
      <ion-loading :is-open="isLoading" message="Cargando datos..."></ion-loading>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonIcon, IonButton, IonButtons, IonChip, IonLoading
} from '@ionic/vue';
import {
  constructOutline, checkmarkCircleOutline, timeOutline, locationOutline,
  refreshOutline, warningOutline, cameraOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';

// Reactive data
const isLoading = ref(false);
const pendingJobs = ref(0);
const completedToday = ref(0);
const urgentJobs = ref(0);
const nextJobs = ref([]);

const { user } = useAuth();

// Methods
const refreshData = async () => {
  isLoading.value = true;
  try {
    // Connect to Firebase for real data
    const { useFirebaseJobs } = await import('@/composables/useFirebaseJobs.js');
    const { jobs, getJobsStats, nextJobs: firebaseNextJobs } = useFirebaseJobs();

    // Get current technician ID from user profile - skip if not available yet
    if (!user.value?.id) {
      console.log('⚠️ User ID not available yet, skipping job subscription');
      isLoading.value = false;
      return;
    }

    const technicianId = user.value.id;

    // Listen to real jobs from Firebase
    // TODO: Implement listenToTechnicianJobs(technicianId);

    // For now, simulate with realistic data structure
    const stats = {
      pending: 8,
      completed: 3,
      urgent: 2
    };

    pendingJobs.value = stats.pending;
    completedToday.value = stats.completed;
    urgentJobs.value = stats.urgent;

    // Mock next jobs with Firebase structure
    nextJobs.value = [
      {
        id: 'job_001',
        title: 'Mantenimiento HVAC - Torre Corporativa',
        client_name: 'Corporativo Los Arcos',
        address: 'Av. Insurgentes Sur 123, Col. Roma Norte',
        priority: 'Alta',
        scheduled_date: '2024-01-15',
        scheduled_time: '10:30 AM',
        status: 'pending',
        distance: '2.3 km'
      },
      {
        id: 'job_002',
        title: 'Instalación Sistema Eléctrico',
        client_name: 'Oficinas Premium',
        address: 'Calle Madero 456, Centro Histórico',
        priority: 'Media',
        scheduled_date: '2024-01-15',
        scheduled_time: '2:00 PM',
        status: 'pending',
        distance: '5.1 km'
      },
      {
        id: 'job_003',
        title: 'Reparación Urgente Fontanería',
        client_name: 'Residencial Vista Hermosa',
        address: 'Col. Condesa, Calle Amsterdam 789',
        priority: 'Urgente',
        scheduled_date: '2024-01-15',
        scheduled_time: '4:30 PM',
        status: 'pending',
        distance: '3.7 km'
      }
    ];

    console.log('✅ Dashboard data loaded with Firebase structure');

  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    // Asegurar que el loading se quite en el siguiente ciclo de render
    setTimeout(() => {
      isLoading.value = false;
      console.log('🔓 Loading overlay ocultado');
    }, 100);
  }
};

const getJobPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'urgente': return 'danger';
    case 'alta': return 'warning';
    case 'media': return 'medium';
    default: return 'primary';
  }
};

const openJob = (job) => {
  console.log('Opening job:', job);
  // TODO: Navigate to job details
};

const checkIn = async () => {
  console.log('Check-in requested');
  try {
    const { useGeolocation } = await import('@/composables/useGeolocation.js');
    const { getCurrentPosition } = useGeolocation();

    // Get current location
    const position = await getCurrentPosition();

    console.log('📍 Current position:', position);
    console.log('✅ Check-in successful at location');

    // TODO: Send check-in to backend
    // TODO: Show success message

  } catch (error) {
    console.error('Error during check-in:', error);
    // TODO: Show error toast
  }
};

const reportIssue = () => {
  console.log('Report issue requested');
  // TODO: Navigate to issue reporting
};

const takePhoto = async () => {
  console.log('Take photo requested');
  try {
    const { useCamera } = await import('@/composables/useCamera.js');
    const { takePhoto: capturePhoto } = useCamera();

    const photo = await capturePhoto({
      quality: 80,
      saveToGallery: true
    });

    console.log('📸 Photo captured:', photo);
    // TODO: Handle photo (save, upload, show preview)

  } catch (error) {
    console.error('Error taking photo:', error);
    // TODO: Show error toast
  }
};

// Initialize data on mount
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  font-size: 2rem;
  min-width: 2rem;
}

.stat-icon.pending {
  color: var(--ion-color-warning);
}

.stat-icon.completed {
  color: var(--ion-color-success);
}

.stat-icon.urgent {
  color: var(--ion-color-danger);
}

.stat-text h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-text p {
  margin: 0;
  font-size: 0.85rem;
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
}

.job-time, .job-distance {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.job-time ion-icon,
.job-distance ion-icon {
  font-size: 1rem;
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

.empty-state ion-icon {
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}
</style>
