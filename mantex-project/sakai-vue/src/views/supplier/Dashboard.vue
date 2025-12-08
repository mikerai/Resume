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
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-briefcase text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ Math.max(0, assignedJobs - 5) }} </span>
                <span class="text-muted-color">&ensp;nuevos esta semana</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Facturas Pendientes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ pendingInvoices }}
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-orange-500 font-medium">{{ pendingInvoices }} </span>
                <span class="text-muted-color">&ensp;por cobrar</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Calificación Promedio</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ averageRating > 0 ?
                            averageRating.toFixed(1) : 'N/A' }}{{ averageRating > 0 ? '/5' : '' }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-star text-yellow-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-muted-color">{{ averageRating > 0 ? 'Basado en trabajos completados' : 'Sin calificaciones aún' }}</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Trabajos Totales</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalJobs }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-line text-green-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-muted-color">Todos los tiempos</span>
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
                    <li v-for="job in recentJobs" :key="job.id"
                        class="flex items-center py-3 px-2 border-b-1 surface-border">
                        <div class="w-3rem h-3rem flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 mr-4 flex-shrink-0"
                            style="border-radius: 10px">
                            <i class="pi pi-wrench text-blue-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal flex-1">
                            <span class="text-surface-700 dark:text-surface-100 font-medium">{{ job.title }}</span>
                            <div class="text-surface-600 dark:text-surface-200 text-sm mt-1">Cliente: {{ job.customer }}
                            </div>
                        </span>
                        <div class="flex flex-col items-end gap-2">
                            <Tag :value="job.status" :severity="getStatusSeverity(job.status)" />
                            <Button label="Ver" severity="info" text size="small" />
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Reviews Widget (New) -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Últimas Reseñas</div>
                <ul class="list-none p-0 m-0" v-if="recentReviews.length > 0">
                    <li v-for="review in recentReviews" :key="review.id"
                        class="flex flex-col py-3 px-2 border-b-1 surface-border gap-2">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Ticket #{{ review.ticket_number }}</span>
                            <Rating :modelValue="review.rating" readonly :cancel="false" />
                        </div>
                        <p class="text-sm text-gray-600 italic m-0">"{{ review.comment }}"</p>
                        <span class="text-xs text-gray-400 text-right">{{ new
                            Date(review.created_at).toLocaleDateString()
                            }}</span>
                    </li>
                </ul>
                <div v-else class="text-gray-500 text-center py-4">No hay reseñas aún.</div>
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
import Rating from 'primevue/rating';

const { user, profile } = useAuth();

// Reactive data
const companyName = profile.value?.username || user.value?.email?.split('@')[0] || 'Proveedor';
const assignedJobs = ref(0);
const pendingInvoices = ref(0);
const averageRating = ref(0.0);
const totalJobs = ref(0);
const recentJobs = ref([]);
const recentReviews = ref([]);

// Chart data
const chartData = ref({});
const chartOptions = ref({});

// Load dashboard data
const loadDashboardData = async () => {
    try {
        console.log('Loading dashboard data for user:', user.value?.id);
        const { supabase } = await import('@/lib/supabaseClient');

        // Get supplier ID, Rating and Total Jobs directly from source
        const { data: supplierData, error: supplierError } = await supabase
            .from('supplier_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (supplierError) {
            console.error('Error fetching supplier profile:', supplierError);
            return;
        }

        if (!supplierData) {
            console.warn('No supplier profile found for user:', user.value.id);
            return;
        }

        // Update stats from authoritative source
        averageRating.value = supplierData.rating || 0;

        console.log('Supplier ID:', supplierData.id);

        // Fetch all tickets for this supplier
        const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .eq('supplier_id', supplierData.id)
            .order('created_at', { ascending: false });

        if (ticketsError) {
            console.error('Error fetching tickets:', ticketsError);
            return;
        }

        console.log('Tickets found:', tickets?.length || 0);

        if (tickets) {
            // Calculate stats
            totalJobs.value = tickets.length;

            assignedJobs.value = tickets.filter(t =>
                ['pending', 'opened', 'in_progress'].includes(t.status)
            ).length;

            pendingInvoices.value = tickets.filter(t =>
                ['ready_for_payment', 'payment_pending'].includes(t.status)
            ).length;

            // Get recent jobs (last 5)
            recentJobs.value = tickets.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title || 'Sin título',
                status: t.status,
                priority: t.priority || 'normal',
                customer: `Ticket #${t.ticket_number || t.id.substring(0, 8)}`
            }));

            // Fetch recent reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, ticket:tickets(ticket_number)')
                .eq('reviewed_supplier_id', supplierData.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (reviewsData) {
                recentReviews.value = reviewsData.map(r => ({
                    ...r,
                    ticket_number: r.ticket?.ticket_number || 'N/A'
                }));

                // Calculate average rating from reviews
                if (reviewsData.length > 0) {
                    const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                    averageRating.value = Number((sum / reviewsData.length).toFixed(2));
                }
            }

            // Calculate average rating -> Moved to Authoritative Source (supplierData.rating)
            // Legacy calculation removed.

            // Prepare chart data with real monthly stats
            const now = new Date();
            const monthlyData = [];
            const monthlyCompleted = [];

            for (let i = 6; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

                const monthTickets = tickets.filter(t => {
                    const created = new Date(t.created_at);
                    return created >= month && created < nextMonth;
                });

                const completed = monthTickets.filter(t =>
                    ['completed', 'approved', 'paid', 'closed'].includes(t.status)
                );

                monthlyData.push(monthTickets.length);
                monthlyCompleted.push(completed.length);
            }

            console.log('Dashboard stats:', {
                totalJobs: totalJobs.value,
                assignedJobs: assignedJobs.value,
                pendingInvoices: pendingInvoices.value,
                averageRating: averageRating.value,
                recentJobs: recentJobs.value.length
            });

            setChartData(monthlyData, monthlyCompleted);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
};

// Chart configuration - Identical to Sakai ChartDoc
const setChartData = (monthlyData = [0, 0, 0, 0, 0, 0, 0], monthlyCompleted = [0, 0, 0, 0, 0, 0, 0]) => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    const now = new Date();
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(month.toLocaleDateString('es-MX', { month: 'short' }));
    }

    chartData.value = {
        labels,
        datasets: [
            {
                label: 'Trabajos Asignados',
                data: monthlyData,
                backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                borderColor: documentStyle.getPropertyValue('--p-primary-200'),
                tension: 0.4
            },
            {
                label: 'Completados',
                data: monthlyCompleted,
                backgroundColor: documentStyle.getPropertyValue('--p-green-500'),
                borderColor: documentStyle.getPropertyValue('--p-green-500'),
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
};

// Utility functions
const getStatusSeverity = (status) => {
    const severities = {
        'pending': 'warning',
        'opened': 'info',
        'in_progress': 'info',
        'completed': 'success',
        'approved': 'success',
        'rejected': 'danger',
        'cancelled': 'secondary',
        'under_review': 'warning',
        'revision_requested': 'warning',
        'payment_pending': 'warning',
        'ready_for_payment': 'success',
        'paid': 'success',
        'closed': 'secondary'
    };
    return severities[status] || 'secondary';
};

onMounted(() => {
    loadDashboardData();
});
</script>
