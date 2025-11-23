<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Perfil</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="showSettings = !showSettings">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-container">
          <ion-avatar>
            <img :src="profileAvatar" alt="Avatar" @error="useDefaultAvatar" />
          </ion-avatar>
          <ion-button fill="clear" size="small" @click="changeAvatar">
            <ion-icon :icon="cameraOutline"></ion-icon>
          </ion-button>
        </div>

        <div class="profile-info">
          <h2>{{ profile.username || 'Técnico' }}</h2>
          <p class="profile-role">{{ getRoleText(profile.role) }}</p>
          <p class="profile-email">{{ user?.email }}</p>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number">{{ stats.completedJobs }}</span>
            <span class="stat-label">Trabajos Completados</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.totalHours }}</span>
            <span class="stat-label">Horas Trabajadas</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ stats.rating }}</span>
            <span class="stat-label">Calificación</span>
          </div>
        </div>
      </div>

      <!-- Profile Actions -->
      <div class="profile-actions">
        <ion-list>
          <!-- Personal Information -->
          <ion-list-header>
            <ion-label>Información Personal</ion-label>
          </ion-list-header>

          <ion-item button @click="editProfile">
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Editar Perfil</h3>
              <p>Actualizar información personal</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item button @click="changePassword">
            <ion-icon :icon="keyOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Cambiar Contraseña</h3>
              <p>Actualizar credenciales de acceso</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <!-- Work Information -->
          <ion-list-header>
            <ion-label>Trabajo</ion-label>
          </ion-list-header>

          <ion-item button @click="viewWorkHistory">
            <ion-icon :icon="constructOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Historial de Trabajos</h3>
              <p>Ver trabajos completados</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item button @click="viewSchedule">
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Mi Calendario</h3>
              <p>Ver horarios y citas</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item button @click="viewPayments">
            <ion-icon :icon="cardOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Pagos y Facturas</h3>
              <p>Historial de pagos</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <!-- App Settings -->
          <ion-list-header>
            <ion-label>Configuración</ion-label>
          </ion-list-header>

          <ion-item button @click="toggleNotifications">
            <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Notificaciones</h3>
              <p>{{ notificationsEnabled ? 'Activadas' : 'Desactivadas' }}</p>
            </ion-label>
            <ion-toggle :checked="notificationsEnabled" @ionChange="updateNotifications"></ion-toggle>
          </ion-item>

          <ion-item button @click="toggleLocation">
            <ion-icon :icon="locationOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Ubicación</h3>
              <p>{{ locationEnabled ? 'Activada' : 'Desactivada' }}</p>
            </ion-label>
            <ion-toggle :checked="locationEnabled" @ionChange="updateLocation"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon :icon="colorPaletteOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Tema</h3>
            </ion-label>
            <ion-select
              :value="selectedTheme"
              @ionChange="updateTheme"
              interface="popover"
              placeholder="Seleccionar tema"
            >
              <ion-select-option value="light">Claro</ion-select-option>
              <ion-select-option value="dark">Oscuro</ion-select-option>
              <ion-select-option value="auto">Automático</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Development/Testing -->
          <ion-list-header>
            <ion-label>Desarrollo</ion-label>
          </ion-list-header>

          <!-- Flynn Console -->
          <ion-item v-if="isFlynn" button @click="toggleFlynnMode">
            <ion-icon :icon="bugOutline" slot="start" color="danger"></ion-icon>
            <ion-label>
              <h3>Flynn Console</h3>
              <p>Modo actual: {{ currentGridMode }}</p>
            </ion-label>
          </ion-item>

          <ion-item button @click="testNotifications">
            <ion-icon :icon="notificationsOutline" slot="start" color="warning"></ion-icon>
            <ion-label>
              <h3>Probar Notificaciones</h3>
              <p>Simular notificaciones push</p>
            </ion-label>
            <ion-badge v-if="isTestingNotifications" color="warning" slot="end">
              Probando...
            </ion-badge>
          </ion-item>

          <!-- Support -->
          <ion-list-header>
            <ion-label>Soporte</ion-label>
          </ion-list-header>

          <ion-item button @click="contactSupport">
            <ion-icon :icon="helpCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Ayuda y Soporte</h3>
              <p>Contactar soporte técnico</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <ion-item>
            <ion-icon :icon="contrastOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Tema</h3>
              <p>{{ currentTheme }}</p>
            </ion-label>
            <ion-select
              v-model="selectedTheme"
              @selectionChange="changeTheme"
              interface="action-sheet"
              slot="end"
            >
              <ion-select-option value="auto">Automático</ion-select-option>
              <ion-select-option value="light">Claro</ion-select-option>
              <ion-select-option value="dark">Oscuro</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item button @click="viewAbout">
            <ion-icon :icon="informationCircleOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Acerca de</h3>
              <p>Versión de la aplicación</p>
            </ion-label>
            <ion-icon :icon="chevronForwardOutline" slot="end"></ion-icon>
          </ion-item>

          <!-- Logout -->
          <ion-list-header>
            <ion-label>Sesión</ion-label>
          </ion-list-header>

          <ion-item button @click="confirmLogout" class="logout-item">
            <ion-icon :icon="logOutOutline" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">
              <h3>Cerrar Sesión</h3>
              <p>Salir de la aplicación</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Loading -->
      <ion-loading :is-open="isLoading" message="Procesando..."></ion-loading>

      <!-- Calendar Modal -->
      <ion-modal :is-open="showCalendarModal" @did-dismiss="closeCalendarModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Mi Calendario</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" color="light" @click="closeCalendarModal">
                <ion-icon :icon="closeOutline" size="large"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div class="calendar-container">
            <div v-if="!hasGoogleCredentials" class="google-auth-container">
              <div class="auth-message">
                <ion-icon :icon="calendarOutline" class="auth-icon"></ion-icon>
                <h3>Google Calendar No Configurado</h3>
                <p>Las credenciales de Google Calendar no están configuradas en este entorno.</p>
                <p><small>Contacta al administrador para habilitar esta funcionalidad.</small></p>
              </div>
            </div>

            <div v-else-if="!isGoogleCalendarAuthorized" class="google-auth-container">
              <div class="auth-message">
                <ion-icon :icon="calendarOutline" class="auth-icon"></ion-icon>
                <h3>Conectar con Google Calendar</h3>
                <p>Autoriza el acceso a Google Calendar para sincronizar tus eventos y trabajos de Mantex.</p>

                <ion-button
                  @click="authorizeGoogleCalendar"
                  :disabled="isLoading"
                  color="primary"
                  expand="block"
                >
                  <ion-icon :icon="logoGoogle" slot="start"></ion-icon>
                  Conectar con Google
                </ion-button>
              </div>
            </div>

            <CalendarView
              v-else
              :enable-google-sync="true"
              :job-events="assignedJobs"
              @day-selected="onDaySelected"
              @job-selected="onJobSelected"
            />
          </div>
        </ion-content>
      </ion-modal>

      <!-- Logout Confirmation Alert -->
      <ion-alert
        :is-open="showLogoutAlert"
        header="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        :buttons="[
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Cerrar Sesión',
            role: 'confirm',
            handler: performLogout
          }
        ]"
        @didDismiss="showLogoutAlert = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonAvatar, IonList, IonListHeader, IonItem, IonLabel, IonToggle,
  IonLoading, IonAlert, IonSelect, IonSelectOption, IonModal, IonBadge,
  toastController
} from '@ionic/vue';
import {
  settingsOutline, cameraOutline, personOutline, chevronForwardOutline,
  keyOutline, constructOutline, calendarOutline, cardOutline,
  notificationsOutline, locationOutline, colorPaletteOutline,
  helpCircleOutline, informationCircleOutline, logOutOutline, contrastOutline,
  closeOutline, logoGoogle, close, bugOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';
import { useGoogleCalendar } from '@/composables/useGoogleCalendar.js';
import { useNotificationTester } from '@/composables/useNotificationTester.js';
import { useIOSNotifications } from '@/composables/useIOSNotifications.js';
import CalendarView from '@/components/common/CalendarView.vue';
import { useRouter } from 'vue-router';

// Auth composable
const { user, profile, logout, isFlynn, currentGridMode, enterGrid } = useAuth();
const router = useRouter();

const toggleFlynnMode = async () => {
  if (!isFlynn.value) return;

  const newMode = currentGridMode.value === 'client' ? 'supplier' : 'client';
  await enterGrid(newMode);
  
  const toast = await toastController.create({
    message: `Flynn Mode: Switched to ${newMode}`,
    duration: 2000,
    color: 'dark'
  });
  await toast.present();

  // Force navigation to refresh view context
  if (newMode === 'client') {
    router.push('/client/dashboard');
  } else {
    router.push('/tabs/tab1');
  }
};

// Google Calendar composable
const {
  isAuthorized: isGoogleCalendarAuthorized,
  authorizeUser: authorizeGoogleUser,
  syncJobsToCalendar,
  createJobEvent,
  hasCredentials: hasGoogleCredentials,
  error: googleCalendarError
} = useGoogleCalendar();

// Notification tester composable
const {
  testJobNotifications,
  testBrowserNotifications,
  checkNotificationStatus,
  isTestingPush: isTestingNotifications
} = useNotificationTester();

// iOS Notifications composable
const {
  hasPermission: hasIOSNotificationPermission,
  initializePushNotifications,
  sendTestNotification: sendIOSTestNotification
} = useIOSNotifications();

// Reactive data
const isLoading = ref(false);
const showSettings = ref(false);
const showLogoutAlert = ref(false);
const showCalendarModal = ref(false);
const notificationsEnabled = ref(true);
const locationEnabled = ref(true);
const selectedTheme = ref('auto');

// Jobs data for calendar integration
const assignedJobs = ref([]);

// Profile avatar
const profileAvatar = ref('https://ionicframework.com/docs/img/demos/avatar.svg');

// Mock stats
const stats = ref({
  completedJobs: 127,
  totalHours: 847,
  rating: '4.8'
});

// Theme management
const currentTheme = computed(() => {
  switch (selectedTheme.value) {
    case 'light': return 'Claro';
    case 'dark': return 'Oscuro';
    default: return 'Automático';
  }
});

const changeTheme = (event) => {
  const theme = event.detail.value;
  selectedTheme.value = theme;

  // Remove existing theme classes
  document.documentElement.classList.remove('dark', 'light');

  // Apply new theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.add('light');
  }
  // auto/system mode doesn't need classes - uses media query

  console.log('🎨 Theme changed to:', theme);
};

