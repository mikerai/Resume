<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1"></ion-back-button>
        </ion-buttons>
        <ion-title>Validar Técnico</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="scan-container" v-if="!scanResult">
        <div class="instructions">
          <ion-icon :icon="scanOutline" class="scan-icon"></ion-icon>
          <h2>Escanear Código QR</h2>
          <p>Solicita al técnico que muestre su código de identificación desde su aplicación.</p>
        </div>

        <ion-button expand="block" size="large" @click="startScan" :disabled="scanning">
          {{ scanning ? 'Escaneando...' : 'Iniciar Escáner' }}
        </ion-button>
      </div>

      <!-- Result View -->
      <div class="result-container" v-else>
        <!-- Valid Result -->
        <ion-card v-if="scanResult.valid" class="success-card">
          <div class="status-header success">
            <ion-icon :icon="checkmarkCircle" class="status-icon"></ion-icon>
            <h1>Técnico Verificado</h1>
          </div>

          <div class="provider-details ion-text-center">
            <ion-avatar class="large-avatar">
              <img :src="scanResult.provider.photo_url || '/assets/img/default-avatar.png'" />
            </ion-avatar>
            <h2>{{ scanResult.provider.full_name }}</h2>
            <p class="company">{{ scanResult.provider.company_name }}</p>
            <ion-chip color="success" outline>
              <ion-label>ID: {{ scanResult.provider.public_id }}</ion-label>
            </ion-chip>
          </div>

          <ion-list v-if="scanResult.tickets && scanResult.tickets.length > 0" class="tickets-list">
            <ion-list-header>
              <ion-label>Servicios Asignados a Ti</ion-label>
            </ion-list-header>
            <ion-item v-for="ticket in scanResult.tickets" :key="ticket.id">
              <ion-label>
                <h3>{{ ticket.title }}</h3>
                <p>Ticket #{{ ticket.ticket_number }}</p>
              </ion-label>
              <ion-badge :color="getStatusColor(ticket.status)">{{ ticket.status }}</ion-badge>
            </ion-item>
          </ion-list>
          
          <div v-else class="no-tickets ion-padding">
            <ion-text color="warning">
              <p>Este técnico es válido pero <strong>no tiene tickets activos asignados a ti</strong> en este momento.</p>
            </ion-text>
          </div>

          <ion-button expand="block" fill="outline" class="ion-margin-top" @click="resetScan">
            Nueva Validación
          </ion-button>
        </ion-card>

        <!-- Invalid Result -->
        <ion-card v-else class="error-card">
          <div class="status-header error">
            <ion-icon :icon="closeCircle" class="status-icon"></ion-icon>
            <h1>Código Inválido</h1>
          </div>
          <ion-card-content class="ion-text-center">
            <p>{{ scanResult.message || 'No se pudo verificar la identidad del técnico.' }}</p>
            <ion-button expand="block" color="danger" class="ion-margin-top" @click="resetScan">
              Intentar de nuevo
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButtons, IonBackButton, IonButton, IonIcon, IonCard,
  IonCardContent, IonAvatar, IonChip, IonLabel, IonList, 
  IonListHeader, IonItem, IonBadge, IonText, alertController
} from '@ionic/vue';
import { scanOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { supabase } from '@/lib/supabaseClient';

const scanning = ref(false);
const scanResult = ref(null);

const startScan = async () => {
  try {
    // Check/Request permissions
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      const alert = await alertController.create({
        header: 'Permiso denegado',
        message: 'Se requiere acceso a la cámara para escanear el código QR.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    scanning.value = true;
    
    // Start scanning
    const { barcodes } = await BarcodeScanner.scan({
      formats: ['QR_CODE']
    });

    if (barcodes.length > 0) {
      const token = barcodes[0].rawValue;
      await validateToken(token);
    }
  } catch (e) {
    console.error('Scanning error:', e);
    // Handle cancellation or error
  } finally {
    scanning.value = false;
  }
};

const validateToken = async (token) => {
  try {
    const { data, error } = await supabase.rpc('validate_qr_token', { p_token: token });
    
    if (error) throw error;
    
    scanResult.value = data;
  } catch (e) {
    console.error('Validation error:', e);
    scanResult.value = { valid: false, message: 'Error de conexión al validar.' };
  }
};

const resetScan = () => {
  scanResult.value = null;
};

const getStatusColor = (status) => {
  const colors = {
    'assigned': 'primary',
    'in_progress': 'warning',
    'completed': 'success'
  };
  return colors[status] || 'medium';
};
</script>

<style scoped>
.scan-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80%;
  text-align: center;
}

.scan-icon {
  font-size: 6rem;
  color: var(--ion-color-primary);
  margin-bottom: 20px;
}

.instructions {
  margin-bottom: 40px;
}

.instructions h2 {
  font-size: 1.5rem;
  font-weight: bold;
}

.instructions p {
  color: var(--ion-color-medium);
  max-width: 80%;
  margin: 10px auto;
}

.status-header {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-icon {
  font-size: 4rem;
  margin-bottom: 10px;
}

.success .status-icon { color: var(--ion-color-success); }
.error .status-icon { color: var(--ion-color-danger); }

.large-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
}

.provider-details h2 {
  margin: 5px 0;
  font-weight: bold;
}

.company {
  color: var(--ion-color-medium);
  margin-bottom: 10px;
}

.tickets-list {
  margin-top: 20px;
  border-top: 1px solid var(--ion-color-light);
}
</style>
