<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mis Trabajos</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="searchQuery" placeholder="Buscar trabajos..." @ionInput="handleSearch"></ion-searchbar>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="filterStatus" @ionChange="handleFilterChange">
          <ion-segment-button value="all">
            <ion-label>Todos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>Pendientes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En Curso</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Listos</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else>
        <ion-list v-if="filteredJobs.length > 0">
          <ion-card v-for="job in filteredJobs" :key="job.id" class="job-card">
            <ion-card-header>
              <div class="job-header-top">
                <ion-card-subtitle>{{ job.ticket_number }}</ion-card-subtitle>
                <ion-badge :color="getStatusColor(job.status)">{{ translateStatus(job.status) }}</ion-badge>
              </div>
              <ion-card-title>{{ job.title }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div class="job-detail-row">
                <ion-icon :icon="businessOutline" color="medium"></ion-icon>
                <span>{{ job.client?.company_name || 'Cliente Desconocido' }}</span>
              </div>
              
              <div class="job-detail-row">
                <ion-icon :icon="locationOutline" color="medium"></ion-icon>
                <span>{{ job.location_address || job.address || 'Sin dirección' }}</span>
              </div>

              <div class="job-detail-row">
                <ion-icon :icon="calendarOutline" color="medium"></ion-icon>
                <span>{{ formatDate(job.scheduled_date) }}</span>
              </div>

              <div class="job-detail-row" v-if="job.priority">
                <ion-icon :icon="alertCircleOutline" :color="getPriorityColor(job.priority)"></ion-icon>
                <span :class="'priority-' + job.priority">{{ translatePriority(job.priority) }}</span>
              </div>

              <div class="job-actions">
                <ion-button fill="outline" size="small" @click="openJobDetails(job)">
                  Ver Detalles
                </ion-button>
                <ion-button v-if="job.status === 'in_progress'" color="success" size="small" @click="completeJob(job)">
                  Finalizar
                </ion-button>
                <ion-button v-if="job.status === 'assigned' || job.status === 'pending'" color="primary" size="small" @click="startJob(job)">
                  Iniciar
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </ion-list>

        <div v-else class="empty-state">
          <ion-icon :icon="searchOutline" size="large"></ion-icon>
          <p>No se encontraron trabajos</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonChip, IonSearchbar, IonRefresher,
  IonRefresherContent, IonProgressBar, IonLoading, IonFab, IonFabButton,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/vue';
import {
  refreshOutline, funnelOutline, businessOutline, locationOutline,
  timeOutline, timerOutline, playOutline, checkmarkOutline, callOutline,
  navigateOutline, cameraOutline, constructOutline, addOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';

// Reactive data
const isLoading = ref(false);
const showFilters = ref(false);
const searchQuery = ref('');
const selectedStatus = ref('all');

// Firebase integration
let firebaseJobs = null;
const { user } = useAuth();

// Computed properties
const filteredJobs = computed(() => {
  if (!firebaseJobs) return [];

  let jobs = firebaseJobs.jobs.value;

  // Filter by status
  if (selectedStatus.value !== 'all') {
    jobs = jobs.filter(job => job.status === selectedStatus.value);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    jobs = jobs.filter(job =>
      job.title?.toLowerCase().includes(query) ||
      job.client_name?.toLowerCase().includes(query) ||
      job.address?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query)
    );
  }

  return jobs;
});

// Methods
const initializeFirebaseJobs = async () => {
  try {
    const { useFirebaseJobs } = await import('@/composables/useFirebaseJobs.js');
    firebaseJobs = useFirebaseJobs();

    // Get current technician ID from auth user
    const technicianId = user.value?.id || 'demo-technician-id';

    console.log('🔥 Starting Firebase jobs listener for technician:', technicianId);
    firebaseJobs.listenToTechnicianJobs(technicianId);

  } catch (error) {
    console.error('Error initializing Firebase jobs:', error);
  }
};

const refreshJobs = async () => {
  // Firebase jobs are real-time, but we can force refresh by re-initializing
  await initializeFirebaseJobs();
};

const handleRefresh = async (event) => {
  await refreshJobs();
  event.target.complete();
};

const filterJobs = (event) => {
  selectedStatus.value = event.detail.value;
};

const searchJobs = (event) => {
  searchQuery.value = event.detail.value;
};

const getJobPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'urgente': return 'danger';
    case 'alta': return 'warning';
    case 'media': return 'medium';
    case 'baja': return 'success';
    default: return 'primary';
  }
};

const getJobStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'warning';
    case 'pending': return 'medium';
    case 'cancelled': return 'danger';
    default: return 'medium';
  }
};

const getJobStatusText = (status) => {
  switch (status) {
    case 'completed': return 'Completado';
    case 'in_progress': return 'En Curso';
    case 'pending': return 'Pendiente';
    case 'cancelled': return 'Cancelado';
    default: return 'Desconocido';
  }
};