// Methods
const getRoleText = (role) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'client': return 'Cliente';
    case 'supplier': return 'Técnico Especialista';
    default: return 'Técnico';
  }
};

const getThemeText = (theme) => {
  switch (theme) {
    case 'light': return 'Claro';
    case 'dark': return 'Oscuro';
    case 'system': return 'Sistema';
    default: return 'Sistema';
  }
};

const useDefaultAvatar = () => {
  profileAvatar.value = 'https://ionicframework.com/docs/img/demos/avatar.svg';
};

// Profile actions
const changeAvatar = async () => {
  console.log('Change avatar requested');
  try {
    isLoading.value = true;

    const { useCamera } = await import('@/composables/useCamera.js');
    const { useS3Upload } = await import('@/composables/useS3Upload.js');
    const { useSupabaseAPI } = await import('@/composables/useSupabaseAPI.js');

    const { selectFromGallery } = useCamera();
    const { uploadFileToS3 } = useS3Upload();
    const { updateProfile } = useSupabaseAPI();

    // 1. Seleccionar foto
    const photo = await selectFromGallery({
      quality: 80,
      allowEditing: true,
      correctOrientation: true,
      width: 512,
      height: 512
    });

    if (photo) {
      console.log('📷 Photo selected:', photo);

      // 2. Preparar archivo para S3
      const fileBlob = await fetch(photo.webPath).then(r => r.blob());
      const fileName = `avatar.jpg`;

      // Crear File object con nombre correcto
      const file = new File([fileBlob], fileName, { type: 'image/jpeg' });

      // 3. Subir a S3 usando la estructura correcta: users/{username}/profile/
      console.log('☁️ Uploading avatar to S3...');
      const uploadResult = await uploadFileToS3(file, user.value.username, 'profile', user.value.id);

      if (uploadResult.success) {
        console.log('✅ Avatar uploaded to S3:', uploadResult.file_url);

        // 4. Actualizar perfil en Supabase
        const profileUpdateResult = await updateProfile(user.value.id, {
          avatar_url: uploadResult.file_url,
          avatar_s3_key: uploadResult.s3_key,
          updated_at: new Date().toISOString()
        });

        if (profileUpdateResult.success) {
          // 5. Actualizar UI
          profileAvatar.value = uploadResult.file_url;
          console.log('✅ Profile updated in database');

          // TODO: Show success toast
          console.log('🎉 Avatar actualizado exitosamente');
        } else {
          throw new Error('Error updating profile in database');
        }
      } else {
        throw new Error('Error uploading to S3');
      }
    }

  } catch (error) {
    console.error('❌ Error changing avatar:', error);

    // Revertir a avatar por defecto en caso de error
    profileAvatar.value = 'https://ionicframework.com/docs/img/demos/avatar.svg';

    // TODO: Show error toast
    console.error('Error actualizando avatar:', error.message);
  } finally {
    isLoading.value = false;
  }
};

