<template>
  <div class="quote-form">
    <ion-spinner v-if="loading" name="crescent"></ion-spinner>

    <div v-else-if="!quote && profile?.role !== 'supplier'" class="ion-text-center ion-padding">
      <ion-icon :icon="documentOutline" size="large" color="medium"></ion-icon>
      <p class="ion-padding-top">No hay cotización disponible para este ticket.</p>
    </div>

    <div v-else>
      <!-- Header Status -->
      <ion-card>
        <ion-card-header>
          <div class="flex ion-justify-content-between ion-align-items-center">
            <ion-card-subtitle>Estado</ion-card-subtitle>
            <ion-badge :color="statusColor">{{ statusLabel }}</ion-badge>
          </div>
        </ion-card-header>
        <ion-card-content v-if="quote?.updated_at" class="ion-no-padding-top">
          <p class="ion-no-margin text-sm text-muted">
            Última actualización: {{ new Date(quote.updated_at).toLocaleDateString() }}
          </p>
        </ion-card-content>
      </ion-card>

      <!-- Read Only View (Sent/Approved/Rejected) -->
      <div v-if="!isEditable">
        <ion-list>
          <ion-list-header>
            <ion-label>Items de la Cotización</ion-label>
          </ion-list-header>
          <ion-item v-for="(item, index) in items" :key="index">
            <ion-label>
              <h3>{{ item.description }}</h3>
              <p>Cantidad: {{ item.quantity }} | Precio: {{ formatCurrency(item.unit_price) }}</p>
              <p><strong>Total: {{ formatCurrency(item.quantity * item.unit_price) }}</strong></p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-card>
          <ion-card-content>
            <ion-item lines="none">
              <ion-label>Subtotal</ion-label>
              <ion-note slot="end">{{ formatCurrency(subtotal) }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>IVA (16%)</ion-label>
              <ion-note slot="end">{{ formatCurrency(taxAmount) }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label><strong>Total</strong></ion-label>
              <ion-note slot="end"><strong>{{ formatCurrency(totalAmount) }}</strong></ion-note>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="quote.notes">
          <ion-card-header>
            <ion-card-subtitle>Notas</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>{{ quote.notes }}</p>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="quote.status === 'rejected'" color="danger">
          <ion-card-header>
            <ion-card-subtitle>Motivo de rechazo</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>{{ quote.rejection_reason || 'Sin motivo especificado' }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Botones de Aprobación (Solo Client) -->
        <div v-if="canApprove" class="ion-padding">
          <ion-button expand="block" color="success" @click="updateStatus('approved')" :disabled="saving">
            <ion-icon slot="start" :icon="checkmarkOutline"></ion-icon>
            Aprobar Cotización
          </ion-button>
          <ion-button expand="block" color="danger" fill="outline" @click="openRejectDialog" :disabled="saving" class="ion-margin-top">
            <ion-icon slot="start" :icon="closeOutline"></ion-icon>
            Rechazar Cotización
          </ion-button>
        </div>
      </div>

      <!-- Editable Form (Draft) -->
      <div v-else>
        <ion-list>
          <ion-list-header>
            <ion-label>Items</ion-label>
            <ion-button size="small" @click="addItem">
              <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
            </ion-button>
          </ion-list-header>

          <ion-item v-for="(item, index) in items" :key="index">
            <ion-label position="stacked">Descripción</ion-label>
            <ion-input v-model="item.description" placeholder="Descripción del servicio/producto"></ion-input>
            <div class="ion-margin-top" style="width: 100%;">
              <ion-label position="stacked">Cantidad</ion-label>
              <ion-input type="number" v-model.number="item.quantity" min="0.01" step="0.01"></ion-input>
            </div>
            <div class="ion-margin-top" style="width: 100%;">
              <ion-label position="stacked">Precio Unitario</ion-label>
              <ion-input type="number" v-model.number="item.unit_price" min="0" step="0.01"></ion-input>
            </div>
            <div class="ion-margin-top" style="width: 100%;">
              <p><strong>Total: {{ formatCurrency(item.quantity * item.unit_price) }}</strong></p>
            </div>
            <ion-button slot="end" fill="clear" color="danger" @click="removeItem(index)">
              <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>

        <ion-item>
          <ion-label position="stacked">Notas / Condiciones</ion-label>
          <ion-textarea v-model="notes" rows="4" placeholder="Detalles adicionales, condiciones de pago, tiempo de entrega..."></ion-textarea>
        </ion-item>

        <ion-card>
          <ion-card-content>
            <ion-item lines="none">
              <ion-label>Subtotal</ion-label>
              <ion-note slot="end">{{ formatCurrency(subtotal) }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>IVA (16%)</ion-label>
              <ion-note slot="end">{{ formatCurrency(taxAmount) }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label><strong>Total</strong></ion-label>
              <ion-note slot="end"><strong>{{ formatCurrency(totalAmount) }}</strong></ion-note>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <div class="ion-padding">
          <ion-button expand="block" fill="outline" @click="saveQuote('draft')" :disabled="saving">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
            Guardar Borrador
          </ion-button>
          <ion-button expand="block" @click="saveQuote('sent')" :disabled="saving" class="ion-margin-top">
            <ion-icon slot="start" :icon="sendOutline"></ion-icon>
            Enviar al Cliente
          </ion-button>
        </div>
      </div>
    </div>

    <!-- Dialogo de Rechazo -->
    <ion-modal :is-open="showRejectDialog" @didDismiss="showRejectDialog = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Rechazar Cotización</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showRejectDialog = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p>Por favor indica el motivo del rechazo para que el proveedor pueda corregirlo.</p>
        <ion-item>
          <ion-label position="stacked">Motivo del rechazo</ion-label>
          <ion-textarea v-model="rejectionReason" rows="3" placeholder="Motivo del rechazo..."></ion-textarea>
        </ion-item>
        <ion-button expand="block" color="danger" @click="confirmReject" :disabled="saving" class="ion-margin-top">
          Confirmar Rechazo
        </ion-button>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  IonSpinner, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonBadge,
  IonList, IonListHeader, IonItem, IonLabel, IonNote, IonButton, IonIcon,
  IonInput, IonTextarea, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
  toastController
} from '@ionic/vue';
import {
  documentOutline, checkmarkOutline, closeOutline, addOutline, trashOutline,
  saveOutline, sendOutline
} from 'ionicons/icons';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['quote-updated']);

const { user, profile } = useAuth();

const loading = ref(false);
const saving = ref(false);
const quote = ref(null);
const items = ref([]);
const supplierId = ref(null);
const notes = ref('');
const validUntil = ref(null);
const showRejectDialog = ref(false);
const rejectionReason = ref('');

const defaultItem = {
  description: '',
  quantity: 1,
  unit_price: 0
};

const subtotal = computed(() => {
  return items.value.reduce((acc, item) => {
    return acc + (item.quantity * item.unit_price);
  }, 0);
});

const taxAmount = computed(() => {
  return subtotal.value * 0.16;
});

const totalAmount = computed(() => {
  return subtotal.value + taxAmount.value;
});

const isEditable = computed(() => {
  if (profile.value?.role !== 'supplier') return false;
  return !quote.value || quote.value.status === 'draft' || quote.value.status === 'rejected';
});

const canApprove = computed(() => {
  return profile.value?.role === 'client' && quote.value?.status === 'sent';
});

const statusColor = computed(() => {
  if (!quote.value) return 'medium';
  switch (quote.value.status) {
    case 'draft': return 'medium';
    case 'sent': return 'primary';
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'cancelled': return 'warning';
    default: return 'medium';
  }
});

const statusLabel = computed(() => {
  if (!quote.value) return 'Nueva Cotización';
  switch (quote.value.status) {
    case 'draft': return 'Borrador';
    case 'sent': return 'Enviada';
    case 'approved': return 'Aprobada';
    case 'rejected': return 'Rechazada';
    case 'cancelled': return 'Cancelada';
    default: return quote.value.status;
  }
});

onMounted(async () => {
  if (profile.value?.role === 'supplier') {
    await fetchSupplierId();
  }
  await fetchQuote();
});

const fetchSupplierId = async () => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.value.id)
      .single();
      
    if (error) throw error;
    supplierId.value = data.id;
  } catch (error) {
    console.error('Error fetching supplier ID:', error);
  }
};

