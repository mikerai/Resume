<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Usuarios</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openNewPerson">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="contactPersons.length === 0" class="ion-text-center ion-padding">
        <p>No hay personas de contacto registradas</p>
        <ion-button @click="openNewPerson">Agregar Persona</ion-button>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="person in contactPersons" :key="person.id">
          <ion-item button @click="editPerson(person)">
            <ion-label>
              <h2>
                {{ getFullName(person) }}
                <ion-badge v-if="person.is_primary" color="primary" class="ml-2">Principal</ion-badge>
              </h2>
              <p>
                <ion-icon :icon="mailOutline" class="vertical-middle"></ion-icon>
                {{ person.email }}
              </p>
              <p>
                <ion-icon :icon="callOutline" class="vertical-middle"></ion-icon>
                {{ person.phone }}
              </p>
            </ion-label>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deletePerson(person)">
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
            <ion-title>{{ selectedPerson ? 'Editar' : 'Nueva' }} Persona</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="savePerson" :disabled="saving">Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre *</ion-label>
              <ion-input v-model="formData.first_name" placeholder="Ej. Juan"></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Apellido Paterno *</ion-label>
              <ion-input v-model="formData.last_name_paternal" placeholder="Ej. Pérez"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Apellido Materno</ion-label>
              <ion-input v-model="formData.last_name_maternal" placeholder="Ej. López"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Teléfono *</ion-label>
              <ion-input v-model="formData.phone" type="tel" placeholder="Ej. 5512345678"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Email *</ion-label>
              <ion-input v-model="formData.email" type="email" placeholder="Ej. juan@empresa.com"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label>Es Contacto Principal</ion-label>
              <ion-toggle v-model="formData.is_primary"></ion-toggle>
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
  IonModal, IonInput, IonToggle,
  alertController, toastController
} from '@ionic/vue';
import { addOutline, trashOutline, mailOutline, callOutline } from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';

const { user } = useAuth();

const contactPersons = ref([]);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const selectedPerson = ref(null);
const clientId = ref(null);

const formData = ref({
  first_name: '',
  last_name_paternal: '',
  last_name_maternal: '',
  phone: '',
  email: '',
  is_primary: false
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

const loadContactPersons = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('contact_persons')
            .select('*')
            .eq('client_id', clientId.value)
            .order('is_primary', { ascending: false })
            .order('first_name');

        if (error) throw error;
        contactPersons.value = data || [];
    } catch (error) {
        console.error('Error loading contact persons:', error);
        showToast('Error al cargar personas', 'danger');
    } finally {
        loading.value = false;
    }
};

const openNewPerson = () => {
  selectedPerson.value = null;
  resetForm();
  showModal.value = true;
};

const editPerson = (person) => {
  selectedPerson.value = person;
  formData.value = {
    first_name: person.first_name,
    last_name_paternal: person.last_name_paternal,
    last_name_maternal: person.last_name_maternal || '',
    phone: person.phone,
    email: person.email,
    is_primary: person.is_primary
  };
  showModal.value = true;
};

const resetForm = () => {
  formData.value = {
    first_name: '',
    last_name_paternal: '',
    last_name_maternal: '',
    phone: '',
    email: '',
    is_primary: false
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

const getFullName = (person) => {
    let name = `${person.first_name} ${person.last_name_paternal}`;
    if (person.last_name_maternal) {
        name += ` ${person.last_name_maternal}`;
    }
    return name;
};

const savePerson = async () => {
  if (!formData.value.first_name || !formData.value.last_name_paternal || !formData.value.phone || !formData.value.email) {
    showToast('Complete los campos obligatorios', 'warning');
    return;
  }

  saving.value = true;
  try {
    const personData = {
      client_id: clientId.value,
      first_name: formData.value.first_name,
      last_name_paternal: formData.value.last_name_paternal,
      last_name_maternal: formData.value.last_name_maternal || null,
      phone: formData.value.phone,
      email: formData.value.email,
      is_primary: formData.value.is_primary,
      updated_at: new Date().toISOString()
    };

    let error;
    if (selectedPerson.value) {
      ({ error } = await supabase
        .from('contact_persons')
        .update(personData)
        .eq('id', selectedPerson.value.id));
    } else {
      ({ error } = await supabase
        .from('contact_persons')
        .insert(personData));
    }

    if (error) throw error;

    showToast('Persona guardada correctamente');
    await loadContactPersons();
    closeModal();
  } catch (error) {
    console.error('Error saving person:', error);
    showToast('Error al guardar', 'danger');
  } finally {
    saving.value = false;
  }
};

const deletePerson = async (person) => {
  // Check dependency (branches)
  const { data: branchCount } = await supabase
      .from('client_branches')
      .select('id', { count: 'exact', head: true })
      .eq('contact_person_id', person.id);

  if (branchCount && branchCount.length > 0) {
      showToast('No se puede eliminar: tiene sucursales asignadas', 'warning');
      return;
  }

  const alert = await alertController.create({
    header: 'Eliminar Persona',
    message: `¿Estás seguro de que deseas eliminar a ${getFullName(person)}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const { error } = await supabase
              .from('contact_persons')
              .delete()
              .eq('id', person.id);

            if (error) throw error;
            showToast('Persona eliminada');
            await loadContactPersons();
          } catch (error) {
            console.error('Error deleting person:', error);
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
    await loadContactPersons();
  }
});
</script>

<style scoped>
.vertical-middle {
  vertical-align: middle;
  margin-right: 4px;
}
</style>
