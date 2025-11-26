<template>
  <div class="p-4">
    <div v-if="loading" class="text-center p-5">
      <ProgressSpinner />
      <p class="text-sm text-gray-500 mt-3">Cargando información del cliente...</p>
    </div>

    <div v-else-if="!client">
      <Message severity="warn">Cliente no encontrado.</Message>
      <Button label="Volver" icon="pi pi-arrow-left" @click="$router.go(-1)" class="mt-3" />
    </div>

    <div v-else class="flex flex-column gap-4">
      <!-- HEADER -->
      <div class="flex justify-content-between align-items-center">
        <div>
          <h1 class="text-2xl font-bold mb-1">{{ client.company_name }}</h1>
          <p class="text-gray-500">{{ client.contact_person }}</p>
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
                <div v-if="client.email">
                  <i class="pi pi-envelope mr-2 text-primary"></i>
                  <span>{{ client.email }}</span>
                </div>
                <div v-if="client.phone">
                  <i class="pi pi-phone mr-2 text-primary"></i>
                  <span>{{ client.phone }}</span>
                </div>
                <div v-if="client.rfc">
                  <i class="pi pi-id-card mr-2 text-primary"></i>
                  <span>{{ client.rfc }}</span>
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
                <span>{{ client.full_address || 'Sin dirección registrada' }}</span>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- MAPA DE SUCURSALES -->
      <Panel header="Mapa de Sucursales" toggleable>
        <GoogleMapView :markers="mapMarkers" height="400px" />
      </Panel>

      <!-- TABS -->
      <TabView>
        <!-- SUCURSALES -->
        <TabPanel header="Sucursales">
          <DataTable :value="client.branches" paginator :rows="5" responsiveLayout="scroll">
            <Column field="name" header="Nombre" sortable></Column>
            <Column field="full_address" header="Dirección"></Column>
            <Column field="contact_person" header="Contacto"></Column>
            <Column field="phone" header="Teléfono"></Column>
          </DataTable>
        </TabPanel>

        <!-- ACTIVOS -->
        <TabPanel header="Activos">
          <DataTable :value="client.assets" paginator :rows="5" responsiveLayout="scroll">
            <Column field="name" header="Nombre" sortable></Column>
            <Column field="category" header="Categoría" sortable></Column>
            <Column field="brand" header="Marca"></Column>
            <Column field="serial_number" header="No. Serie"></Column>
            <Column header="Ubicación">
               <template #body="slotProps">
                 {{ getAssetLocation(slotProps.data) }}
               </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- TICKETS -->
        <TabPanel header="Historial de Tickets">
          <DataTable :value="client.tickets" paginator :rows="5" responsiveLayout="scroll" sortField="created_at" :sortOrder="-1">
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

        <!-- USUARIOS -->
        <TabPanel header="Usuarios">
           <DataTable :value="client.users" paginator :rows="5" responsiveLayout="scroll">
            <Column field="full_name" header="Nombre" sortable></Column>
            <Column field="email" header="Email"></Column>
            <Column field="phone_number" header="Teléfono"></Column>
            <Column field="role" header="Rol"></Column>
          </DataTable>
        </TabPanel>
      </TabView>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getClient } from '@/api/clients';

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

const client = ref(null);
const loading = ref(true);

const mapMarkers = computed(() => {
  if (!client.value || !client.value.branches) return [];
  
  return client.value.branches
    .filter(b => b.latitude && b.longitude)
    .map(b => ({
      lat: b.latitude,
      lng: b.longitude,
      title: b.name,
      color: 'blue',
      info: b.full_address
    }));
});

const getAssetLocation = (asset) => {
    if (asset.branch_id) {
        const branch = client.value.branches.find(b => b.id === asset.branch_id);
        return branch ? `Sucursal: ${branch.name}` : 'Sucursal desconocida';
    }
    return 'Oficina Principal'; // Assuming null branch_id means HQ or unassigned
};

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
    client.value = await getClient(id);
    console.log('📊 Client data loaded:', client.value);
    console.log('  - Branches:', client.value?.branches?.length || 0);
    console.log('  - Assets:', client.value?.assets?.length || 0);
    console.log('  - Users:', client.value?.users?.length || 0);
    console.log('  - Tickets:', client.value?.tickets?.length || 0);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>
