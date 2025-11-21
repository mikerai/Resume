<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget - Exact Sakai StatsWidget structure -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Tickets</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ metrics.total }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-ticket text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+12% </span>
                <span class="text-muted-color">desde el mes pasado</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Tickets Abiertos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ metrics.open }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-clock text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-orange-500 font-medium">{{ openPercentage }}% </span>
                <span class="text-muted-color">del total</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Completados</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ metrics.completed }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check-circle text-green-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">{{ completedPercentage }}% </span>
                <span class="text-muted-color">tasa de completado</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Usuarios Activos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ metrics.activeUsers }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-cyan-500 font-medium">+8% </span>
                <span class="text-muted-color">esta semana</span>
            </div>
        </div>

        <!-- Supplier Map Section -->
        <div class="col-span-12 lg:col-span-8">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Suppliers en Tiempo Real</div>
                    <div class="flex gap-2">
                        <Button
                            icon="pi pi-refresh"
                            label="Actualizar"
                            size="small"
                            outlined
                            :loading="refreshingMap"
                            @click="refreshSupplierLocations"
                        />
                        <Button
                            icon="pi pi-eye"
                            label="Vista Completa"
                            size="small"
                            @click="openFullMapView"
                        />
                    </div>
                </div>
                <RealTimeMap
                    user-role="admin"
                    :height="400"
                    :show-all-suppliers="true"
                    :auto-refresh="true"
                    class="admin-map"
                />
            </div>
        </div>

        <!-- Supplier Status Summary -->
        <div class="col-span-12 lg:col-span-4">
            <div class="card h-fit">
                <div class="font-semibold text-xl mb-4">Estado de Suppliers</div>

                <!-- Online Suppliers -->
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">En Línea</span>
                        <Tag :value="supplierStats.online" severity="success" />
                    </div>
                    <div class="space-y-2" v-if="onlineSuppliers.length > 0">
                        <div
                            v-for="supplier in onlineSuppliers.slice(0, 3)"
                            :key="supplier.id"
                            class="flex items-center gap-2 p-2 bg-surface-50 rounded-lg"
                        >
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                            <Avatar
                                :label="supplier.name.charAt(0)"
                                size="small"
                                style="background-color: #10b981; color: white"
                            />
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm truncate">{{ supplier.name }}</div>
                                <div class="text-xs text-muted-color">{{ supplier.status }}</div>
                            </div>
                        </div>
                        <div v-if="onlineSuppliers.length > 3" class="text-center">
                            <Button
                                :label="`+${onlineSuppliers.length - 3} más`"
                                text
                                size="small"
                                @click="showAllSuppliers"
                            />
                        </div>
                    </div>
                </div>

                <!-- Busy Suppliers -->
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Ocupados</span>
                        <Tag :value="supplierStats.busy" severity="warning" />
                    </div>
                    <div class="space-y-2" v-if="busySuppliers.length > 0">
                        <div
                            v-for="supplier in busySuppliers.slice(0, 2)"
                            :key="supplier.id"
                            class="flex items-center gap-2 p-2 bg-surface-50 rounded-lg"
                        >
                            <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <Avatar
                                :label="supplier.name.charAt(0)"
                                size="small"
                                style="background-color: #f59e0b; color: white"
                            />
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm truncate">{{ supplier.name }}</div>
                                <div class="text-xs text-muted-color">{{ supplier.currentJob }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Offline Suppliers -->
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Desconectados</span>
                        <Tag :value="supplierStats.offline" severity="secondary" />
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="mt-4 pt-4 border-t">
                    <div class="font-medium mb-2">Acciones Rápidas</div>
                    <div class="flex flex-col gap-2">
                        <Button
                            label="Asignar Trabajo"
                            icon="pi pi-plus"
                            size="small"
                            class="w-full"
                            @click="openJobAssignment"
                        />
                        <Button
                            label="Ver Todos"
                            icon="pi pi-users"
                            size="small"
                            outlined
                            class="w-full"
                            @click="viewAllSuppliers"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Tickets Table -->
        <div class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Tickets Recientes</div>
                <DataTable :value="recent" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column field="id" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">#{{ slotProps.data.id }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Título" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.title }}</div>
                        </template>
                    </Column>
                    <Column field="assignedTo" header="Asignado a" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.assignedTo }}</div>
                        </template>
                    </Column>
                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.priority" :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="createdAt" header="Fecha" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.createdAt) }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" severity="info" text rounded @click="viewTicket(slotProps.data.id)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import RealTimeMap from '@/components/maps/RealTimeMap.vue';

const router = useRouter();
const recent = ref([]);
const metrics = ref({
    total: 0,
    open: 0,
    completed: 0,
    activeUsers: 0
});

// Supplier tracking data
const refreshingMap = ref(false);
const suppliers = ref([]);
const supplierStats = ref({
    online: 0,
    busy: 0,
    offline: 0
});

const openPercentage = computed(() => {
    return metrics.value.total > 0 ? Math.round((metrics.value.open / metrics.value.total) * 100) : 0;
});

const completedPercentage = computed(() => {
    return metrics.value.total > 0 ? Math.round((metrics.value.completed / metrics.value.total) * 100) : 0;
});

