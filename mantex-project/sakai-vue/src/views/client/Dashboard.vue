<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

const router = useRouter();

// Reactive data
const recentRequests = ref([]);
const chartData = ref(null);
const chartOptions = ref(null);

// Chart configuration - Identical to Sakai ChartDoc
onMounted(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    chartData.value = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Mantenimiento Preventivo',
                data: [12000, 15000, 8000, 22000, 19000, 14000, 17000],
                fill: false,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                tension: 0.4
            },
            {
                label: 'Mantenimiento Correctivo',
                data: [8000, 12000, 15000, 10000, 8000, 20000, 12000],
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

    // Sample data
    recentRequests.value = [
        {
            id: 'REQ-2024-001',
            title: 'Fuga de agua en Cocina - Edificio A',
            status: 'in_progress',
            priority: 'high',
            supplier: 'HidroTech Solutions',
            location: 'Edificio A - Piso 3',
            date: '2024-11-15'
        },
        {
            id: 'REQ-2024-002',
            title: 'Revisión trimestral de UPS',
            status: 'assigned',
            priority: 'normal',
            supplier: 'ElectroMant',
            location: 'Centro de Datos',
            date: '2024-11-14'
        },
        {
            id: 'REQ-2024-003',
            title: 'Limpieza profunda de ductos HVAC',
            status: 'completed',
            priority: 'low',
            supplier: 'ClimaTech Pro',
            location: 'Edificio B - Todos los pisos',
            date: '2024-11-10'
        },
        {
            id: 'REQ-2024-004',
            title: 'Reparación de elevador principal',
            status: 'pending',
            priority: 'urgent',
            supplier: 'Sin asignar',
            location: 'Torre Norte',
            date: '2024-11-16'
        }
    ];
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

const getStatusSeverity = (status) => {
    switch (status) {
        case 'pending': return 'warn';
        case 'assigned': return 'info';
        case 'in_progress': return 'info';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        default: return 'info';
    }
};

const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Baja',
        normal: 'Normal',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
};

const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        assigned: 'Asignado',
        in_progress: 'En Progreso',
        completed: 'Completado',
        cancelled: 'Cancelado'
    };
    return labels[status] || status;
};

const viewRequest = (request) => {
    router.push(`/client/requests/${request.id}`);
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
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">18</div>
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
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">3</div>
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
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">85</div>
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
                <div class="font-semibold text-xl mb-4">Solicitudes Recientes</div>
                <DataTable :value="recentRequests" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column field="id" header="ID" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.id }}</span>
                        </template>
                    </Column>
                    <Column field="title" header="Descripción" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.title }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.location }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="supplier" header="Proveedor" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.supplier }}</div>
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
                            <div class="text-sm">{{ new Date(slotProps.data.date).toLocaleDateString('es-MX') }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" severity="info" text rounded @click="viewRequest(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>