const editProfile = () => {
  console.log('Edit profile requested');
  // TODO: Navigate to profile edit screen
};

const changePassword = () => {
  console.log('Change password requested');
  // TODO: Navigate to password change screen
};

// Work-related actions
const viewWorkHistory = () => {
  console.log('View work history requested');
  // TODO: Navigate to work history screen
};

const viewSchedule = async () => {
  console.log('View schedule requested');

  // Load assigned jobs for calendar
  await loadAssignedJobs();

  // Show calendar modal
  showCalendarModal.value = true;
};

const viewPayments = () => {
  console.log('View payments requested');
  // TODO: Navigate to payments screen
};

// Settings actions
const toggleNotifications = () => {
  notificationsEnabled.value = !notificationsEnabled.value;
  // TODO: Update notification preferences
};

const updateNotifications = async (event) => {
  notificationsEnabled.value = event.detail.checked;
  console.log('Notifications:', notificationsEnabled.value ? 'enabled' : 'disabled');

  try {
    const { useNotifications } = await import('@/composables/useNotifications.js');
    const { toggleNotifications } = useNotifications();

    await toggleNotifications(notificationsEnabled.value);
    console.log('✅ Notification preferences updated');

    // TODO: Save preferences to backend
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    // Revert toggle on error
    notificationsEnabled.value = !notificationsEnabled.value;
  }
};