const getJobStatusClass = (status) => {
  return `job-status-${status}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const getEmptyStateMessage = () => {
  if (selectedStatus.value !== 'all') {
    return `No hay trabajos ${getJobStatusText(selectedStatus.value).toLowerCase()}`;
  }
  if (searchQuery.value.trim()) {
    return 'No se encontraron trabajos con ese criterio';
  }
  return 'No hay trabajos asignados';
};

// Action methods
const openJobDetail = (job) => {
  console.log('Open details for:', job.id);
  router.push(`/tickets/${job.id}`);
};

const startJob = async (job) => {
  if (!firebaseJobs) return;

  try {
    console.log('🚀 Starting job:', job.id);

    // Get current location for check-in
    const { useGeolocation } = await import('@/composables/useGeolocation.js');
    const { getCurrentPosition } = useGeolocation();

    let location = null;
    try {
      location = await getCurrentPosition();
    } catch (error) {
      console.warn('Could not get location for job start:', error);
    }

    const result = await firebaseJobs.startJob(job.id, location);

    if (result.success) {
      console.log('✅ Job started successfully');
    } else {
      console.error('❌ Failed to start job:', result.error);
    }

  } catch (error) {
    console.error('Error starting job:', error);
  }
};

const completeJob = async (job) => {
  if (!firebaseJobs) return;

  try {
    console.log('✅ Completing job:', job.id);

    const completionData = {
      technicianId: user.value?.id || 'demo-technician-id',
      notes: '',
      photos: []
    };

    const result = await firebaseJobs.completeJob(job.id, completionData);

    if (result.success) {
      console.log('✅ Job completed successfully');
    } else {
      console.error('❌ Failed to complete job:', result.error);
    }

  } catch (error) {
    console.error('Error completing job:', error);
  }
};

const callClient = (job) => {
  console.log('Calling client:', job.client_phone);
  // TODO: Implement phone call using Capacitor
  if (typeof window !== 'undefined') {
    window.open(`tel:${job.client_phone}`);
  }
};

const openMaps = async (job) => {
  console.log('Opening maps for:', job.address);
  try {
    const { useGoogleMaps } = await import('@/composables/useGoogleMaps.js');
    const { openNavigation } = useGoogleMaps();

    await openNavigation(job.address);
  } catch (error) {
    console.error('Error opening maps:', error);
    // Fallback to basic Google Maps
    const encodedAddress = encodeURIComponent(job.address);
    if (typeof window !== 'undefined') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    }
  }
};

const takeJobPhoto = async (job) => {
  if (!firebaseJobs) return;

  try {
    console.log('📸 Taking photo for job:', job.id);

    const { useCamera } = await import('@/composables/useCamera.js');
    const { takePhoto: capturePhoto, uploadPhoto } = useCamera();

    // Take the photo
    const photo = await capturePhoto({
      quality: 85,
      saveToGallery: false,
      allowEditing: true
    });

    console.log('📸 Photo captured for job:', job.id);

    // Upload to S3 with job context
    const supplierId = user.value?.supplierId || 'demo-supplier-id';
    const uploadResult = await uploadPhoto(photo, {
      jobId: job.id,
      supplierId,
      photoType: 'evidence',
      description: `Evidence photo for ${job.title}`
    });

    console.log('☁️ Photo uploaded:', uploadResult);

    // Save photo reference to Firebase
    const photoData = [{
      url: uploadResult.url,
      type: uploadResult.photoType,
      description: uploadResult.description,
      uploadedAt: new Date().toISOString()
    }];

    await firebaseJobs.saveJobPhotos(job.id, photoData);
    console.log('✅ Photo reference saved to Firebase');

  } catch (error) {
    console.error('Error taking job photo:', error);
  }
};

const createJobReport = () => {
  console.log('Creating new job report');
  // TODO: Navigate to job report creation
};

// Initialize data
onMounted(async () => {
  await initializeFirebaseJobs();
});

// Cleanup
onUnmounted(() => {
  if (firebaseJobs) {
    firebaseJobs.stopListening();
    console.log('🔥 Firebase jobs listener stopped');
  }
});
</script>

<style scoped>
.filter-container {
  padding: 0.5rem 1rem;
}

.jobs-container {
  padding: 1rem;
}

.job-card {
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.job-status-pending {
  border-left: 4px solid var(--ion-color-medium);
}

.job-status-in_progress {
  border-left: 4px solid var(--ion-color-warning);
}

.job-status-completed {
  border-left: 4px solid var(--ion-color-success);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.job-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.job-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.job-details {
  margin-bottom: 1rem;
}

.job-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.job-info ion-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.job-description {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: var(--ion-color-step-600);
  line-height: 1.4;
}

.job-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.progress-indicator {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ion-color-light);
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 1rem;
  color: var(--ion-color-medium);
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--ion-color-step-800);
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
