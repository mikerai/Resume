<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/composables/useAuth';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import Chip from 'primevue/chip';
import Avatar from 'primevue/avatar';
import TicketChat from '@/components/ticket/TicketChat.vue';
import { translateStatus, translatePriority, getStatusSeverity as getStatusSev } from '@/utils/status-utils.js';

const router = useRouter();
const { user } = useAuth();

// Reactive data
const tickets = ref([]);
const loading = ref(true);
const recentRequests = ref([]);
const chartData = ref(null);
const chartOptions = ref(null);
const selectedTicket = ref(null);
const showTicketDialog = ref(false);
const mapSrc = ref('');

// Computed stats from real data
const stats = computed(() => {
    const active = tickets.value.filter(t => !['closed', 'cancelled', 'paid'].includes(t.status)).length;
    const pendingApproval = tickets.value.filter(t => ['under_review', 'completed'].includes(t.status)).length;
    const totalAssets = 0; // TODO: Connect to assets table
    const avgResponseTime = 0; // TODO: Calculate from ticket data
    return { active, pendingApproval, totalAssets, avgResponseTime };
});

// Chart configuration - Identical to Sakai ChartDoc
onMounted(async () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    // Fetch real ticket data first
    await fetchTickets();
    
    // Calculate real chart data from last 7 months
    const monthlyData = calculateMonthlyTicketData(tickets.value);

    chartData.value = {
        labels: monthlyData.labels,
        datasets: [
            {
                label: 'Mantenimiento Preventivo',
                data: monthlyData.preventive,
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                tension: 0.4
            },
            {
                label: 'Mantenimiento Correctivo',
                data: monthlyData.corrective,
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
                borderColor: documentStyle.getPropertyValue('--p-orange-500'),
                tension: 0.4
            }
        ]
    };

    chartOptions.value = {
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };

    loading.value = false;
});

// Utility functions - matching TableDoc pattern
const getPrioritySeverity = (priority) => {
    switch (priority) {
        case 'low': return 'success';
        case 'normal': return 'info';
        case 'high': return 'warn';
        case 'urgent': return 'danger';
        default: return 'info';
    }
};

// Use centralized translation functions
const getStatusLabel = translateStatus;
const getPriorityLabel = translatePriority;
const getStatusSeverity = getStatusSev;

// Format date function (not in utils yet)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Helper function to calculate monthly ticket data for chart
const calculateMonthlyTicketData = (ticketsData) => {
    const now = new Date();
    const labels = [];
    const preventive = [];
    const corrective = [];
    
    // Generate last 7 months
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        labels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
        
        // Count tickets for this month
        const monthTickets = ticketsData.filter(t => {
            const ticketDate = new Date(t.created_at);
            return ticketDate.getFullYear() === date.getFullYear() &&
                   ticketDate.getMonth() === date.getMonth();
        });
        
        preventive.push(monthTickets.filter(t => t.maintenance_type === 'preventive').length);
        corrective.push(monthTickets.filter(t => t.maintenance_type === 'corrective').length);
    }
    
    return { labels, preventive, corrective };
};

