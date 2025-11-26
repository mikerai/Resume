<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Activos</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openNewAsset">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="assets.length === 0" class="ion-text-center ion-padding">
        <p>No hay activos registrados</p>
        <ion-button @click="openNewAsset">Agregar Activo</ion-button>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="asset in assets" :key="asset.id">
          <ion-item button @click="editAsset(asset)">
            <ion-label>
              <h2>{{ asset.name }}</h2>
              <p>{{ asset.category }}</p>
              <p class="text-small">
                <ion-icon :icon="locationOutline" class="vertical-middle"></ion-icon>
                {{ getLocationLabel(asset) }}
              </p>
            </ion-label>
            <ion-badge slot="end" :color="getStatusColor(asset.status)">
              {{ getStatusLabel(asset.status) }}
            </ion-badge>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteAsset(asset)">
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Modal for Create/Edit -->
      <ion-modal :is-open="showModal" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>{{ selectedAsset ? 'Editar' : 'Nuevo' }} Activo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="saveAsset" :disabled="saving">Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre *</ion-label>
              <ion-input v-model="formData.name" placeholder="Ej. Aire Acondicionado"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Categoría *</ion-label>
              <ion-select v-model="formData.category" placeholder="Seleccionar">
                <ion-select-option value="hvac">HVAC</ion-select-option>
                <ion-select-option value="electrical">Eléctrico</ion-select-option>
                <ion-select-option value="plumbing">Plomería</ion-select-option>
                <ion-select-option value="security">Seguridad</ion-select-option>
                <ion-select-option value="technology">Tecnología</ion-select-option>
                <ion-select-option value="furniture">Mobiliario</ion-select-option>
                <ion-select-option value="vehicles">Vehículos</ion-select-option>
                <ion-select-option value="others">Otros</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Ubicación *</ion-label>
              <ion-select v-model="formData.location_val" placeholder="Seleccionar">
                <ion-select-option value="HEADQUARTERS">Oficina Central</ion-select-option>
                <ion-select-option v-for="branch in branches" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Estado</ion-label>
              <ion-select v-model="formData.status">
                <ion-select-option value="operational">Operativo</ion-select-option>
                <ion-select-option value="maintenance">En Mantenimiento</ion-select-option>
                <ion-select-option value="out_of_order">Fuera de Servicio</ion-select-option>
                <ion-select-option value="retired">Retirado</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Descripción</ion-label>
              <ion-textarea v-model="formData.description" rows="3"></ion-textarea>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton,
  IonList, IonItem, IonLabel, IonIcon, IonSpinner, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonModal, IonInput, IonSelect, IonSelectOption, IonTextarea,
  alertController, toastController
} from '@ionic/vue';
import { addOutline, trashOutline, locationOutline } from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import { useClientAssets } from '@/composables/useClientAssets';
import { useClientBranches } from '@/composables/useClientBranches';

const { user } = useAuth();
const { assets, fetchAssets, loading } = useClientAssets();
const { branches, fetchBranches } = useClientBranches();

const showModal = ref(false);
const saving = ref(false);
const selectedAsset = ref(null);
const clientId = ref(null);

const formData = ref({
  name: '',
  description: '',
  category: '',
  status: 'operational',
  location_val: ''
});

const loadClientId = async () => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        clientId.value = data.id;
    } catch (error) {
        console.error('Error loading client ID:', error);
    }
};

const openNewAsset = () => {
  selectedAsset.value = null;
  resetForm();
  showModal.value = true;
};

const editAsset = (asset) => {
  selectedAsset.value = asset;
  
  let locationVal = '';
  if (asset.location_type === 'HEADQUARTERS') {
      locationVal = 'HEADQUARTERS';
  } else {
      locationVal = asset.branch_id;
  }

  formData.value = {
    name: asset.name,
    description: asset.description,
    category: asset.category,
    status: asset.status,
    location_val: locationVal
  };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    category: '',
    status: 'operational',
    location_val: ''
  };
};

const closeModal = () => {
  showModal.value = false;
};

const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  await toast.present();
};

const saveAsset = async () => {
  if (!formData.value.name || !formData.value.category || !formData.value.location_val) {
    showToast('Complete los campos obligatorios', 'warning');
    return;
  }

  saving.value = true;
  try {
    let locType = 'BRANCH';
    let branchId = null;
    
    if (formData.value.location_val === 'HEADQUARTERS') {
        locType = 'HEADQUARTERS';
    } else {
        branchId = formData.value.location_val;
    }

    const payload = {
      client_id: clientId.value,
      name: formData.value.name,
      description: formData.value.description,
      category: formData.value.category,
      status: formData.value.status,
      location_type: locType,
      branch_id: branchId,
      updated_at: new Date().toISOString()
    };

    let error;
    if (selectedAsset.value) {
      ({ error } = await supabase
        .from('client_assets')
        .update(payload)
        .eq('id', selectedAsset.value.id));
    } else {
      ({ error } = await supabase
        .from('client_assets')
        .insert(payload));
    }

    if (error) throw error;

    showToast('Activo guardado correctamente');
    await fetchAssets(clientId.value);
    closeModal();
  } catch (error) {
    console.error('Error saving asset:', error);
    showToast('Error al guardar el activo', 'danger');
  } finally {
    saving.value = false;
  }
};

const deleteAsset = async (asset) => {
  const alert = await alertController.create({
    header: 'Eliminar Activo',
    message: `¿Estás seguro de que deseas eliminar ${asset.name}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const { error } = await supabase
              .from('client_assets')
              .delete()
              .eq('id', asset.id);

            if (error) throw error;
            showToast('Activo eliminado');
            await fetchAssets(clientId.value);
          } catch (error) {
            console.error('Error deleting asset:', error);
            showToast('Error al eliminar', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

const getLocationLabel = (asset) => {
    if (asset.location_type === 'HEADQUARTERS') return 'Oficina Central';
    if (asset.branch) return asset.branch.name;
    // Fallback if branch name is not joined yet (though fetchAssets usually joins it)
    const branch = branches.value.find(b => b.id === asset.branch_id);
    return branch ? branch.name : 'Desconocido';
};

const getStatusLabel = (status) => {
    const labels = {
        'operational': 'Operativo',
        'maintenance': 'Mantenimiento',
        'out_of_order': 'Fuera Servicio',
        'retired': 'Retirado'
    };
    return labels[status] || status;
};

const getStatusColor = (status) => {
    const colors = {
        'operational': 'success',
        'maintenance': 'warning',
        'out_of_order': 'danger',
        'retired': 'medium'
    };
    return colors[status] || 'medium';
};

onMounted(async () => {
  await loadClientId();
  if (clientId.value) {
    await Promise.all([
      fetchAssets(clientId.value),
      fetchBranches(clientId.value)
    ]);
  }
});
</script>

<style scoped>
.text-small {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}
.vertical-middle {
  vertical-align: middle;
  margin-bottom: 2px;
}
</style>