const fetchQuote = async () => {
  loading.value = true;
  try {
    let query = supabase
      .from('quotes')
      .select('*')
      .eq('ticket_id', props.ticketId);

    if (supplierId.value) {
      query = query.eq('supplier_id', supplierId.value);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      quote.value = data;
      notes.value = data.notes;
      validUntil.value = data.valid_until;
      
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', data.id);
        
      if (itemsError) throw itemsError;
      
      items.value = quoteItems.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price)
      }));
    } else {
      if (profile.value?.role === 'supplier') {
        items.value = [{ ...defaultItem }];
      } else {
        items.value = [];
      }
    }
  } catch (error) {
    console.error('Error fetching quote:', error);
    showToast('Error al cargar la cotización', 'danger');
  } finally {
    loading.value = false;
  }
};

const addItem = () => {
  items.value.push({ ...defaultItem });
};

const removeItem = (index) => {
  items.value.splice(index, 1);
};

const validateForm = () => {
  if (items.value.length === 0) {
    showToast('Debe agregar al menos un ítem', 'warning');
    return false;
  }
  
  for (const item of items.value) {
    if (!item.description || item.description.trim() === '') {
      showToast('Todos los ítems deben tener descripción', 'warning');
      return false;
    }
    if (item.quantity <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'warning');
      return false;
    }
  }
  return true;
};