const fetchTickets = async () => {
    try {
        console.log('🎫 Cargando tickets del usuario:', user.value?.id);
        
        if (!user.value) {
            console.warn('⚠️ No user logged in');
            return;
        }

        // Buscar client_id del usuario actual en la tabla client_profiles
        const { data: clientData, error: clientError } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (clientError && clientError.code !== 'PGRST116') {
            console.error('Error buscando cliente:', clientError);
        }

        let clientId = clientData?.id || null;

        if (!clientId) {
            console.warn('⚠️ No client_id found for user:', user.value.id);
            tickets.value = [];
            recentRequests.value = [];
            return;
        }

        console.log('📡 Querying tickets for client_id:', clientId);

        const { data, error } = await supabase
            .from('tickets')
            .select(`
                id,
                ticket_number,
                title,
                description,
                status,
                priority,
                maintenance_type,
                location_city,
                location_state,
                scheduled_date,
                created_at,
                supplier:supplier_id(id, company_name, contact_person)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        console.log('✅ Cargados', data?.length || 0, 'tickets');
        
        tickets.value = data || [];
        recentRequests.value = data?.slice(0, 5) || [];
        
        console.log('📊 tickets.value:', tickets.value.length);
        console.log('📋 recentRequests.value:', recentRequests.value.length);
    } catch (error) {
        console.error('💥 Error fetching tickets:', error);
        tickets.value = [];
        recentRequests.value = [];
    }
};

const viewTicket = (ticket) => {
    selectedTicket.value = ticket;
    // Build Google Maps embed URL
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const query = encodeURIComponent(`${ticket.location_city}, ${ticket.location_state}`);
    mapSrc.value = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
    showTicketDialog.value = true;
};

const closeTicketDialog = () => {
    showTicketDialog.value = false;
    selectedTicket.value = null;
};

const cancelTicketQuick = async (ticket) => {
    if (!confirm(`¿Está seguro de cancelar el ticket ${ticket.ticket_number}?`)) return;
    
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'cancelled' })
            .eq('id', ticket.id);
        
        if (error) throw error;
        
        // Refresh data
        await fetchTickets();
    } catch (error) {
        console.error('Error cancelling ticket:', error);
    }
};

const cancelTicket = async () => {
    if (!selectedTicket.value) return;
    
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'cancelled' })
            .eq('id', selectedTicket.value.id);
        
        if (error) throw error;
        
        // Refresh data
        await fetchTickets();
        closeTicketDialog();
    } catch (error) {
        console.error('Error cancelling ticket:', error);
    }
};
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget - Exact Sakai StatsWidget structure -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Solicitudes Activas</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.active }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-ticket text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+12% </span>
                <span class="text-muted-color">&ensp;desde el mes pasado</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Pendientes Aprobación</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.pendingApproval }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-clock text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">-2 </span>
                <span class="text-muted-color">&ensp;vs semana pasada</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Activos Totales</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalAssets || 'N/A' }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-building text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">+5 </span>
                <span class="text-muted-color">&ensp;nuevos este mes</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Gasto Mensual</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">$24,500</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-purple-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">-8% </span>
                <span class="text-muted-color">&ensp;vs mes anterior</span>
            </div>
        </div>

        <!-- Two column layout like Sakai Dashboard -->
        <div class="col-span-12 xl:col-span-6">
            <!-- Chart Widget -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">Gastos de Mantenimiento</div>
                <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <!-- Notifications Widget -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">Notificaciones Recientes</div>
                <ul class="list-none p-0 m-0">
                    <li class="flex items-center py-3 px-2 border-b-1 surface-border">
                        <div class="w-3rem h-3rem flex items-center justify-center bg-green-100 dark:bg-green-400/10 mr-4 flex-shrink-0" style="border-radius: 10px">
                            <i class="pi pi-calendar text-green-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal flex-1">
                            <span class="text-surface-700 dark:text-surface-100 font-medium">Mantenimiento Programado</span>
                            <div class="text-surface-600 dark:text-surface-200 text-sm mt-1">Revisión de HVAC programada para mañana 8:00 AM</div>
                        </span>
                        <span class="text-surface-500 text-sm ml-2">2h</span>
                    </li>
                    <li class="flex items-center py-3 px-2 border-b-1 surface-border">
                        <div class="w-3rem h-3rem flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 mr-4 flex-shrink-0" style="border-radius: 10px">
                            <i class="pi pi-clock text-orange-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal flex-1">
                            <span class="text-surface-700 dark:text-surface-100 font-medium">Aprobación Pendiente</span>
                            <div class="text-surface-600 dark:text-surface-200 text-sm mt-1">Cotización de $15,000 requiere tu aprobación</div>
                        </span>
                        <span class="text-surface-500 text-sm ml-2">4h</span>
                    </li>
                    <li class="flex items-center py-3 px-2 border-b-1 surface-border">
                        <div class="w-3rem h-3rem flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 mr-4 flex-shrink-0" style="border-radius: 10px">
                            <i class="pi pi-check-circle text-blue-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal flex-1">
                            <span class="text-surface-700 dark:text-surface-100 font-medium">Trabajo Completado</span>
                            <div class="text-surface-600 dark:text-surface-200 text-sm mt-1">Limpieza de ductos HVAC finalizada</div>
                        </span>
                        <span class="text-surface-500 text-sm ml-2">1d</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Full width table at bottom -->
        <div class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Solicitudes Recientes ({{ recentRequests.length }})</div>
                <DataTable :value="recentRequests" :paginator="false" responsiveLayout="scroll">
                    <Column field="ticket_number" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.ticket_number }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Descripción" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.location_city }}, {{ slotProps.data.location_state }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="supplier" header="Proveedor" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.supplier?.company_name || 'Sin asignar' }}</div>
                        </template>
                    </Column>
                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag :value="getPriorityLabel(slotProps.data.priority)" :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="date" header="Fecha" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.created_at) }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-eye" 
                                    severity="info" 
                                    text 
                                    rounded 
                                    @click="viewTicket(slotProps.data)" 
                                    v-tooltip.top="'Ver detalles'"
                                />
                                <Button 
                                    icon="pi pi-pencil" 
                                    severity="success" 
                                    text 
                                    rounded 
                                    @click="router.push(`/client/requests/${slotProps.data.id}`)"
                                    v-tooltip.top="'Editar'"
                                    :disabled="['completed', 'cancelled', 'closed'].includes(slotProps.data.status)"
                                />
                                <Button 
                                    icon="pi pi-ban" 
                                    severity="danger" 
                                    text 
                                    rounded 
                                    @click="cancelTicketQuick(slotProps.data)"
                                    v-tooltip.top="'Cancelar'"
                                    :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(slotProps.data.status)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Ticket Detail Overlay -->
        <Dialog 
            v-model:visible="showTicketDialog" 
            modal 
            :style="{ width: '90vw', maxWidth: '1200px' }" 
            header="Detalles del Ticket"
        >
            <div v-if="selectedTicket">
                <Splitter style="height: 600px">
                    <!-- Panel 1: Mapa (30%) -->
                    <SplitterPanel :size="30" :minSize="20">
                        <div class="h-full flex items-center justify-content-center">
                            <iframe
                                v-if="selectedTicket.location_city && selectedTicket.location_state"
                                width="100%"
                                height="100%"
                                class="border-none"
                                loading="lazy"
                                :src="mapSrc"
                            ></iframe>
                            <div v-else class="flex flex-column align-items-center justify-content-center h-full text-500">
                                <i class="pi pi-map-marker text-4xl mb-2"></i>
                                <span>Sin ubicación</span>
                            </div>
                        </div>
                    </SplitterPanel>

                    <!-- Paneles Derecha (70%) -->
                    <SplitterPanel :size="70">
                        <Splitter layout="vertical">
                            <!-- Panel 2: Detalles (20%) -->
                            <SplitterPanel :size="20" :minSize="15">
                                <div class="p-3 h-full overflow-y-auto">
                                    <div class="flex align-items-center justify-content-between mb-3">
                                        <h6 class="m-0">
                                            <i class="pi pi-info-circle mr-2"></i>
                                            Detalles del Ticket
                                        </h6>
                                        <Tag :value="getStatusLabel(selectedTicket.status)" :severity="getStatusSeverity(selectedTicket.status)" />
                                    </div>

                                    <div class="flex flex-wrap gap-2 mb-3">
                                        <Chip :label="selectedTicket.maintenance_type === 'preventive' ? 'Preventivo' : 'Correctivo'" icon="pi pi-wrench" />
                                        <Chip :label="getPriorityLabel(selectedTicket.priority)" icon="pi pi-exclamation-circle" />
                                        <Chip v-if="selectedTicket.location_city" :label="selectedTicket.location_city" icon="pi pi-map-marker" />
                                    </div>

                                    <div class="flex align-items-center gap-2 mb-3" v-if="selectedTicket.supplier">
                                        <Avatar :label="selectedTicket.supplier.company_name[0]" shape="circle" />
                                        <div>
                                            <div class="font-semibold text-sm">{{ selectedTicket.supplier.company_name }}</div>
                                            <div class="text-xs text-500">{{ selectedTicket.supplier.contact_person }}</div>
                                        </div>
                                    </div>

                                    <p class="text-700 text-sm line-height-3 m-0">{{ selectedTicket.description }}</p>
                                </div>
                            </SplitterPanel>

                            <!-- Panel 3: Chat (80%) -->
                            <SplitterPanel :size="80" :minSize="50">
                                <div class="h-full flex flex-column">
                                    <div class="p-3 surface-100 border-bottom-1 surface-border">
                                        <h6 class="m-0 flex align-items-center">
                                            <i class="pi pi-comments mr-2"></i>
                                            Chat
                                        </h6>
                                    </div>
                                    <div class="flex-1">
                                        <TicketChat :ticketId="selectedTicket.id" />
                                    </div>
                                </div>
                            </SplitterPanel>
                        </Splitter>
                    </SplitterPanel>
                </Splitter>
            </div>

            <template #footer>
                <div class="flex justify-content-between w-full">
                    <Button 
                        label="Cancelar Ticket" 
                        icon="pi pi-ban" 
                        severity="danger" 
                        outlined
                        @click="cancelTicket"
                        :disabled="['ready_for_payment', 'in_progress', 'cancelled', 'closed', 'completed'].includes(selectedTicket?.status)"
                    />
                    <div class="flex gap-2">
                        <Button label="Cerrar" icon="pi pi-times" text @click="closeTicketDialog" />
                        <Button 
                            label="Editar" 
                            icon="pi pi-pencil" 
                            @click="router.push(`/client/requests/${selectedTicket?.id}`)"
                            :disabled="['completed', 'cancelled', 'closed'].includes(selectedTicket?.status)"
                        />
                    </div>
                </div>
            </template>
        </Dialog>
    </div>
</template>