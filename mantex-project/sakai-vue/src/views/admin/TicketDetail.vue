<template>
    <div class="grid grid-cols-12 gap-8">
        <div v-if="loading" class="col-span-12 text-center p-8">
            <ProgressSpinner />
            <p class="text-muted-color mt-4">Cargando información del ticket...</p>
        </div>

        <div v-else-if="!ticket" class="col-span-12">
            <div class="card flex flex-col items-center justify-center p-8 text-center">
                <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-4"></i>
                <h2 class="text-xl font-bold mb-2">Ticket no encontrado</h2>
                <p class="text-muted-color mb-6">No se pudo encontrar la información solicitada.</p>
                <Button label="Volver al listado" icon="pi pi-arrow-left" @click="$router.go(-1)" />
            </div>
        </div>

        <template v-else>
            <!-- Header Card -->
            <div class="col-span-12">
                <div class="card mb-0">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary text-2xl font-bold">
                                #{{ ticket.ticketNumber?.slice(-4) || '???' }}
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold m-0">{{ ticket.title }}</h1>
                                <div class="text-muted-color mt-1 flex items-center gap-3">
                                    <span><i class="pi pi-hashtag mr-1"></i>{{ ticket.ticketNumber }}</span>
                                    <span><i class="pi pi-calendar mr-1"></i>{{ formatDate(ticket.createdAt) }}</span>
                                </div>
                                <div class="flex gap-2 mt-3">
                                    <Tag :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" />
                                    <Tag :value="getPriorityLabel(ticket.priority)" :severity="getPrioritySeverity(ticket.priority)" icon="pi pi-flag" />
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button label="Volver" icon="pi pi-arrow-left" outlined @click="$router.go(-1)" />
                            <Button label="Editar" icon="pi pi-pencil" severity="secondary" @click="showEditDialog = true" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Left Column: Context Info -->
            <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
                
                <!-- Client Info -->
                <div class="card mb-0">
                    <div class="font-semibold text-xl mb-4">Cliente</div>
                    <div class="flex items-center gap-3 mb-4">
                        <Avatar 
                            :label="ticket.client?.companyName?.charAt(0)" 
                            size="large" 
                            shape="circle" 
                            class="text-lg font-bold"
                            :style="{ 'background-color': 'var(--primary-color)', 'color': '#ffffff' }"
                        />
                        <div>
                            <div class="font-bold">{{ ticket.client?.companyName || 'N/A' }}</div>
                            <div class="text-sm text-muted-color">{{ ticket.client?.contactPerson }}</div>
                        </div>
                    </div>
                    <ul class="list-none p-0 m-0 flex flex-col gap-3">
                        <li class="flex items-center gap-3" v-if="ticket.client?.email">
                            <i class="pi pi-envelope text-muted-color"></i>
                            <span class="text-sm">{{ ticket.client.email }}</span>
                        </li>
                        <li class="flex items-center gap-3" v-if="ticket.client?.phone">
                            <i class="pi pi-phone text-muted-color"></i>
                            <span class="text-sm">{{ ticket.client.phone }}</span>
                        </li>
                    </ul>
                </div>

                <!-- Location & Map -->
                <div class="card mb-0">
                    <div class="font-semibold text-xl mb-4">Ubicación</div>
                    
                    <!-- Branch Info -->
                    <div v-if="ticket.branch" class="mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-border">
                        <div class="font-medium mb-1">{{ ticket.branch.name }}</div>
                        <div class="text-sm text-muted-color">{{ ticket.branch.fullAddress }}</div>
                    </div>
                    <div v-else class="mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-border">
                         <div class="text-sm text-muted-color">{{ ticket.client?.fullAddress || 'Sin dirección registrada' }}</div>
                    </div>

                    <div class="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 h-48">
                         <GoogleMapView :markers="mapMarkers" :height="'100%'" />
                    </div>
                    
                    <div class="mt-3 flex gap-3 flex-wrap text-xs">
                        <div class="flex align-items-center gap-2">
                            <div class="w-2 h-2 border-circle bg-red-500"></div>
                            <span>Trabajo</span>
                        </div>
                        <div v-if="hasBranchLocation" class="flex align-items-center gap-2">
                            <div class="w-2 h-2 border-circle bg-green-500"></div>
                            <span>Sucursal</span>
                        </div>
                        <div v-if="hasSupplierLocation" class="flex align-items-center gap-2">
                            <div class="w-2 h-2 border-circle bg-blue-500"></div>
                            <span>Proveedor</span>
                        </div>
                    </div>
                </div>

                <!-- Supplier Info -->
                <div class="card mb-0">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-xl">Proveedor</div>
                        <Tag v-if="!ticket.supplier" value="No Asignado" severity="warning" />
                    </div>
                    
                    <div v-if="ticket.supplier">
                        <div class="flex items-center gap-3 mb-4">
                            <Avatar 
                                :label="ticket.supplier.companyName?.charAt(0)" 
                                size="large" 
                                shape="circle" 
                                class="text-lg font-bold bg-blue-500 text-white"
                            />
                            <div>
                                <div class="font-bold">{{ ticket.supplier.companyName }}</div>
                                <div class="text-sm text-muted-color">{{ ticket.supplier.contactPerson }}</div>
                            </div>
                        </div>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li class="flex items-center gap-3" v-if="ticket.supplier.email">
                                <i class="pi pi-envelope text-muted-color"></i>
                                <span class="text-sm">{{ ticket.supplier.email }}</span>
                            </li>
                            <li class="flex items-center gap-3" v-if="ticket.supplier.phone">
                                <i class="pi pi-phone text-muted-color"></i>
                                <span class="text-sm">{{ ticket.supplier.phone }}</span>
                            </li>
                        </ul>
                    </div>
                    <div v-else class="text-center p-4 text-muted-color text-sm">
                        Este ticket aún no tiene un proveedor asignado.
                        <Button label="Asignar Proveedor" link class="p-0 mt-2" />
                    </div>
                </div>

                <!-- Asset Info (Optional) -->
                <div v-if="ticket.asset" class="card mb-0">
                    <div class="font-semibold text-xl mb-4">Activo Relacionado</div>
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-box text-xl text-muted-color"></i>
                        </div>
                        <div>
                            <div class="font-medium">{{ ticket.asset.name }}</div>
                            <div class="text-sm text-muted-color mb-1">{{ ticket.asset.brand }} {{ ticket.asset.model }}</div>
                            <Tag :value="ticket.asset.category" severity="info" class="text-xs" />
                            <div v-if="ticket.asset.serialNumber" class="text-xs text-muted-color mt-2">
                                S/N: {{ ticket.asset.serialNumber }}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right Column: Operational Tabs -->
            <div class="col-span-12 lg:col-span-8">
                <div class="card h-full p-0 overflow-hidden">
                    <TabView class="h-full flex flex-col">
                        
                        <!-- Tab 1: Detalles -->
                        <TabPanel>
                            <template #header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-info-circle"></i>
                                    <span>Detalles</span>
                                </div>
                            </template>
                            <div class="p-4">
                                <div class="mb-6">
                                    <h3 class="text-lg font-semibold mb-3">Descripción del Problema</h3>
                                    <p class="leading-relaxed text-surface-700 dark:text-surface-200 bg-surface-50 dark:bg-surface-800 p-4 rounded-border">
                                        {{ ticket.description }}
                                    </p>
                                </div>

                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <div class="text-sm text-muted-color mb-1">Fecha Programada</div>
                                        <div class="font-medium flex items-center gap-2">
                                            <i class="pi pi-calendar text-primary"></i>
                                            {{ ticket.scheduledDate ? formatDate(ticket.scheduledDate) : 'No programada' }}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-muted-color mb-1">Tipo de Mantenimiento</div>
                                        <div class="font-medium">Correctivo</div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Tab 2: Imágenes -->
                        <TabPanel>
                            <template #header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-images"></i>
                                    <span>Evidencias</span>
                                    <Badge :value="ticket.attachments?.length || 0" severity="secondary" />
                                </div>
                            </template>
                            <div class="p-4">
                                <ImageGallery :items="ticket.attachments || []" />
                            </div>
                        </TabPanel>

                        <!-- Tab 3: Cotización -->
                        <TabPanel>
                            <template #header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-file-edit"></i>
                                    <span>Cotización</span>
                                </div>
                            </template>
                            <div class="p-4">
                                <QuoteForm :ticketId="id" />
                            </div>
                        </TabPanel>

                        <!-- Tab 4: Chat -->
                        <TabPanel>
                            <template #header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-comments"></i>
                                    <span>Chat</span>
                                </div>
                            </template>
                            <div class="p-0 h-[600px]">
                                <TicketChat :ticketId="ticket.id" />
                            </div>
                        </TabPanel>

                    </TabView>
                </div>
            </div>
        </template>

        <!-- Edit Dialog -->
        <Dialog v-model:visible="showEditDialog" header="Editar Ticket" modal class="p-fluid" :style="{ width: '500px' }">
            <div class="flex flex-column gap-4 py-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Título</label>
                    <InputText v-model="editForm.title" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Descripción</label>
                    <Textarea v-model="editForm.description" rows="4" autoResize />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Prioridad</label>
                        <Dropdown v-model="editForm.priority" :options="priorities" optionLabel="label" optionValue="value" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Estado</label>
                        <Dropdown v-model="editForm.status" :options="statuses" optionLabel="label" optionValue="value" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="showEditDialog = false" />
                <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Avatar from 'primevue/avatar';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

import GoogleMapView from '@/components/maps/GoogleMapView.vue';
import ImageGallery from '@/components/common/ImageGallery.vue';
import TicketChat from '@/components/ticket/TicketChat.vue';
import QuoteForm from '@/components/quotes/QuoteForm.vue';
import { getJob, updateJob } from '@/api/jobs.js';
import { useAuth } from '@/composables/useAuth';

const route = useRoute();
const toast = useToast();
const { profile } = useAuth();

const id = route.params.id;

const ticket = ref(null);
const loading = ref(true);
const saving = ref(false);
const showEditDialog = ref(false);

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
    showEditDialog.value = false;

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
:deep(.p-tabview-nav) {
    border-width: 0 0 1px 0;
}

:deep(.p-tabview-panels) {
    padding: 0;
}
</style>