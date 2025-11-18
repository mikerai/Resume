import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';

export function usePaymentNotifications(userRole = null) {
    const supabase = useSupabaseClient();
    const toast = useToast();

    // Estados reactivos
    const pendingPayments = ref([]);
    const overduePayments = ref([]);
    const upcomingPayments = ref([]);
    const loading = ref(false);
    const refreshInterval = ref(null);

    // Computadas
    const hasPaymentAlerts = computed(() => {
        return overduePayments.value.length > 0 || upcomingPayments.value.length > 0;
    });

    const paymentStats = computed(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
            total: pendingPayments.value.length,
            overdue: overduePayments.value.length,
            today: pendingPayments.value.filter(p => {
                const dueDate = new Date(p.due_date);
                return dueDate >= today && dueDate < tomorrow;
            }).length,
            thisWeek: pendingPayments.value.filter(p => {
                const dueDate = new Date(p.due_date);
                const weekFromNow = new Date(now);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return dueDate >= today && dueDate <= weekFromNow;
            }).length
        };
    });

    // Métodos principales
    const loadPaymentData = async () => {
        try {
            loading.value = true;

            let query = supabase
                .from('payments')
                .select(`
                    *,
                    ticket:tickets (
                        *,
                        supplier:suppliers (*),
                        client:clients (*)
                    )
                `)
                .in('status', ['pending', 'scheduled'])
                .order('due_date', { ascending: true });

            // Filtrar por rol si es necesario
            if (userRole === 'supplier') {
                const user = supabase.auth.user();
                if (user) {
                    query = query.eq('ticket.supplier.user_id', user.id);
                }
            } else if (userRole === 'client') {
                const user = supabase.auth.user();
                if (user) {
                    query = query.eq('ticket.client.user_id', user.id);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            pendingPayments.value = data || [];
            categorizePayments();

        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            loading.value = false;
        }
    };

    const categorizePayments = () => {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        overduePayments.value = pendingPayments.value.filter(payment => {
            const dueDate = new Date(payment.due_date);
            return dueDate < now;
        });

        upcomingPayments.value = pendingPayments.value.filter(payment => {
            const dueDate = new Date(payment.due_date);
            return dueDate >= now && dueDate <= next24Hours;
        });
    };

    // Notificaciones
    const showPaymentNotifications = () => {
        // Notificación para pagos vencidos
        if (overduePayments.value.length > 0 && userRole === 'admin') {
            toast.add({
                severity: 'error',
                summary: 'Pagos Vencidos',
                detail: `${overduePayments.value.length} pago(s) vencido(s) requieren atención`,
                life: 8000,
                group: 'payment-alerts'
            });
        }

        // Notificación para pagos próximos
        if (upcomingPayments.value.length > 0) {
            const message = userRole === 'supplier'
                ? `Recibirás ${upcomingPayments.value.length} pago(s) en las próximas 24 horas`
                : `${upcomingPayments.value.length} pago(s) programado(s) para las próximas 24 horas`;

            toast.add({
                severity: 'info',
                summary: 'Pagos Próximos',
                detail: message,
                life: 6000,
                group: 'payment-alerts'
            });
        }
    };

    // Procesamiento automático (solo para admins)
    const checkAutomaticProcessing = async () => {
        if (userRole !== 'admin') return;

        try {
            // Llamar a la función de procesamiento automático
            const { data, error } = await supabase.rpc('process_pending_payment_jobs');

            if (error) throw error;

            const result = data?.[0];
            if (result && result.processed_jobs > 0) {
                toast.add({
                    severity: result.failed_jobs > 0 ? 'warn' : 'success',
                    summary: 'Procesamiento Automático',
                    detail: `${result.successful_jobs}/${result.processed_jobs} pagos procesados`,
                    life: 5000,
                    group: 'auto-processing'
                });

                // Recargar datos después del procesamiento
                await loadPaymentData();
            }

        } catch (error) {
            console.error('Error in automatic processing:', error);
        }
    };

    // Utilidades
    const formatPaymentAmount = (amount, currency = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getTimeUntilDue = (dueDateString) => {
        const dueDate = new Date(dueDateString);
        const now = new Date();
        const diffMs = dueDate - now;

        if (diffMs < 0) {
            const hoursOverdue = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
            return `Vencido hace ${hoursOverdue} horas`;
        }

        const hoursUntilDue = Math.floor(diffMs / (1000 * 60 * 60));
        if (hoursUntilDue < 24) {
            return `${hoursUntilDue} horas restantes`;
        }

        const daysUntilDue = Math.floor(hoursUntilDue / 24);
        return `${daysUntilDue} días restantes`;
    };

    const getPaymentPriority = (payment) => {
        const dueDate = new Date(payment.due_date);
        const now = new Date();
        const diffHours = (dueDate - now) / (1000 * 60 * 60);

        if (diffHours < 0) return 'overdue';
        if (diffHours < 24) return 'urgent';
        if (diffHours < 72) return 'high';
        return 'normal';
    };

    // Configuración de actualización automática
    const startAutoRefresh = (intervalMinutes = 15) => {
        stopAutoRefresh(); // Limpiar intervalo anterior

        refreshInterval.value = setInterval(async () => {
            await loadPaymentData();

            // Solo admins ejecutan procesamiento automático
            if (userRole === 'admin') {
                await checkAutomaticProcessing();
            }
        }, intervalMinutes * 60 * 1000);
    };

    const stopAutoRefresh = () => {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value);
            refreshInterval.value = null;
        }
    };

    // Suscripción a cambios en tiempo real
    const subscribeToPaymentUpdates = () => {
        const subscription = supabase
            .channel('payment-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'payments'
            }, (payload) => {
                console.log('Payment update received:', payload);
                loadPaymentData(); // Recargar datos cuando hay cambios
            })
            .subscribe();

        return subscription;
    };

    // Lifecycle
    onMounted(() => {
        loadPaymentData();

        // Mostrar notificaciones iniciales después de cargar
        setTimeout(() => {
            if (!loading.value) {
                showPaymentNotifications();
            }
        }, 2000);

        // Iniciar actualización automática
        startAutoRefresh();
    });

    onUnmounted(() => {
        stopAutoRefresh();
    });

    // API pública
    return {
        // Estados
        pendingPayments,
        overduePayments,
        upcomingPayments,
        loading,

        // Computadas
        hasPaymentAlerts,
        paymentStats,

        // Métodos
        loadPaymentData,
        showPaymentNotifications,
        checkAutomaticProcessing,
        formatPaymentAmount,
        getTimeUntilDue,
        getPaymentPriority,
        startAutoRefresh,
        stopAutoRefresh,
        subscribeToPaymentUpdates
    };
}