const toggleLocation = () => {
  locationEnabled.value = !locationEnabled.value;
  // TODO: Update location preferences
};

const updateLocation = async (event) => {
  locationEnabled.value = event.detail.checked;
  console.log('Location:', locationEnabled.value ? 'enabled' : 'disabled');

  try {
    if (locationEnabled.value) {
      const { useGeolocation } = await import('@/composables/useGeolocation.js');
      const { requestLocationPermission } = useGeolocation();

      const granted = await requestLocationPermission();
      if (!granted) {
        // Permission denied, revert toggle
        locationEnabled.value = false;
        console.log('❌ Location permission denied');
      } else {
        console.log('✅ Location permission granted');
      }
    }

    // TODO: Save location preferences to backend
  } catch (error) {
    console.error('Error updating location preferences:', error);
    // Revert toggle on error
    locationEnabled.value = !locationEnabled.value;
  }
};

const updateTheme = (event) => {
  selectedTheme.value = event.detail.value;
  console.log('Theme changed to:', selectedTheme.value);

  // Apply theme to document
  const body = document.body;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Remove existing theme classes
  body.classList.remove('ion-theme-light', 'ion-theme-dark');

  if (selectedTheme.value === 'dark') {
    body.classList.add('ion-theme-dark');
  } else if (selectedTheme.value === 'light') {
    body.classList.add('ion-theme-light');
  } else { // auto
    if (prefersDark) {
      body.classList.add('ion-theme-dark');
    } else {
      body.classList.add('ion-theme-light');
    }
  }

  // Save preference to localStorage
  localStorage.setItem('theme-preference', selectedTheme.value);
};

