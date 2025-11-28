<template>
    <div class="grid grid-cols-12 gap-8">
        <div v-if="loading" class="col-span-12 text-center p-8">
            <ProgressSpinner />
            <p class="text-muted-color mt-4">Cargando información del proveedor...</p>
        </div>

        <div v-else-if="!supplier" class="col-span-12">
            <div class="card flex flex-col items-center justify-center p-8 text-center">
                <i class="pi pi-exclamation-circle text-4xl text-orange-500 mb-4"></i>
                <h2 class="text-xl font-bold mb-2">Proveedor no encontrado</h2>
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
                            <Avatar 
                                :label="supplier.company_name?.charAt(0) || supplier.contact_person?.charAt(0)" 
                                size="xlarge" 
                                shape="circle" 
                                class="w-16 h-16 text-2xl font-bold"
                                :style="{ 'background-color': 'var(--primary-color)', 'color': '#ffffff' }"
                            />
                            <div>
                                <h1 class="text-2xl font-bold m-0">{{ supplier.company_name || supplier.contact_person }}</h1>
                                <div class="text-muted-color mt-1 flex items-center gap-2">
                                    <i class="pi pi-user"></i>
                                    {{ supplier.contact_person }}
                                </div>
                                <div class="flex gap-2 mt-3">
                                    <Tag :value="translateProfileStatus(supplier.status)" :severity="getProfileStatusSeverity(supplier.status)" />
                                    <Tag v-if="supplier.onboarding_complete" value="Onboarding Completo" severity="success" icon="pi pi-check" />
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button label="Volver" icon="pi pi-arrow-left" outlined @click="$router.go(-1)" />
                            <Button label="Editar" icon="pi pi-pencil" severity="secondary" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Left Column: Info -->
            <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <!-- Contact Info -->
                <div class="card mb-0">
                    <div class="font-semibold text-xl mb-4">Información de Contacto</div>
                    <ul class="list-none p-0 m-0 flex flex-col gap-4">
                        <li class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                <i class="pi pi-envelope text-blue-500"></i>
                            </div>
                            <div>
                                <span class="block text-sm text-muted-color mb-1">Email</span>
                                <span class="text-surface-900 dark:text-surface-0 font-medium break-all">{{ supplier.email || 'No registrado' }}</span>
                            </div>
                        </li>
                        <li class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                <i class="pi pi-phone text-green-500"></i>
                            </div>
                            <div>
                                <span class="block text-sm text-muted-color mb-1">Teléfono</span>
                                <span class="text-surface-900 dark:text-surface-0 font-medium">{{ supplier.phone_number || 'No registrado' }}</span>
                            </div>
                        </li>
                        <li class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                <i class="pi pi-id-card text-purple-500"></i>
                            </div>
                            <div>
                                <span class="block text-sm text-muted-color mb-1">RFC</span>
                                <span class="text-surface-900 dark:text-surface-0 font-medium">{{ supplier.rfc || 'No registrado' }}</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Address -->
                <div class="card mb-0">
                    <div class="font-semibold text-xl mb-4">Ubicación</div>
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-map-marker text-orange-500"></i>
                        </div>
                        <div>
                            <span class="block text-sm text-muted-color mb-1">Dirección Fiscal</span>
                            <span class="text-surface-900 dark:text-surface-0 leading-relaxed">{{ supplier.full_address || 'Sin dirección registrada' }}</span>
                        </div>
                    </div>
                    <div class="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 h-48">
                         <GoogleMapView :markers="mapMarkers" :height="'100%'" />
                    </div>
                </div>
            </div>

            <!-- Right Column: Stats & Jobs -->
            <div class="col-span-12 lg:col-span-8">
                <div class="card h-full">
                    <TabView>
                        <TabPanel header="Historial de Trabajos">
                            <DataTable :value="supplier.jobs" :paginator="true" :rows="5" responsiveLayout="scroll" sortField="created_at" :sortOrder="-1">
                                <template #empty>
                                    <div class="text-center p-4">No hay trabajos registrados.</div>
                                </template>
                                <Column field="ticket_number" header="Ticket #" sortable style="min-width: 8rem">
                                    <template #body="slotProps">
                                        <span class="font-medium text-primary cursor-pointer hover:underline" @click="viewTicket(slotProps.data.id)">
                                            {{ slotProps.data.ticket_number || slotProps.data.id.substring(0, 8) }}
                                        </span>
                                    </template>
                                </Column>
                                <Column field="title" header="Título" style="min-width: 12rem"></Column>
                                <Column field="status" header="Estado" sortable>
                                    <template #body="slotProps">
                                        <Tag :value="translateStatus(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                                    </template>
                                </Column>
                                <Column field="priority" header="Prioridad" sortable>
                                    <template #body="slotProps">
                                        <Tag :value="translatePriority(slotProps.data.priority)" :severity="getPrioritySeverity(slotProps.data.priority)" />
                                    </template>
                                </Column>
                                <Column field="created_at" header="Fecha" sortable>
                                    <template #body="slotProps">
                                        {{ formatDate(slotProps.data.created_at) }}
                                    </template>
                                </Column>
                                <Column header="Acciones" :exportable="false">
                                    <template #body="slotProps">
                                        <Button icon="pi pi-eye" text rounded severity="secondary" @click="viewTicket(slotProps.data.id)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </TabPanel>
                        <TabPanel header="Servicios">
                            <div class="flex flex-col items-center justify-center p-8 text-muted-color">
                                <i class="pi pi-cog text-4xl mb-3 opacity-50"></i>
                                <p>Gestión de servicios próximamente</p>
                            </div>
                        </TabPanel>
                        <TabPanel header="Documentos">
                            <div class="flex flex-col items-center justify-center p-8 text-muted-color">
                                <i class="pi pi-file text-4xl mb-3 opacity-50"></i>
                                <p>Gestión de documentos próximamente</p>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSupplier } from '@/api/suppliers';
import { 
    translateStatus, 
    getStatusSeverity, 
    translatePriority, 
    getPrioritySeverity, 
    formatDate,
    translateProfileStatus,
    getProfileStatusSeverity
} from '@/utils/status-utils.js';

import Button from 'primevue/button';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
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

<style scoped>
:deep(.p-tabview-nav) {
    border-width: 0 0 1px 0;
}
</style>
