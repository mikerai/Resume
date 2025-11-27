<template>
  <div class="grid grid-cols-12">
    <Card class="">
      <template #title>
        <div class="col-span-12">
          <span>Detalle del Ticket</span>
          <Tag v-if="ticket" :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" />
        </div>
      </template>

      <template #content>
        <div v-if="loading" class="text-center p-5">
          <ProgressSpinner />
          <p class="text-sm text-gray-500 mt-3">Cargando...</p>
        </div>

        <div v-else-if="!ticket">
          <Message severity="warn">Ticket no encontrado.</Message>
        </div>

        <div v-else class="flex flex-column gap-4">
          
          <!-- INFORMACIÓN PRINCIPAL -->
          <Panel header="Información General" toggleable>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Título</label>
                  <p class="text-base">{{ ticket.title }}</p>
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Descripción</label>
                  <p class="text-base">{{ ticket.description }}</p>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Número de ticket</label>
                  <p class="text-base">{{ ticket.ticketNumber || 'N/A' }}</p>
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Prioridad</label>
                  <Tag :value="getPriorityLabel(ticket.priority)" :severity="getPrioritySeverity(ticket.priority)" />
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Fecha de creación</label>
                  <p class="text-base">{{ formatDate(ticket.createdAt) }}</p>
                </div>
                <div v-if="ticket.scheduledDate" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Fecha programada</label>
                  <p class="text-base">{{ formatDate(ticket.scheduledDate) }}</p>
                </div>
              </div>
            </div>
          </Panel>

          <!-- INFORMACIÓN DEL CLIENTE -->
          <Panel header="Cliente" toggleable>
            <div class="grid grid-cols-12">
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Empresa</label>
                  <p class="text-base">{{ ticket.client?.companyName || 'N/A' }}</p>
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Contacto</label>
                  <p class="text-base">{{ ticket.client?.contactPerson || 'N/A' }}</p>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div v-if="ticket.client?.email" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Email</label>
                  <p class="text-base">{{ ticket.client.email }}</p>
                </div>
                <div v-if="ticket.client?.phone" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Teléfono</label>
                  <p class="text-base">{{ ticket.client.phone }}</p>
                </div>
                <div v-if="ticket.client?.fullAddress" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Dirección</label>
                  <p class="text-base">{{ ticket.client.fullAddress }}</p>
                </div>
              </div>
            </div>
          </Panel>

          <!-- INFORMACIÓN DE LA SUCURSAL -->
          <Panel v-if="ticket.branch" header="Sucursal" toggleable>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Nombre</label>
                  <p class="text-base">{{ ticket.branch.name }}</p>
                </div>
                <div v-if="ticket.branch.fullAddress" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Dirección</label>
                  <p class="text-base">{{ ticket.branch.fullAddress }}</p>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div v-if="ticket.branch.contactPerson" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Contacto</label>
                  <p class="text-base">{{ ticket.branch.contactPerson }}</p>
                </div>
                <div v-if="ticket.branch.phone" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Teléfono</label>
                  <p class="text-base">{{ ticket.branch.phone }}</p>
                </div>
              </div>
            </div>
          </Panel>

          <!-- INFORMACIÓN DEL ACTIVO -->
          <Panel v-if="ticket.asset" header="Activo" toggleable>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Nombre</label>
                  <p class="text-base">{{ ticket.asset.name }}</p>
                </div>
                <div v-if="ticket.asset.category" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Categoría</label>
                  <p class="text-base">{{ ticket.asset.category }}</p>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div v-if="ticket.asset.brand" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Marca</label>
                  <p class="text-base">{{ ticket.asset.brand }}</p>
                </div>
                <div v-if="ticket.asset.serialNumber" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Número de Serie</label>
                  <p class="text-base">{{ ticket.asset.serialNumber }}</p>
                </div>
              </div>
            </div>
          </Panel>

          <!-- INFORMACIÓN DEL PROVEEDOR -->
          <Panel v-if="ticket.supplier" header="Proveedor Asignado" toggleable>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Empresa</label>
                  <p class="text-base">{{ ticket.supplier.companyName }}</p>
                </div>
                <div class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Contacto</label>
                  <p class="text-base">{{ ticket.supplier.contactPerson || 'N/A' }}</p>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div v-if="ticket.supplier.email" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Email</label>
                  <p class="text-base">{{ ticket.supplier.email }}</p>
                </div>
                <div v-if="ticket.supplier.phone" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Teléfono</label>
                  <p class="text-base">{{ ticket.supplier.phone }}</p>
                </div>
                <div v-if="ticket.supplier.fullAddress" class="mb-3">
                  <label class="block text-sm font-semibold mb-1">Dirección</label>
                  <p class="text-base">{{ ticket.supplier.fullAddress }}</p>
                </div>
              </div>
            </div>
          </Panel>

          <!-- MAPA DE UBICACIONES -->
          <Panel v-if="mapMarkers.length > 0" header="Ubicaciones" toggleable>
            <GoogleMapView :markers="mapMarkers" height="400px" />
            <div class="mt-3 flex gap-3 flex-wrap">
              <div class="flex align-items-center gap-2">
                <div class="w-1rem h-1rem border-circle" style="background-color: #EA4335;"></div>
                <span class="text-sm">Ubicación del Trabajo</span>
              </div>
              <div v-if="hasBranchLocation" class="flex align-items-center gap-2">
                <div class="w-1rem h-1rem border-circle" style="background-color: #34A853;"></div>
                <span class="text-sm">Sucursal</span>
              </div>
              <div v-if="hasSupplierLocation" class="flex align-items-center gap-2">
                <div class="w-1rem h-1rem border-circle" style="background-color: #4285F4;"></div>
                <span class="text-sm">Proveedor</span>
              </div>
            </div>
          </Panel>

          <!-- GALERÍA DE IMÁGENES -->
          <Panel header="Fotos del Ticket" toggleable>
            <ImageGallery :items="ticket.attachments || []" />
          </Panel>

          <!-- CHAT -->
          <Panel header="Chat en Vivo" toggleable>
            <TicketChat :ticketId="ticket.id" />
          </Panel>

          <!-- FORMULARIO DE EDICIÓN -->
          <Panel header="Editar Ticket" toggleable>
            <div class="flex flex-column gap-3">
              <div>
                <label class="block text-sm mb-2">Título</label>
                <InputText v-model="editForm.title" class="w-full" />
              </div>

              <div>
                <label class="block text-sm mb-2">Descripción</label>
                <Textarea
                  v-model="editForm.description"
                  rows="4"
                  class="w-full"
                  autoResize
                />
              </div>

              <div class="grid">
                <div class="col-12 md:col-6">
                  <label class="block text-sm mb-2">Prioridad</label>
                  <Dropdown
                    v-model="editForm.priority"
                    :options="priorities"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>

                <div class="col-12 md:col-6">
                  <label class="block text-sm mb-2">Estatus</label>
                  <Dropdown
                    v-model="editForm.status"
                    :options="statuses"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="flex justify-content-end gap-2">
                <Button
                  label="Cancelar"
                  severity="secondary"
                  outlined
                  @click="resetForm"
                />
                <Button
                  label="Guardar Cambios"
                  :loading="saving"
                  @click="save"
                />
              </div>
            </div>
          </Panel>

        </div>
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';

