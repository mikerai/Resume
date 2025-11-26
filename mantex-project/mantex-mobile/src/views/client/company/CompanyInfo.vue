<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/client/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Información de Empresa</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openEditDialog">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="company" class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-label>
              <h3>Nombre Comercial</h3>
              <p>{{ company.company_name || 'No especificado' }}</p>
            </ion-label>
          </ion-item>
          
          <ion-item>
            <ion-label>
              <h3>Razón Social</h3>
              <p>{{ company.legal_name || 'No especificado' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-label>
              <h3>RFC</h3>
              <p>{{ company.tax_id || 'No especificado' }}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-label class="ion-text-wrap">
              <h3>Régimen Fiscal</h3>
              <p>{{ getFiscalRegimeLabel(company.fiscal_regime) || 'No especificado' }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Modal for Edit -->
      <ion-modal :is-open="showModal" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="closeModal">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Editar Información</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="saveCompany" :disabled="saving">Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre Comercial *</ion-label>
              <ion-input v-model="formData.company_name" placeholder="Ej. Mi Empresa S.A."></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label position="stacked">Razón Social</ion-label>
              <ion-input v-model="formData.legal_name" placeholder="Ej. Mi Empresa S.A. de C.V."></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">RFC</ion-label>
              <ion-input v-model="formData.tax_id" placeholder="Ej. XAXX010101000" maxlength="13"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Régimen Fiscal</ion-label>
              <ion-select v-model="formData.fiscal_regime" placeholder="Seleccionar">
                <ion-select-option v-for="regime in fiscalRegimes" :key="regime.value" :value="regime.value">
                  {{ regime.label }}
                </ion-select-option>
              </ion-select>
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
  IonList, IonItem, IonLabel, IonIcon, IonSpinner,
  IonModal, IonInput, IonSelect, IonSelectOption,
  toastController
} from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';

const { user } = useAuth();

const company = ref(null);
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);

const formData = ref({
  company_name: '',
  legal_name: '',
  tax_id: '',
  fiscal_regime: ''
});

const fiscalRegimes = [
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '603 - Personas Morales con Fines no Lucrativos', value: '603' },
    { label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios', value: '605' },
    { label: '606 - Arrendamiento', value: '606' },
    { label: '608 - Demás ingresos', value: '608' },
    { label: '612 - Personas Físicas con Actividades Empresariales y Profesionales', value: '612' },
    { label: '621 - Incorporación Fiscal', value: '621' },
    { label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', value: '625' },
    { label: '626 - Régimen Simplificado de Confianza', value: '626' }
];

const loadCompanyData = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        company.value = data;
    } catch (error) {
        console.error('Error loading company:', error);
        showToast('Error al cargar información', 'danger');
    } finally {
        loading.value = false;
    }
};

const openEditDialog = () => {
    formData.value = {
        company_name: company.value?.company_name || '',
        legal_name: company.value?.legal_name || '',
        tax_id: company.value?.tax_id || '',
        fiscal_regime: company.value?.fiscal_regime || ''
    };
    showModal.value = true;
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

const getFiscalRegimeLabel = (value) => {
    const regime = fiscalRegimes.find(r => r.value === value);
    return regime ? regime.label : value;
};

const saveCompany = async () => {
  if (!formData.value.company_name) {
    showToast('El nombre comercial es obligatorio', 'warning');
    return;
  }

  saving.value = true;
  try {
    const { error } = await supabase
        .from('clients')
        .update({
            company_name: formData.value.company_name,
            legal_name: formData.value.legal_name,
            tax_id: formData.value.tax_id,
            fiscal_regime: formData.value.fiscal_regime,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', user.value.id);

    if (error) throw error;

    showToast('Información actualizada correctamente');
    await loadCompanyData();
    closeModal();
  } catch (error) {
    console.error('Error saving company:', error);
    showToast('Error al guardar', 'danger');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
    loadCompanyData();
});
</script>
