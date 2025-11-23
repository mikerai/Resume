<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Solicitar Servicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="!canCreateTicket" class="permission-denied">
        <ion-icon :icon="lockClosedOutline" size="large" color="medium"></ion-icon>
        <h3>Acceso Restringido</h3>
        <p>No tienes permisos para crear nuevas solicitudes de servicio.</p>
        <ion-button fill="outline" router-link="/client/dashboard">Volver</ion-button>
      </div>

      <form v-else @submit.prevent="submitTicket">
        <ion-list>
          <ion-item>
            <ion-select label="Tipo de Mantenimiento" label-placement="floating" v-model="form.maintenance_type">
              <ion-select-option value="corrective">Correctivo (Reparación)</ion-select-option>
              <ion-select-option value="preventive">Preventivo (Mantenimiento)</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-select label="Categoría" label-placement="floating" v-model="form.category" placeholder="Selecciona una opción">
              <ion-select-option value="electricidad">Electricidad</ion-select-option>
              <ion-select-option value="plomeria">Plomería</ion-select-option>
              <ion-select-option value="climatizacion">Climatización</ion-select-option>
              <ion-select-option value="pintura">Pintura</ion-select-option>
              <ion-select-option value="otro">Otro</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-select label="Prioridad" label-placement="floating" v-model="form.priority">
              <ion-select-option value="low">Baja (Planificado)</ion-select-option>
              <ion-select-option value="medium">Media (Normal)</ion-select-option>
              <ion-select-option value="high">Alta (Urgente)</ion-select-option>
              <ion-select-option value="urgent">Urgente (Crítico)</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input label="Título del Problema" label-placement="floating" v-model="form.title" placeholder="Ej. Fuga de agua en baño"></ion-input>
          </ion-item>

          <ion-item>
            <ion-textarea label="Descripción Detallada" label-placement="floating" v-model="form.description" rows="4" placeholder="Describe el problema con detalle..."></ion-textarea>
          </ion-item>

          <!-- Photo Upload Section -->
          <ion-item button @click="selectPhoto">
            <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
            <ion-label>
              <h3>Agregar Foto (Opcional)</h3>
              <p v-if="!selectedPhoto">Toca para tomar o seleccionar una foto</p>
              <p v-else class="photo-selected">✓ Foto seleccionada</p>
            </ion-label>
          </ion-item>

          <!-- Photo Preview -->
          <div v-if="photoPreview" class="photo-preview">
            <img :src="photoPreview" alt="Preview" />
            <ion-button fill="clear" color="danger" @click="removePhoto">
              <ion-icon :icon="closeCircleOutline"></ion-icon>
              Eliminar
            </ion-button>
          </div>
        </ion-list>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enviando...' : 'Crear Solicitud' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonSelect, IonSelectOption, IonInput, IonTextarea, IonButton,
  IonIcon, IonLabel, toastController
} from '@ionic/vue';
import { lockClosedOutline, cameraOutline, closeCircleOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useRouter } from 'vue-router';
import { useClientTickets } from '@/composables/useClientTickets.js';
import { usePermissions } from '@/composables/usePermissions.js';
import { useAuth } from '@/composables/useAuth.js';

const router = useRouter();
const { createTicket } = useClientTickets();
const { canCreateTicket } = usePermissions();

const isSubmitting = ref(false);
const selectedPhoto = ref(null); // Base64 photo data
const photoPreview = ref(null); // Preview URL
const { user } = useAuth();

const form = reactive({
  maintenance_type: 'corrective',
  category: '',
  priority: 'medium',
  title: '',
  description: ''
});

const selectPhoto = async () => {
  try {
    // Check if running in native app
    if (window.Capacitor?.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      selectedPhoto.value = image.base64String;
      photoPreview.value = `data:image/${image.format};base64,${image.base64String}`;
    } else {
      // Web fallback: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            selectedPhoto.value = base64;
            photoPreview.value = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  } catch (error) {
    console.error('Error selecting photo:', error);
    if (error.message !== 'User cancelled photos app') {
      const toast = await toastController.create({
        message: 'Error al seleccionar foto',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
};

const removePhoto = () => {
  selectedPhoto.value = null;
  photoPreview.value = null;
};

const uploadPhotoToS3 = async (ticketId) => {
  if (!selectedPhoto.value) return null;

  try {
    const username = user.value.email.split('@')[0];
    const timestamp = Date.now();
    const key = `users/${username}/evidence/${timestamp}_ticket_${ticketId}.jpg`;

    // Call Lambda function to upload to S3
    const response = await fetch('https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'mantex-documents-1763361307',
        key: key,
        body: selectedPhoto.value,
        contentType: 'image/jpeg',
        metadata: {
          username: username,
          documentType: 'evidence',
          ticketId: ticketId,
          uploadTimestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    if (result.success) {
      return result.fileUrl;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading photo to S3:', error);
    return null;
  }
};

const submitTicket = async () => {
  if (!form.title || !form.description || !form.category) {
    const toast = await toastController.create({
      message: 'Por favor completa todos los campos obligatorios',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
    return;
  }

  isSubmitting.value = true;

  const result = await createTicket(form);

  if (result.success && selectedPhoto.value) {
    // Upload photo if one was selected
    const photoUrl = await uploadPhotoToS3(result.data.id);
    if (photoUrl) {
      console.log('Photo uploaded successfully:', photoUrl);
      // TODO: Save photoUrl to ticket_attachments table or update ticket
    }
  }

  isSubmitting.value = false;

  if (result.success) {
    const toast = await toastController.create({
      message: 'Solicitud creada exitosamente',
      duration: 2000,
      color: 'success'
    });
    await toast.present();
    router.push('/client/dashboard');
  } else {
    const toast = await toastController.create({
      message: 'Error al crear solicitud: ' + result.error,
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }
};
</script>

<style scoped>
.permission-denied {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}
.permission-denied h3 {
  margin-top: 20px;
  color: var(--ion-color-dark);
}

.photo-selected {
  color: var(--mantex-success);
  font-weight: 600;
}

.photo-preview {
  padding: 16px;
  text-align: center;
}

.photo-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
