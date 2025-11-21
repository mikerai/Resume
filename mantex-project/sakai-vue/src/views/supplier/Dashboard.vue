<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats Widget - Exact Sakai StatsWidget structure -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Trabajos Asignados</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ assignedJobs }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-briefcase text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ assignedJobs - 5 }} </span>
                <span class="text-muted-color">completados esta semana</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Facturas Pendientes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ pendingInvoices }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-orange-500 font-medium">{{ pendingInvoices }} </span>
                <span class="text-muted-color">por cobrar</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Calificación Promedio</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ averageRating.toFixed(1) }}/5</div>
                    </div>
                    <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-star text-yellow-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">+0.3 </span>
                <span class="text-muted-color">vs mes anterior</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Ingresos del Mes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">$45,200</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-line text-green-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">+18% </span>
                <span class="text-muted-color">vs mes anterior</span>
            </div>
        </div>

        <!-- Two column layout like Sakai Dashboard -->
        <div class="col-span-12 xl:col-span-6">
            <!-- Chart Widget -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">Volumen de Trabajos</div>
                <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <!-- Jobs List Widget -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">Trabajos Recientes</div>
                <ul class="list-none p-0 m-0">
                    <li v-for="job in recentJobs" :key="job.id" class="flex items-center py-3 px-2 border-b-1 surface-border">
                        <div class="w-3rem h-3rem flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 mr-4 flex-shrink-0" style="border-radius: 10px">
                            <i class="pi pi-wrench text-blue-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal flex-1">
                            <span class="text-surface-700 dark:text-surface-100 font-medium">{{ job.title }}</span>
                            <div class="text-surface-600 dark:text-surface-200 text-sm mt-1">Cliente: {{ job.customer }}</div>
                        </span>
                        <div class="flex flex-col items-end gap-2">
                            <Tag :value="job.status" :severity="getStatusSeverity(job.status)" />
                            <Button label="Ver" severity="info" text size="small" />
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

const { user, profile } = useAuth();

// Reactive data
const companyName = profile.value?.username || user.value?.email?.split('@')[0] || 'Proveedor';
const assignedJobs = ref(0);
const pendingInvoices = ref(0);
const averageRating = ref(0.0);
const recentJobs = ref([]);

// Chart data
const chartData = ref({});
const chartOptions = ref({});

// Load dashboard data
const loadDashboardData = () => {
    setTimeout(() => {
        assignedJobs.value = 42;
        pendingInvoices.value = 5;
        averageRating.value = 4.7;

        recentJobs.value = [
            { id: 101, title: 'Reparación de HVAC - Piso 3', status: 'pending', priority: 'high', customer: 'Cliente X' },
            { id: 102, title: 'Mantenimiento preventivo de bombas', status: 'in_progress', priority: 'normal', customer: 'Cliente Y' },
            { id: 103, title: 'Inspección de sistemas eléctricos', status: 'completed', priority: 'normal', customer: 'Cliente Z' },
        ];

        setChartData();
    }, 500);
};

// Chart configuration - Identical to Sakai ChartDoc
const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    chartData.value = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Trabajos Asignados',
                data: [15, 12, 20, 18, 25, 22, 19],
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                borderColor: documentStyle.getPropertyValue('--p-primary-500')
            },
            {
                label: 'Completados',
                data: [10, 11, 15, 14, 21, 18, 15],
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderColor: documentStyle.getPropertyValue('--p-green-500')
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
};

// Utility functions
const getStatusSeverity = (status) => {
    switch (status) {
        case 'pending': return 'warn';
        case 'in_progress': return 'info';
        case 'completed': return 'success';
        default: return 'secondary';
    }
};

onMounted(() => {
    loadDashboardData();
});
</script>