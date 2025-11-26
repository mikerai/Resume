<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Sucursales</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openNewBranch">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="branches.length === 0" class="ion-text-center ion-padding">
        <p>No hay sucursales registradas</p>
        <ion-button @click="openNewBranch">Agregar Sucursal</ion-button>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="branch in branches" :key="branch.id">
          <ion-item button @click="editBranch(branch)">
            <ion-label>
              <h2>
                {{ branch.name }}
                <ion-badge v-if="branch.is_headquarters" color="warning" class="ml-2">HQ</ion-badge>
              </h2>
              <p>{{ branch.street }} {{ branch.number }}</p>
              <p class="text-small">{{ branch.municipality_city }}, {{ branch.state }}</p>
            </ion-label>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteBranch(branch)">
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
            <ion-title>{{ selectedBranch ? 'Editar' : 'Nueva' }} Sucursal</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="saveBranch" :disabled="saving">Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre *</ion-label>
              <ion-input v-model="formData.name" placeholder="Ej. Sucursal Norte"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label>Es Oficina Central</ion-label>
              <ion-toggle v-model="formData.is_headquarters"></ion-toggle>
            </ion-item>

            <ion-item-divider>
              <ion-label>Dirección</ion-label>
            </ion-item-divider>

            <ion-item>
              <ion-label position="stacked">Calle *</ion-label>
              <ion-input v-model="formData.street"></ion-input>
            </ion-item>

            <ion-grid>
              <ion-row>
                <ion-col>
                  <ion-item lines="none" class="ion-no-padding">
                    <ion-label position="stacked">Número *</ion-label>
                    <ion-input v-model="formData.number"></ion-input>
                  </ion-item>
                </ion-col>
                <ion-col>
                  <ion-item lines="none" class="ion-no-padding">
                    <ion-label position="stacked">Int.</ion-label>
                    <ion-input v-model="formData.apt"></ion-input>
                  </ion-item>
                </ion-col>
              </ion-row>
            </ion-grid>

            <ion-item>
              <ion-label position="stacked">Colonia *</ion-label>
              <ion-input v-model="formData.neighborhood"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Ciudad/Municipio *</ion-label>
              <ion-input v-model="formData.municipality_city"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Estado *</ion-label>
              <ion-input v-model="formData.state"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Código Postal *</ion-label>
              <ion-input v-model="formData.postal_code" type="number"></ion-input>
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
  IonModal, IonInput, IonToggle, IonItemDivider, IonGrid, IonRow, IonCol,
  alertController, toastController
} from '@ionic/vue';
import { addOutline, trashOutline } from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import { useClientBranches } from '@/composables/useClientBranches';

const { user } = useAuth();
const { branches, fetchBranches, loading } = useClientBranches();

const showModal = ref(false);
const saving = ref(false);
const selectedBranch = ref(null);
const clientId = ref(null);

const formData = ref({
  name: '',
  is_headquarters: false,
  street: '',
  number: '',
  apt: '',
  neighborhood: '',
  municipality_city: '',
  state: '',
  postal_code: ''
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

const openNewBranch = () => {
  selectedBranch.value = null;
  resetForm();
  showModal.value = true;
};

const editBranch = (branch) => {
  selectedBranch.value = branch;
  formData.value = { ...branch };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    name: '',
    is_headquarters: false,
    street: '',
    number: '',
    apt: '',
    neighborhood: '',
    municipality_city: '',
    state: '',
    postal_code: ''
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

const saveBranch = async () => {
  if (!formData.value.name || !formData.value.street || !formData.value.municipality_city) {
    showToast('Complete los campos obligatorios', 'warning');
    return;
  }

  saving.value = true;
  try {
    const branchData = {
      client_id: clientId.value,
      name: formData.value.name,
      is_headquarters: formData.value.is_headquarters,
      street: formData.value.street,
      number: formData.value.number,
      apt: formData.value.apt || null,
      neighborhood: formData.value.neighborhood,
      municipality_city: formData.value.municipality_city,
      state: formData.value.state,
      postal_code: formData.value.postal_code,
      updated_at: new Date().toISOString()
    };

    let error;
    if (selectedBranch.value) {
      ({ error } = await supabase
        .from('client_branches')
        .update(branchData)
        .eq('id', selectedBranch.value.id));
    } else {
      ({ error } = await supabase
        .from('client_branches')
        .insert(branchData));
    }

    if (error) throw error;

    showToast('Sucursal guardada correctamente');
    await fetchBranches(clientId.value);
    closeModal();
  } catch (error) {
    console.error('Error saving branch:', error);
    showToast('Error al guardar la sucursal', 'danger');
  } finally {
    saving.value = false;
  }
};

const deleteBranch = async (branch) => {
  const alert = await alertController.create({
    header: 'Eliminar Sucursal',
    message: `¿Estás seguro de que deseas eliminar ${branch.name}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const { error } = await supabase
              .from('client_branches')
              .delete()
              .eq('id', branch.id);

            if (error) throw error;
            showToast('Sucursal eliminada');
            await fetchBranches(clientId.value);
          } catch (error) {
            console.error('Error deleting branch:', error);
            showToast('Error al eliminar', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

onMounted(async () => {
  await loadClientId();
  if (clientId.value) {
    await fetchBranches(clientId.value);
  }
});
</script>

<style scoped>
.text-small {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}
</style>
