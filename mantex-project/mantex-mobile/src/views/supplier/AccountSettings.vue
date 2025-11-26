<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Profile Card -->
      <ion-card class="profile-card">
        <ion-card-content>
          <div class="profile-header">
            <ion-avatar class="profile-avatar">
              <img 
                v-if="avatarUrl" 
                :src="avatarUrl" 
                alt="Avatar"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(profile?.username) }}
              </div>
            </ion-avatar>
            <div class="profile-info">
              <h2>{{ profile?.username || 'Usuario' }}</h2>
              <p>{{ profile?.role === 'supplier' ? 'Proveedor' : profile?.role }}</p>
              <ion-chip color="success" v-if="isApproved">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <ion-label>Aprobado</ion-label>
              </ion-chip>
              <ion-chip color="warning" v-else>
                <ion-icon :icon="timeOutline"></ion-icon>
                <ion-label>Pendiente</ion-label>
              </ion-chip>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Account Information -->
      <ion-list>
        <ion-list-header>
          <ion-label>Información de Cuenta</ion-label>
        </ion-list-header>

        <ion-item>
          <ion-icon :icon="mailOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Correo Electrónico</h3>
            <p>{{ user?.email || 'No disponible' }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon :icon="personOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Usuario</h3>
            <p>{{ profile?.username || 'No disponible' }}</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon :icon="shieldCheckmarkOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Rol</h3>
            <p>{{ getRoleLabel(profile?.role) }}</p>
          </ion-label>
        </ion-item>

        <ion-item v-if="profile?.sub_role">
          <ion-icon :icon="ribbonOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Sub-rol</h3>
            <p>{{ getSubRoleLabel(profile?.sub_role) }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Settings -->
      <ion-list>
        <ion-list-header>
          <ion-label>Configuración</ion-label>
        </ion-list-header>

        <ion-item button router-link="/supplier/settings">
          <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
          <ion-label>Cuenta y Seguridad</ion-label>
        </ion-item>

        <ion-item button @click="toggleNotifications">
          <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
          <ion-label>Notificaciones</ion-label>
          <ion-toggle v-model="notificationsEnabled" slot="end"></ion-toggle>
        </ion-item>

        <ion-item button>
          <ion-icon :icon="languageOutline" slot="start"></ion-icon>
          <ion-label>
            <h3>Idioma</h3>
            <p>Español</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Support -->
      <ion-list>
        <ion-list-header>
          <ion-label>Soporte</ion-label>
        </ion-list-header>

        <ion-item button @click="openHelp">
          <ion-icon :icon="helpCircleOutline" slot="start"></ion-icon>
          <ion-label>Centro de Ayuda</ion-label>
        </ion-item>

        <ion-item button>
          <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
          <ion-label>Términos y Condiciones</ion-label>
        </ion-item>

        <ion-item button>
          <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
          <ion-label>Política de Privacidad</ion-label>
        </ion-item>
      </ion-list>

      <!-- Logout Button -->
      <div class="ion-padding">
        <ion-button expand="block" color="danger" @click="confirmLogout">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Cerrar Sesión
        </ion-button>
      </div>

      <!-- Version Info -->
      <div class="version-info ion-text-center ion-padding">
        <p class="ion-text-color-medium">
          Versión 1.0.0
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent,
  IonAvatar, IonChip, IonIcon, IonLabel, IonList, IonListHeader, IonItem,
  IonToggle, IonButton, alertController, toastController
} from '@ionic/vue';
import {
  mailOutline, personOutline, shieldCheckmarkOutline, ribbonOutline,
  notificationsOutline, languageOutline, helpCircleOutline, documentTextOutline,
  lockClosedOutline, logOutOutline, checkmarkCircleOutline, timeOutline, settingsOutline
} from 'ionicons/icons';
import { useAuth } from '@/composables/useAuth.js';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';

const router = useRouter();
const { user, profile, logout } = useAuth();
const { getSignedUrl } = useS3Upload();

const notificationsEnabled = ref(true);
const avatarUrl = ref(null);

const loadAvatar = async () => {
  try {
    const { data, error } = await supabase
      .from('supplier_profiles')
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

const isApproved = computed(() => {
  return profile.value?.onboarding_complete === true;
});

const getInitials = (name) => {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
};

const getRoleLabel = (role) => {
  const labels = {
    'supplier': 'Proveedor',
    'client': 'Cliente',
    'admin': 'Administrador'
  };
  return labels[role] || role;
};

const getSubRoleLabel = (subRole) => {
  const labels = {
    'supplier_admin': 'Administrador de Proveedor',
    'supplier_technician': 'Técnico',
    'client_admin': 'Administrador de Cliente',
    'client_user': 'Usuario de Cliente'
  };
  return labels[subRole] || subRole;
};

const toggleNotifications = () => {
  // This would typically save to backend/local storage
  console.log('Notifications toggled:', notificationsEnabled.value);
};

const openHelp = () => {
  // Navigate to help center or open external URL
  console.log('Opening help center');
};

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro de que quieres cerrar sesión?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Cerrar Sesión',
        role: 'destructive',
        handler: async () => {
          await handleLogout();
        }
      }
    ]
  });

  await alert.present();
};

const handleLogout = async () => {
  try {
    await logout();
    
    const toast = await toastController.create({
      message: 'Sesión cerrada exitosamente',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    router.push('/login');
  } catch (error) {
    console.error('Error during logout:', error);
    
    const toast = await toastController.create({
      message: 'Error al cerrar sesión',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

onMounted(() => {
  if (user.value?.id) {
    loadAvatar();
  }
});
</script>

<style scoped>
.profile-card {
  margin: 1rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 80px;
  height: 80px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: white;
  font-weight: bold;
  font-size: 1.8rem;
  border-radius: 50%;
}

.profile-info h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-info p {
  margin: 0 0 0.5rem 0;
  color: var(--ion-color-medium);
}

ion-list-header {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.version-info {
  margin-top: 2rem;
  margin-bottom: 2rem;
}
</style>
