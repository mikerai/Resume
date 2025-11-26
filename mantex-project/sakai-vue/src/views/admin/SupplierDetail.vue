<template>
  <div class="p-4">
    <div v-if="loading" class="text-center p-5">
      <ProgressSpinner />
      <p class="text-sm text-gray-500 mt-3">Cargando información del proveedor...</p>
    </div>

    <div v-else-if="!supplier">
      <Message severity="warn">Proveedor no encontrado.</Message>
      <Button label="Volver" icon="pi pi-arrow-left" @click="$router.go(-1)" class="mt-3" />
    </div>

    <div v-else class="flex flex-column gap-4">
      <!-- HEADER -->
      <div class="flex justify-content-between align-items-center">
        <div>
          <h1 class="text-2xl font-bold mb-1">{{ supplier.company_name || supplier.contact_person }}</h1>
          <p class="text-gray-500">{{ supplier.contact_person }}</p>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" outlined @click="$router.go(-1)" />
      </div>

      <!-- INFO CARDS -->
      <div class="grid">
        <div class="col-12 md:col-4">
          <Card>
            <template #title>Contacto</template>
            <template #content>
              <div class="flex flex-column gap-2">
                <div v-if="supplier.email">
                  <i class="pi pi-envelope mr-2 text-primary"></i>
                  <span>{{ supplier.email }}</span>
                </div>
                <div v-if="supplier.phone_number">
                  <i class="pi pi-phone mr-2 text-primary"></i>
                  <span>{{ supplier.phone_number }}</span>
                </div>
                <div v-if="supplier.rfc">
                  <i class="pi pi-id-card mr-2 text-primary"></i>
                  <span>{{ supplier.rfc }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-8">
          <Card>
            <template #title>Dirección Fiscal</template>
            <template #content>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-map-marker mt-1 text-primary"></i>
                <span>{{ supplier.full_address || 'Sin dirección registrada' }}</span>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- MAPA DE UBICACIÓN -->
      <Panel header="Ubicación" toggleable>
        <GoogleMapView :markers="mapMarkers" height="400px" />
      </Panel>

      <!-- TABS -->
      <TabView>
        <!-- TRABAJOS (JOBS) -->
        <TabPanel header="Historial de Trabajos">
          <DataTable :value="supplier.jobs" paginator :rows="10" responsiveLayout="scroll" sortField="created_at" :sortOrder="-1">
            <Column field="ticket_number" header="Ticket #" sortable></Column>
            <Column field="title" header="Título"></Column>
            <Column field="status" header="Estatus" sortable>
              <template #body="slotProps">
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
              </template>
            </Column>
            <Column field="priority" header="Prioridad" sortable>
               <template #body="slotProps">
                <Tag :value="getPriorityLabel(slotProps.data.priority)" :severity="getPrioritySeverity(slotProps.data.priority)" />
              </template>
            </Column>
            <Column field="created_at" header="Fecha" sortable>
              <template #body="slotProps">
                {{ formatDate(slotProps.data.created_at) }}
              </template>
            </Column>
             <Column header="Acciones">
               <template #body="slotProps">
                 <Button icon="pi pi-eye" text rounded @click="viewTicket(slotProps.data.id)" />
               </template>
             </Column>
          </DataTable>
        </TabPanel>

        <!-- SERVICIOS (Future) -->
        <TabPanel header="Servicios">
           <p class="text-gray-500">Lista de servicios ofrecidos (Próximamente)</p>
        </TabPanel>
        
        <!-- DOCUMENTOS (Future) -->
        <TabPanel header="Documentos">
           <p class="text-gray-500">Documentación del proveedor (Próximamente)</p>
        </TabPanel>
      </TabView>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSupplier } from '@/api/suppliers';

import Card from 'primevue/card';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import GoogleMapView from '@/components/maps/GoogleMapView.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const supplier = ref(null);
const loading = ref(true);

const mapMarkers = computed(() => {
  if (!supplier.value || !supplier.value.latitude || !supplier.value.longitude) return [];
  
  return [{
      lat: supplier.value.latitude,
      lng: supplier.value.longitude,
      title: supplier.value.company_name || supplier.value.contact_person,
      color: 'blue',
      info: supplier.value.full_address
  }];
});

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    opened: 'Abierto',
    assigned: 'Asignado',
    in_progress: 'En Proceso',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };
  return labels[status] || status;
};

const getStatusSeverity = (status) => {
  const severities = {
    pending: 'warning',
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
    high: 'warning',
    urgent: 'danger'
  };
  return severities[priority] || 'info';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const viewTicket = (ticketId) => {
    router.push(`/admin/tickets/${ticketId}`);
};

onMounted(async () => {
  try {
    supplier.value = await getSupplier(id);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>