const onlineSuppliers = computed(() => {
    return suppliers.value.filter(s => s.status === 'available' || s.status === 'en_ruta');
});

const busySuppliers = computed(() => {
    return suppliers.value.filter(s => s.status === 'busy' || s.status === 'working');
});

const offlineSuppliers = computed(() => {
    return suppliers.value.filter(s => s.status === 'offline');
});

const getPrioritySeverity = (priority) => {
    switch (priority) {
        case 'alta': return 'danger';
        case 'media': return 'warn';
        case 'baja': return 'success';
        default: return 'info';
    }
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'abierto': return 'info';
        case 'en_progreso': return 'warn';
        case 'completado': return 'success';
        case 'cerrado': return 'secondary';
        default: return 'info';
    }
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const viewTicket = (id) => {
    router.push(`/admin/tickets/${id}`);
};

const editTicket = (id) => {
    router.push(`/admin/tickets/${id}/edit`);
};

// Supplier management functions
const refreshSupplierLocations = async () => {
    refreshingMap.value = true;
    try {
        // Simulate API call to refresh locations
        await new Promise(resolve => setTimeout(resolve, 1000));
        loadMockSuppliers();
        console.log('✅ Supplier locations refreshed');
    } catch (error) {
        console.error('❌ Error refreshing supplier locations:', error);
    } finally {
        refreshingMap.value = false;
    }
};

const openFullMapView = () => {
    // Open full-screen map view
    router.push('/admin/suppliers-map');
};

const showAllSuppliers = () => {
    router.push('/admin/suppliers');
};

const openJobAssignment = () => {
    // Open job assignment dialog/modal
    console.log('Open job assignment');
};

const viewAllSuppliers = () => {
    router.push('/admin/suppliers');
};

// Mock data loaders
const loadMockSuppliers = () => {
    const mockSuppliers = [
        {
            id: 'sup1',
            name: 'María García',
            status: 'available',
            location: { lat: 19.4326, lng: -99.1332 },
            specialty: 'Plomería',
            currentJob: null
        },
        {
            id: 'sup2',
            name: 'Juan Pérez',
            status: 'working',
            location: { lat: 19.4284, lng: -99.1276 },
            specialty: 'Electricidad',
            currentJob: 'Instalación en Torre Central'
        },
        {
            id: 'sup3',
            name: 'Carlos López',
            status: 'en_ruta',
            location: { lat: 19.4205, lng: -99.1390 },
            specialty: 'HVAC',
            currentJob: null
        },
        {
            id: 'sup4',
            name: 'Ana Martínez',
            status: 'busy',
            location: { lat: 19.4351, lng: -99.1289 },
            specialty: 'Mantenimiento',
            currentJob: 'Reparación urgente'
        },
        {
            id: 'sup5',
            name: 'Roberto Silva',
            status: 'offline',
            location: null,
            specialty: 'General',
            currentJob: null
        }
    ];

    suppliers.value = mockSuppliers;

    // Update stats
    supplierStats.value = {
        online: onlineSuppliers.value.length,
        busy: busySuppliers.value.length,
        offline: offlineSuppliers.value.length
    };
};

const loadMockData = () => {
    const mockTickets = [
        {
            id: 1001,
            title: 'Reparación de aire acondicionado',
            priority: 'alta',
            status: 'abierto',
            assignedTo: 'Juan Pérez',
            createdAt: '2024-01-15T10:30:00Z'
        },
        {
            id: 1002,
            title: 'Mantenimiento preventivo de elevador',
            priority: 'media',
            status: 'en_progreso',
            assignedTo: 'María García',
            createdAt: '2024-01-14T14:20:00Z'
        },
        {
            id: 1003,
            title: 'Limpieza de oficinas',
            priority: 'baja',
            status: 'completado',
            assignedTo: 'Carlos López',
            createdAt: '2024-01-13T09:15:00Z'
        },
        {
            id: 1004,
            title: 'Reparación de plomería',
            priority: 'alta',
            status: 'abierto',
            assignedTo: 'Ana Martínez',
            createdAt: '2024-01-12T16:45:00Z'
        },
        {
            id: 1005,
            title: 'Instalación de sistema de seguridad',
            priority: 'alta',
            status: 'en_progreso',
            assignedTo: 'Roberto Silva',
            createdAt: '2024-01-11T11:00:00Z'
        }
    ];

    recent.value = mockTickets;
    metrics.value.total = mockTickets.length;
    metrics.value.open = mockTickets.filter(t => t.status === 'abierto').length;
    metrics.value.completed = mockTickets.filter(t => t.status === 'completado').length;
    metrics.value.activeUsers = 24;
};

onMounted(async () => {
    try {
        // Intentar cargar datos reales
        // const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets?limit=10`);
        // const data = await res.json();
        // recent.value = data;

        // Por ahora usar datos de ejemplo
        loadMockData();
        loadMockSuppliers();

        // Start real-time updates for suppliers (every 30 seconds)
        setInterval(() => {
            if (!refreshingMap.value) {
                loadMockSuppliers();
            }
        }, 30000);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        loadMockData();
        loadMockSuppliers();
    }
});
</script>

<style scoped>
</style>