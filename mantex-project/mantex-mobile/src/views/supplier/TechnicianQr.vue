<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1"></ion-back-button>
        </ion-buttons>
        <ion-title>Mi Identificación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container" v-if="loading">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Generando código seguro...</p>
      </div>

      <div class="qr-container" v-else-if="token">
        <ion-card class="qr-card">
          <ion-card-header>
            <ion-card-title class="ion-text-center">Escanea para Validar</ion-card-title>
            <ion-card-subtitle class="ion-text-center">Muestra este código al cliente</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content class="ion-text-center">
            <div class="qr-wrapper">
              <qrcode-vue 
                :value="token" 
                :size="250" 
                level="H" 
                render-as="svg"
                background="#ffffff"
                foreground="#000000"
              />
            </div>
            
            <div class="token-info ion-margin-top">
              <p class="expiry-text">
                <ion-icon :icon="timeOutline"></ion-icon>
                Válido hasta: {{ formatTime(expiresAt) }}
              </p>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="technician-info ion-margin-top">
          <ion-item lines="none" class="profile-item">
            <ion-avatar slot="start">
              <img :src="userAvatar || '/assets/img/default-avatar.png'" alt="Avatar" />
            </ion-avatar>
            <ion-label>
              <h2>{{ userName }}</h2>
              <p>ID: {{ userPublicId }}</p>
              <ion-badge color="success">Verificado</ion-badge>
            </ion-label>
          </ion-item>
        </div>

        <ion-button expand="block" fill="outline" class="ion-margin-top" @click="generateToken">
          <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
          Regenerar Código
        </ion-button>
      </div>

      <div class="error-container" v-else>
        <ion-text color="danger">
          <p>No se pudo generar el código.</p>
        </ion-text>
        <ion-button @click="generateToken">Intentar de nuevo</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner,
  IonButton, IonIcon, IonItem, IonAvatar, IonLabel, IonBadge, IonText
} from '@ionic/vue';
import { timeOutline, refreshOutline } from 'ionicons/icons';
import QrcodeVue from 'qrcode.vue';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';

const { profile } = useAuth();
const loading = ref(true);
const token = ref(null);
const expiresAt = ref(null);

// User info
const userName = computed(() => {
  if (!profile.value) return 'Técnico';
  return `${profile.value.first_name || ''} ${profile.value.last_name || ''}`;
});

const userPublicId = computed(() => profile.value?.username || profile.value?.email || 'N/A');
const userAvatar = computed(() => profile.value?.avatar_url);

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const generateToken = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase.rpc('generate_qr_token');
    
    if (error) throw error;
    
    if (data) {
      token.value = data.token;
      expiresAt.value = data.expires_at;
    }
  } catch (e) {
    console.error('Error generating QR token:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  generateToken();
});
</script>

<style scoped>
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80%;
}

.qr-card {
  width: 100%;
  max-width: 350px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.qr-wrapper {
  background: white;
  padding: 16px;
  border-radius: 8px;
  display: inline-block;
}

.expiry-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.technician-info {
  width: 100%;
  max-width: 350px;
}

.profile-item {
  --background: transparent;
}
</style>
