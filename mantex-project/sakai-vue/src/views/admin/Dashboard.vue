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
                    <div class="font-semibold text-xl">Usuarios en Tiempo Real</div>
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
                    :auto-refresh="false"
                    :suppliers-data="suppliers"
                    :clients-data="clients"
                    class="admin-map"
                />
            </div>
        </div>

        <!-- Supplier Status Summary -->
        <div class="col-span-12 lg:col-span-4">
            <div class="card h-fit">
                <div class="font-semibold text-xl mb-4">Estado de Proveedores</div>

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
                        <Tag :value="supplierStats.busy" severity="danger" />
                    </div>
                    <div class="space-y-2" v-if="busySuppliers.length > 0">
                        <div
                            v-for="supplier in busySuppliers.slice(0, 2)"
                            :key="supplier.id"
                            class="flex items-center gap-2 p-2 bg-surface-50 rounded-lg"
                        >
                            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                            <Avatar
                                :label="supplier.name.charAt(0)"
                                size="small"
                                style="background-color: #ef4444; color: white"
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
                        <Tag :value="offlineSuppliers.length" severity="secondary" />
                    </div>
                    <div class="space-y-2" v-if="offlineSuppliers.length > 0">
                        <div
                            v-for="supplier in offlineSuppliers.slice(0, 2)"
                            :key="supplier.id"
                            class="flex items-center gap-2 p-2 bg-surface-50 rounded-lg opacity-60"
                        >
                            <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <Avatar
                                :label="supplier.name.charAt(0)"
                                size="small"
                                style="background-color: #9ca3af; color: white"
                            />
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-sm truncate">{{ supplier.name }}</div>
                                <div class="text-xs text-muted-color">{{ supplier.lastSeen }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="mt-4 pt-4 border-t">
                    <div class="font-medium mb-2">Acciones Rápidas</div>
                    <div class="flex flex-col gap-2">
                        <Button
                            label="Crear Ticket"
                            icon="pi pi-plus"
                            size="small"
                            class="w-full"
                            @click="openJobAssignment"
                        />
                        <Button
                            label="Usuarios"
                            icon="pi pi-users"
                            size="small"
                            outlined
                            class="w-full"
                            @click="navigateToUsers"
                        />
                         <Button
                            label="Clientes"
                            icon="pi pi-building"
                            size="small"
                            outlined
                            class="w-full"
                            @click="navigateToClients"
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
                    <Column field="displayId" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">#{{ slotProps.data.displayId }}</span>
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
                            <Tag :value="translatePriority(slotProps.data.priority)" :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="translateStatus(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
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
import { supabase } from '@/lib/supabaseClient';

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
const clients = ref([]);
const supplierStats = ref({
    online: 0,
    busy: 0,
    offline: 0,
    approved: 0,
    pending: 0,
    clients: 0
});

const openPercentage = computed(() => {
    return metrics.value.total > 0 ? Math.round((metrics.value.open / metrics.value.total) * 100) : 0;
});

const completedPercentage = computed(() => {
    return metrics.value.total > 0 ? Math.round((metrics.value.completed / metrics.value.total) * 100) : 0;
});

const approvedSuppliers = computed(() => {
    return suppliers.value.filter(s => s.status === 'approved');
});

const pendingSuppliers = computed(() => {
    return suppliers.value.filter(s => s.status === 'pending');
});

const onlineSuppliers = computed(() => {
    // Para compatibilidad con el template existente
    return approvedSuppliers.value;
});

const busySuppliers = computed(() => {
    // Para compatibilidad con el template existente
    return pendingSuppliers.value;
});

const offlineSuppliers = computed(() => {
    // Suppliers desconectados (ejemplo con datos dummy)
    return [
        {
            id: 'offline-1',
            name: 'Juan Martínez',
            lastSeen: 'Hace 2 horas'
        },
        {
            id: 'offline-2',
            name: 'Ana Sánchez',
            lastSeen: 'Hace 1 día'
        }
    ];
});

import { translateStatus, getStatusSeverity, translatePriority, getPrioritySeverity } from '@/utils/status-utils.js';

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
        await loadRealData();
        console.log('[OK] Supplier locations refreshed');
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

// Quick Actions
const openJobAssignment = () => {
    router.push('/admin/tickets/create');
};

const navigateToUsers = () => {
    router.push('/admin/users');
};

const navigateToClients = () => {
    router.push('/admin/clients'); // Need to ensure this route exists or list clients in Users
};

const loadRealTickets = async () => {
    try {
        // 1. Load recent tickets for the table
        const { data: ticketsData, error } = await supabase
            .from('tickets')
            .select(`
                id,
                ticket_number,
                title,
                priority,
                status,
                created_at,
                supplier:supplier_id(company_name, contact_person)
            `)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        recent.value = (ticketsData || []).map(t => ({
            id: t.id, // Use ID for navigation
            displayId: t.ticket_number || t.id,
            title: t.title,
            priority: t.priority,
            status: t.status,
            assignedTo: t.supplier?.company_name || t.supplier?.contact_person || 'Sin asignar',
            createdAt: t.created_at
        }));
        
        // 2. Calculate real metrics (Count ALL tickets)
        // Total Tickets
        const { count: totalCount, error: totalError } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true });
            
        if (!totalError) metrics.value.total = totalCount;

        // Open Tickets
        const { count: openCount, error: openError } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'opened', 'assigned', 'in_progress']);
            
        if (!openError) metrics.value.open = openCount;

        // Completed Tickets
        const { count: completedCount, error: completedError } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('status', ['completed', 'paid', 'closed']);
            
        if (!completedError) metrics.value.completed = completedCount;
        
        // Active Users
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (!usersError) metrics.value.activeUsers = usersCount;
        
        console.log('✅ Dashboard metrics loaded');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to empty
        recent.value = [];
        metrics.value = { total: 0, open: 0, completed: 0, activeUsers: 0 };
    }
};