const saveQuote = async (status = 'draft') => {
  if (!validateForm()) return;
  
  saving.value = true;
  try {
    const quoteData = {
      ticket_id: props.ticketId,
      supplier_id: supplierId.value,
      status: status,
      total_amount: totalAmount.value,
      tax_amount: taxAmount.value,
      notes: notes.value,
      valid_until: validUntil.value
    };

    let savedQuote;

    if (quote.value?.id) {
      const { data, error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', quote.value.id)
        .select()
        .single();
        
      if (error) throw error;
      savedQuote = data;
    } else {
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single();
        
      if (error) throw error;
      savedQuote = data;
    }

    if (quote.value?.id) {
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', savedQuote.id);
      if (deleteError) throw deleteError;
    }

    const itemsToInsert = items.value.map(item => ({
      quote_id: savedQuote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);
      
    if (itemsError) throw itemsError;

    quote.value = savedQuote;
    
    showToast(
      status === 'sent' ? 'Cotización enviada al cliente' : 'Borrador guardado',
      'success'
    );
    
    emit('quote-updated', savedQuote);
    
    if (status === 'sent') {
      await fetchQuote();
    }

  } catch (error) {
    console.error('Error saving quote:', error);
    showToast('No se pudo guardar la cotización', 'danger');
  } finally {
    saving.value = false;
  }
};

const updateStatus = async (newStatus, reason = null) => {
  saving.value = true;
  try {
    const updateData = { status: newStatus };
    if (reason) updateData.rejection_reason = reason;
    
    const { error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', quote.value.id);
      
    if (error) throw error;
    
    quote.value.status = newStatus;
    if (reason) quote.value.rejection_reason = reason;
    
    showToast(`Cotización ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`, 'success');
    emit('quote-updated', quote.value);
    showRejectDialog.value = false;
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('No se pudo actualizar el estado', 'danger');
  } finally {
    saving.value = false;
  }
};

const openRejectDialog = () => {
  rejectionReason.value = '';
  showRejectDialog.value = true;
};

const confirmReject = () => {
  if (!rejectionReason.value.trim()) {
    showToast('Debe ingresar un motivo de rechazo', 'warning');
    return;
  }
  updateStatus('rejected', rejectionReason.value);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
};

const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  await toast.present();
};
</script>

<style scoped>
.text-sm {
  font-size: 0.875rem;
}

.text-muted {
  color: var(--ion-color-medium);
}
</style>