// Support actions
const contactSupport = () => {
  console.log('Contact support requested');
  // TODO: Open support contact options
};

const viewAbout = () => {
  console.log('View about requested');
  // TODO: Show about/version information
};

// Calendar functionality
const loadAssignedJobs = async () => {
  try {
    // This would normally load from API
    // For now, using mock data
    assignedJobs.value = [
      {
        id: '1',
        title: 'Mantenimiento Aire Acondicionado',
        description: 'Revisión y mantenimiento preventivo',
        location: 'Oficina Central, Ciudad de México',
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'assigned',
        client_name: 'Empresa ABC'
      },
      {
        id: '2',
        title: 'Instalación Sistema Eléctrico',
        description: 'Instalación completa de sistema eléctrico',
        location: 'Guadalajara, Jalisco',
        scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'assigned',
        client_name: 'Constructora XYZ'
      }
    ];

    console.log(`✅ ${assignedJobs.value.length} jobs loaded for calendar`);
  } catch (error) {
    console.error('Error loading assigned jobs:', error);
    assignedJobs.value = [];
  }
};

const closeCalendarModal = () => {
  showCalendarModal.value = false;
};

const authorizeGoogleCalendar = async () => {
  try {
    isLoading.value = true;
    console.log('🔐 Authorizing Google Calendar...');

    // Verificar si las credenciales están configuradas
    if (!hasGoogleCredentials.value) {
      console.log('❌ Google Calendar credentials not configured');
      return;
    }

    const success = await authorizeGoogleUser();

    if (success) {
      console.log('✅ Google Calendar authorized');

      // Auto-sync jobs to calendar after authorization
      if (assignedJobs.value.length > 0) {
        await syncJobsToGoogleCalendar();
      }
    } else {
      console.log('❌ Google Calendar authorization failed');

      // Mostrar mensaje de error al usuario
      const toast = await toastController.create({
        message: 'Error al autorizar Google Calendar. Revisa tus credenciales.',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Error authorizing Google Calendar:', error);

    // Mostrar error específico al usuario
    const errorMessage = error.message || 'Error desconocido en autorización';
    const toast = await toastController.create({
      message: `Error: ${errorMessage}`,
      duration: 4000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    isLoading.value = false;
  }
};

const syncJobsToGoogleCalendar = async () => {
  try {
    console.log('🔄 Syncing jobs to Google Calendar...');

    const results = await syncJobsToCalendar(assignedJobs.value);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ ${successCount}/${assignedJobs.value.length} jobs synced to Google Calendar`);
  } catch (error) {
    console.error('Error syncing jobs to Google Calendar:', error);
  }
};

const onDaySelected = (day) => {
  console.log('Day selected:', day.date);
};

const onJobSelected = (job) => {
  console.log('Job selected:', job);
  // TODO: Navigate to job details or show job modal
};

// Notification testing functionality
const testNotifications = async () => {
  try {
    isTestingNotifications.value = true;
    console.log('🧪 Iniciando pruebas de notificaciones...');

    // Detectar plataforma
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      console.log('📱 Modo nativo - probando iOS notifications...');

      try {
        await sendIOSTestNotification();

        const toast = await toastController.create({
          message: '✅ Test de notificaciones iOS enviado',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      } catch (error) {
        console.error('Error con notificaciones iOS:', error);

        const toast = await toastController.create({
          message: '❌ Error con notificaciones iOS',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    } else {
      console.log('🌐 Modo web - simulando notificaciones...');

      const toast = await toastController.create({
        message: '🌐 Simulando notificaciones (solo funcionan en dispositivo real)',
        duration: 3000,
        color: 'primary',
        position: 'bottom'
      });
      await toast.present();

      // Log simulado de diferentes tipos
      setTimeout(() => console.log('📨 [SIMULADO] Nuevo trabajo asignado'), 1000);
      setTimeout(() => console.log('⏰ [SIMULADO] Recordatorio de trabajo'), 2000);
    }

  } catch (error) {
    console.error('❌ Error general:', error);

    const toast = await toastController.create({
      message: '❌ Error en prueba de notificaciones',
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    isTestingNotifications.value = false;
  }
};

// Logout functionality
const confirmLogout = () => {
  showLogoutAlert.value = true;
};

const performLogout = async () => {
  try {
    isLoading.value = true;
    console.log('🚪 Performing logout...');

    await logout();

    // TODO: Navigate to login screen
    console.log('✅ Logout completed');

    // For now, just refresh the page as we don't have login screen yet
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('❌ Error during logout:', error);
  } finally {
    isLoading.value = false;
    showLogoutAlert.value = false;
  }
};

// Load profile data on mount
onMounted(() => {
  console.log('Profile loaded for user:', user.value?.email);
  console.log('Profile data:', profile.value);

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme-preference') || 'auto';
  selectedTheme.value = savedTheme;
  updateTheme({ detail: { value: savedTheme } });

  console.log('📅 Google Calendar integration ready for iOS with proper credentials');
});
</script>

<style scoped>
.profile-header {
  padding: 2rem 1rem;
  text-align: center;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-tint) 100%);
  color: white;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.avatar-container ion-avatar {
  width: 100px;
  height: 100px;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.avatar-container ion-button {
  position: absolute;
  bottom: -5px;
  right: -5px;
  --background: rgba(255, 255, 255, 0.9);
  --color: var(--ion-color-primary);
  --border-radius: 50%;
  width: 35px;
  height: 35px;
}

.profile-info h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-role {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
}

.profile-email {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.9;
  text-align: center;
  line-height: 1.2;
}

.profile-actions {
  padding: 0;
}

.profile-actions ion-list {
  background: transparent;
}

.profile-actions ion-item {
  --padding-start: 1rem;
  --padding-end: 1rem;
  margin-bottom: 0.5rem;
}

.profile-actions ion-list-header {
  --color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 1.5rem 1rem 0.5rem 1rem;
}

.profile-actions ion-list-header:first-of-type {
  padding-top: 1rem;
}

.logout-item {
  margin-top: 1rem;
}

ion-item h3 {
  font-weight: 500;
  margin: 0;
}

ion-item p {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

/* Calendar Modal Styles */
.calendar-container {
  height: 100%;
}

.google-auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.auth-message {
  text-align: center;
  max-width: 400px;
}

.auth-icon {
  font-size: 4rem;
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

.auth-message h3 {
  font-family: 'Petrona', serif;
  margin-bottom: 1rem;
  color: var(--ion-color-primary);
}

.auth-message p {
  margin-bottom: 2rem;
  line-height: 1.5;
  color: var(--ion-color-medium);
}
</style>