import GoogleMapView from '@/components/maps/GoogleMapView.vue';
import ImageGallery from '@/components/common/ImageGallery.vue';
import TicketChat from '@/components/ticket/TicketChat.vue';
import { getJob, updateJob } from '@/api/jobs.js';

const route = useRoute();
const toast = useToast();

const id = route.params.id;

const ticket = ref(null);
const loading = ref(true);
const saving = ref(false);

const editForm = ref({
  title: '',
  description: '',
  priority: '',
  status: ''
});

const priorities = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' },
  { label: 'Urgente', value: 'urgent' }
];

const statuses = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Abierto', value: 'opened' },
  { label: 'Asignado', value: 'assigned' },
  { label: 'En Proceso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'cancelled' }
];

const mapMarkers = computed(() => {
  const markers = [];
  
  // Ticket location (from latitude/longitude on ticket)
  if (ticket.value?.latitude && ticket.value?.longitude) {
    markers.push({
      lat: ticket.value.latitude,
      lng: ticket.value.longitude,
      title: 'Ubicación del Trabajo',
      color: 'red',
      info: ticket.value.locationAddress || 'Ubicación del servicio'
    });
  }
  
  // Branch location
  if (ticket.value?.branch?.latitude && ticket.value?.branch?.longitude) {
    markers.push({
      lat: ticket.value.branch.latitude,
      lng: ticket.value.branch.longitude,
      title: `Sucursal: ${ticket.value.branch.name}`,
      color: 'green',
      info: ticket.value.branch.fullAddress || ''
    });
  }
  
  // Supplier location
  if (ticket.value?.supplier?.latitude && ticket.value?.supplier?.longitude) {
    markers.push({
      lat: ticket.value.supplier.latitude,
      lng: ticket.value.supplier.longitude,
      title: `Proveedor: ${ticket.value.supplier.companyName}`,
      color: 'blue',
      info: ticket.value.supplier.fullAddress || ''
    });
  }
  
  return markers;
});

const hasBranchLocation = computed(() => {
  return ticket.value?.branch?.latitude && ticket.value?.branch?.longitude;
});

const hasSupplierLocation = computed(() => {
  return ticket.value?.supplier?.latitude && ticket.value?.supplier?.longitude;
});

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    opened: 'Abierto',
    assigned: 'Asignado',
    in_progress: 'En proceso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
};

const getStatusSeverity = (status) => {
  const severities = {
    pending: 'warn',
    opened: 'info',
    assigned: 'info',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger'
  };
  return severities[status] || 'info';
};

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };
  return labels[priority] || priority;
};

const getPrioritySeverity = (priority) => {
  const severities = {
    low: 'success',
    medium: 'info',
    high: 'warn',
    urgent: 'danger'
  };
  return severities[priority] || 'info';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resetForm = () => {
  if (ticket.value) {
    editForm.value = {
      title: ticket.value.title,
      description: ticket.value.description,
      priority: ticket.value.priority,
      status: ticket.value.status
    };
  }
};

onMounted(async () => {
  const data = await getJob(id);
  ticket.value = data;

  if (data) {
    resetForm();
  }

  loading.value = false;
});

const save = async () => {
  try {
    saving.value = true;

    await updateJob(id, { ...editForm.value });

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Los cambios fueron aplicados correctamente',
      life: 3000
    });

    // Reload ticket data
    const data = await getJob(id);
    ticket.value = data;

  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron guardar los cambios',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.w-1rem {
  width: 1rem;
}

.h-1rem {
  height: 1rem;
}
</style>