const loadRealData = async () => {
    try {
        console.log('🔍 Loading suppliers and clients for map...');

        // Fetch suppliers with location data
        const { data: suppliersData, error: suppliersError } = await supabase
            .from('supplier_profiles')
            .select('id, company_name, contact_person, status, full_address, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        console.log('📊 Suppliers query result:', { count: suppliersData?.length || 0, error: suppliersError });

        if (suppliersError) {
            console.error('Error loading suppliers:', suppliersError);
        } else {
            suppliers.value = (suppliersData || []).map(s => ({
                id: s.id,
                name: s.company_name || s.contact_person,
                company: s.company_name,
                status: s.status,
                address: s.full_address,
                location: {
                    lat: s.latitude,
                    lng: s.longitude
                }
            }));

            console.log('✅ Suppliers mapped:', suppliers.value.length, 'items');

            // Update stats
            supplierStats.value.approved = suppliers.value.filter(s => s.status === 'approved').length;
            supplierStats.value.pending = suppliers.value.filter(s => s.status === 'pending').length;
            supplierStats.value.online = supplierStats.value.approved;
            supplierStats.value.busy = supplierStats.value.pending;
        }

        // Fetch clients with location data (from clients table)
        const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, company_name, contact_person, full_address, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        console.log('📊 Clients query result:', { count: clientsData?.length || 0, error: clientsError });

        if (clientsError) {
            console.error('Error loading clients:', clientsError);
        } else {
            clients.value = (clientsData || []).map(c => ({
                id: c.id,
                name: c.company_name || c.contact_person,
                company: c.company_name,
                address: c.full_address,
                location: {
                    lat: c.latitude,
                    lng: c.longitude
                }
            }));

            console.log('✅ Clients mapped:', clients.value.length, 'items');

            supplierStats.value.clients = clients.value.length;
        }

        console.log(`✅ Final data for map - Suppliers: ${suppliers.value.length}, Clients: ${clients.value.length}`);

    } catch (error) {
        console.error('Error loading map data:', error);
        suppliers.value = [];
        clients.value = [];
    }
};

onMounted(async () => {
    try {
        // Load real data
        await loadRealTickets();
        await loadRealData();

        // Start real-time updates for suppliers (every 30 seconds)
        setInterval(() => {
            if (!refreshingMap.value) {
                loadRealData();
            }
        }, 30000);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});
</script>

<style scoped>
</style>