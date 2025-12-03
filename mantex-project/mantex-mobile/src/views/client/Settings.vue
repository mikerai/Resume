<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Configuración</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Avatar Section -->
      <div class="avatar-section ion-text-center ion-margin-bottom">
        <div class="avatar-container">
          <ion-avatar class="profile-avatar">
            <img 
              :src="avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'" 
              alt="Avatar" 
            />
          </ion-avatar>
          <div class="edit-avatar-button" @click="triggerFileInput">
            <ion-icon :icon="cameraOutline"></ion-icon>
          </div>
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/*" 
            style="display: none" 
            @change="onAvatarSelect"
          />
        </div>
        <h2 class="ion-margin-top">{{ profile?.first_name }} {{ profile?.last_name }} {{ profile?.second_last_name }}</h2>
        <p class="text-muted">{{ user?.email }}</p>
      </div>

      <!-- Appearance Section -->
      <ion-list>
        <ion-list-header>
          <ion-label>Apariencia</ion-label>
        </ion-list-header>

        <ion-item>
          <ion-label>Tema</ion-label>
          <ion-select v-model="selectedTheme" interface="action-sheet" @ionChange="onThemeChange">
            <ion-select-option value="auto">Automático</ion-select-option>
            <ion-select-option value="light">Claro</ion-select-option>
            <ion-select-option value="dark">Oscuro</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label>Tamaño de Texto</ion-label>
          <ion-select v-model="selectedScale" interface="action-sheet" @ionChange="onScaleChange">
            <ion-select-option value="small">Pequeño</ion-select-option>
            <ion-select-option value="medium">Mediano</ion-select-option>
            <ion-select-option value="large">Grande</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <!-- Notifications Section -->
      <ion-list>
        <ion-list-header>
          <ion-label>Notificaciones</ion-label>
        </ion-list-header>

        <ion-item>
          <ion-label>Notificaciones Push</ion-label>
          <ion-toggle v-model="notificationsEnabled" @ionChange="onNotificationToggle"></ion-toggle>
        </ion-item>
      </ion-list>

      <!-- Password Section -->
      <ion-list>
        <ion-list-header>
          <ion-label>Seguridad</ion-label>
        </ion-list-header>

        <ion-item>
          <ion-label position="stacked">Nueva Contraseña</ion-label>
          <ion-input 
            v-model="newPassword" 
            type="password" 
            placeholder="Mínimo 6 caracteres"
          >
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Confirmar Contraseña</ion-label>
          <ion-input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Repite la contraseña"
          >
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
        <ion-button expand="block" @click="updatePassword" :disabled="loading || !newPassword">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Actualizar Contraseña</span>
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonAvatar, IonIcon, IonList, IonListHeader, IonItem, IonLabel, IonInput, IonButton, IonSpinner,
  IonInputPasswordToggle, IonSelect, IonSelectOption, IonToggle, toastController
} from '@ionic/vue';
import { cameraOutline } from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { usePushNotifications } from '@/composables/usePushNotifications';

const { user, profile, updateProfileLocally } = useAuth();
const { uploadFileToS3, getSignedUrl } = useS3Upload();
const { initialize, permissionStatus } = usePushNotifications();

const avatarUrl = ref(null);
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const fileInput = ref(null);

// Theme and Scale
const selectedTheme = ref('auto');
const selectedScale = ref('medium');
const notificationsEnabled = ref(false);

const loadAvatar = async () => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('avatar_url')
      .eq('user_id', user.value.id)
      .single();

    if (error) throw error;

    if (data?.avatar_url) {
      avatarUrl.value = await getSignedUrl(data.avatar_url);
    }
  } catch (e) {
    console.error('Error loading avatar:', e);
  }
};

const loadPreferences = () => {
  const theme = localStorage.getItem('mantex_theme') || 'dark';
  const scale = localStorage.getItem('mantex_scale') || 'medium';
  selectedTheme.value = theme;
  selectedScale.value = scale;
  applyTheme(theme);
  applyScale(scale);
};

const applyTheme = (theme) => {
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', prefersDark);
  } else {
    document.body.classList.toggle('dark', theme === 'dark');
  }
};

const applyScale = (scale) => {
  document.documentElement.classList.remove('scale-small', 'scale-medium', 'scale-large');
  document.documentElement.classList.add(`scale-${scale}`);
};

const onThemeChange = (event) => {
  const theme = event.detail.value;
  localStorage.setItem('mantex_theme', theme);
  applyTheme(theme);
  showToast('Tema actualizado', 'success');
};

const onScaleChange = (event) => {
  const scale = event.detail.value;
  localStorage.setItem('mantex_scale', scale);
  applyScale(scale);
  showToast('Tamaño de texto actualizado', 'success');
};

const onNotificationToggle = async (event) => {
  const enabled = event.detail.checked;
  try {
    if (enabled) {
      const result = await initialize(user.value?.id);
      if (result.success) {
        notificationsEnabled.value = true;
        showToast('Notificaciones activadas', 'success');
      } else {
        notificationsEnabled.value = false;
        showToast('No se pudieron activar las notificaciones', 'danger');
      }
    } else {
      notificationsEnabled.value = false;
      showToast('Notificaciones desactivadas', 'success');
    }
  } catch (error) {
    console.error('Error toggling notifications:', error);
    notificationsEnabled.value = false;
    showToast('Error al cambiar configuración', 'danger');
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const onAvatarSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  loading.value = true;
  try {
    const username = user.value.email.split('@')[0];
    const { s3_key } = await uploadFileToS3(file, username, 'avatars');

    // Update profile in DB
    const { error } = await supabase
      .from('client_profiles')
      .update({ avatar_url: s3_key })
      .eq('user_id', user.value.id);

    if (error) throw error;

    // Refresh profile and avatar
    await updateProfileLocally(user.value.id);
    await loadAvatar();
    showToast('Foto de perfil actualizada', 'success');
  } catch (error) {
    console.error('Error updating avatar:', error);
    showToast('No se pudo actualizar la foto', 'danger');
  } finally {
    loading.value = false;
  }
};

const updatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    showToast('Las contraseñas no coinciden', 'warning');
    return;
  }
  if (newPassword.value.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
    return;
  }

  loading.value = true;
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;

    showToast('Contraseña actualizada correctamente', 'success');
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    console.error('Error updating password:', error);
    showToast('No se pudo actualizar la contraseña', 'danger');
  } finally {
    loading.value = false;
  }
};

const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  await toast.present();
};

onMounted(() => {
  if (user.value?.id) {
    loadAvatar();
    loadPreferences();
    notificationsEnabled.value = permissionStatus.value === 'granted';
  }
});
</script>

<style scoped>
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border: 3px solid var(--ion-color-primary);
}

.edit-avatar-button {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.text-muted {
  color: var(--ion-color-medium);
  margin-top: 0.5rem;
}
</style>
