<template>
    <div class="payment-details-panel">
        <div class="grid">
            <!-- Información principal del pago -->
            <div class="col-12 md:col-6">
                <div class="card">
                    <h6>💰 Información del Pago</h6>
                    <div class="field-group">
                        <div class="field">
                            <label>Monto:</label>
                            <div class="font-medium text-xl">${{ payment.amount.toLocaleString() }} {{ payment.currency }}</div>
                        </div>

                        <div class="field">
                            <label>Estado:</label>
                            <Tag
                                :value="getPaymentStatusLabel(payment.status)"
                                :severity="getPaymentStatusSeverity(payment.status)"
                            />
                        </div>

                        <div class="field">
                            <label>Método de Pago:</label>
                            <div>{{ getPaymentMethodLabel(payment.payment_method) }}</div>
                        </div>

                        <div v-if="payment.payment_reference" class="field">
                            <label>Referencia:</label>
                            <div class="font-medium">{{ payment.payment_reference }}</div>
                        </div>

                        <div v-if="payment.processing_fee > 0" class="field">
                            <label>Comisión:</label>
                            <div>${{ payment.processing_fee.toLocaleString() }}</div>
                        </div>

                        <div v-if="payment.net_amount" class="field">
                            <label>Monto Neto:</label>
                            <div class="font-medium text-green-600">${{ payment.net_amount.toLocaleString() }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información del ticket asociado -->
            <div class="col-12 md:col-6">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h6 class="m-0">🎫 Ticket Asociado</h6>
                        <Button
                            label="Ver Ticket"
                            icon="pi pi-external-link"
                            @click="viewTicket"
                            class="p-button-outlined p-button-sm"
                        />
                    </div>

                    <div class="field-group">
                        <div class="field">
                            <label>Número:</label>
                            <div class="font-medium">{{ payment.ticket?.ticket_number }}</div>
                        </div>

                        <div class="field">
                            <label>Título:</label>
                            <div>{{ payment.ticket?.title }}</div>
                        </div>

                        <div class="field">
                            <label>Proveedor:</label>
                            <div>
                                <div class="font-medium">{{ payment.ticket?.supplier?.company_name }}</div>
                                <div class="text-sm text-500">{{ payment.ticket?.supplier?.contact_person }}</div>
                            </div>
                        </div>

                        <div class="field">
                            <label>Cliente:</label>
                            <div>
                                <div class="font-medium">{{ payment.ticket?.client?.company_name }}</div>
                                <div class="text-sm text-500">{{ payment.ticket?.client?.contact_person }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cronología de fechas -->
            <div class="col-12">
                <div class="card">
                    <h6>📅 Cronología del Pago</h6>
                    <Timeline :value="paymentTimeline" class="w-full">
                        <template #content="slotProps">
                            <div class="p-2">
                                <div class="font-medium">{{ slotProps.item.title }}</div>
                                <div class="text-sm text-500">{{ slotProps.item.date }}</div>
                                <div v-if="slotProps.item.description" class="text-sm mt-1">
                                    {{ slotProps.item.description }}
                                </div>
                            </div>
                        </template>
                        <template #marker="slotProps">
                            <div :class="slotProps.item.markerClass" class="p-1 border-round">
                                <i :class="slotProps.item.icon" class="text-white"></i>
                            </div>
                        </template>
                    </Timeline>
                </div>
            </div>

            <!-- Información bancaria (si disponible) -->
            <div v-if="payment.supplier_account_info && Object.keys(payment.supplier_account_info).length > 0" class="col-12 md:col-6">
                <div class="card">
                    <h6>🏦 Información Bancaria</h6>
                    <div class="field-group">
                        <div v-if="payment.supplier_account_info.bank_name" class="field">
                            <label>Banco:</label>
                            <div>{{ payment.supplier_account_info.bank_name }}</div>
                        </div>
                        <div v-if="payment.supplier_account_info.account_number" class="field">
                            <label>Cuenta:</label>
                            <div>***{{ payment.supplier_account_info.account_number.slice(-4) }}</div>
                        </div>
                        <div v-if="payment.supplier_account_info.account_holder" class="field">
                            <label>Titular:</label>
                            <div>{{ payment.supplier_account_info.account_holder }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notas y comentarios -->
            <div class="col-12 md:col-6">
                <div class="card">
                    <h6>📝 Notas y Comentarios</h6>

                    <div v-if="payment.description" class="field">
                        <label>Descripción:</label>
                        <div class="p-3 bg-blue-50 border-round">
                            {{ payment.description }}
                        </div>
                    </div>

                    <div v-if="payment.failure_reason" class="field">
                        <label>Razón de Fallo:</label>
                        <div class="p-3 bg-red-50 border-round text-red-700">
                            {{ payment.failure_reason }}
                        </div>
                    </div>

                    <div class="field">
                        <label for="internal-notes">Notas Internas:</label>
                        <Textarea
                            id="internal-notes"
                            v-model="internalNotes"
                            rows="3"
                            class="w-full"
                            placeholder="Agregar notas internas..."
                        />
                        <div class="flex justify-content-end mt-2">
                            <Button
                                label="Guardar Notas"
                                icon="pi pi-save"
                                @click="saveNotes"
                                :disabled="internalNotes === (payment.internal_notes || '')"
                                class="p-button-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Historial de estado -->
            <div class="col-12">
                <div class="card">
                    <h6>📋 Historial de Estados</h6>
                    <DataTable
                        :value="paymentHistory"
                        :loading="historyLoading"
                        responsiveLayout="scroll"
                        :paginator="true"
                        :rows="5"
                    >
                        <Column field="previous_status" header="Estado Anterior">
                            <template #body="slotProps">
                                <Tag
                                    v-if="slotProps.data.previous_status"
                                    :value="getPaymentStatusLabel(slotProps.data.previous_status)"
                                    :severity="getPaymentStatusSeverity(slotProps.data.previous_status)"
                                    size="small"
                                />
                                <span v-else class="text-500">-</span>
                            </template>
                        </Column>
                        <Column field="new_status" header="Nuevo Estado">
                            <template #body="slotProps">
                                <Tag
                                    :value="getPaymentStatusLabel(slotProps.data.new_status)"
                                    :severity="getPaymentStatusSeverity(slotProps.data.new_status)"
                                    size="small"
                                />
                            </template>
                        </Column>
                        <Column field="reason" header="Razón">
                            <template #body="slotProps">
                                <div class="text-sm">{{ slotProps.data.reason }}</div>
                            </template>
                        </Column>
                        <Column field="changed_at" header="Fecha">
                            <template #body="slotProps">
                                <div class="text-sm">{{ formatDateTime(slotProps.data.changed_at) }}</div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Acciones administrativas -->
            <div class="col-12">
                <div class="card">
                    <h6>⚙️ Acciones Administrativas</h6>
                    <div class="flex flex-wrap gap-2">
                        <Button
                            v-if="payment.status === 'pending'"
                            label="Procesar Ahora"
                            icon="pi pi-play"
                            @click="processPayment"
                            class="p-button-success"
                        />

                        <Button
                            v-if="payment.status === 'failed' && payment.retry_count < payment.max_retries"
                            label="Reintentar"
                            icon="pi pi-refresh"
                            @click="retryPayment"
                            class="p-button-warning"
                        />

                        <Button
                            v-if="['pending', 'scheduled'].includes(payment.status)"
                            label="Cancelar"
                            icon="pi pi-times"
                            @click="cancelPayment"
                            class="p-button-danger p-button-outlined"
                        />

                        <Button
                            v-if="payment.status === 'completed'"
                            label="Generar Comprobante"
                            icon="pi pi-file-pdf"
                            @click="generateReceipt"
                            class="p-button-info"
                        />

                        <Button
                            label="Ver Jobs Relacionados"
                            icon="pi pi-list"
                            @click="viewRelatedJobs"
                            class="p-button-secondary"
                        />

                        <Button
                            label="Historial Completo"
                            icon="pi pi-history"
                            @click="viewFullHistory"
                            class="p-button-secondary p-button-outlined"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
    payment: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['payment-updated']);

const supabase = useSupabaseClient();
const toast = useToast();
const confirm = useConfirm();

// Estados reactivos
const internalNotes = ref(props.payment.internal_notes || '');
const paymentHistory = ref([]);
const historyLoading = ref(false);

// Computadas
const paymentTimeline = computed(() => {
    const timeline = [];

    if (props.payment.approved_at) {
        timeline.push({
            title: 'Trabajo Aprobado',
            date: formatDateTime(props.payment.approved_at),
            icon: 'pi pi-check-circle',
            markerClass: 'bg-green-500'
        });
    }

    timeline.push({
        title: 'Pago Creado',
        date: formatDateTime(props.payment.created_at),
        description: `Monto: $${props.payment.amount.toLocaleString()}`,
        icon: 'pi pi-plus-circle',
        markerClass: 'bg-blue-500'
    });

    if (props.payment.scheduled_date) {
        timeline.push({
            title: 'Pago Programado',
            date: formatDateTime(props.payment.scheduled_date),
            icon: 'pi pi-clock',
            markerClass: 'bg-orange-500'
        });
    }

    if (props.payment.processed_at) {
        timeline.push({
            title: 'Pago Procesado',
            date: formatDateTime(props.payment.processed_at),
            description: `Referencia: ${props.payment.payment_reference}`,
            icon: 'pi pi-cog',
            markerClass: 'bg-purple-500'
        });
    }

    if (props.payment.completed_at) {
        timeline.push({
            title: 'Pago Completado',
            date: formatDateTime(props.payment.completed_at),
            icon: 'pi pi-check',
            markerClass: 'bg-green-600'
        });
    }

    timeline.push({
        title: 'Fecha Límite',
        date: formatDateTime(props.payment.due_date),
        description: getDueDateStatus(),
        icon: props.payment.status === 'completed' ? 'pi pi-check' : 'pi pi-exclamation-triangle',
        markerClass: props.payment.status === 'completed' ? 'bg-green-500' : getDueDateClass()
    });

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// Métodos
const loadPaymentHistory = async () => {
    try {
        historyLoading.value = true;

        const { data, error } = await supabase
            .from('payment_status_history')
            .select('*')
            .eq('payment_id', props.payment.id)
            .order('changed_at', { ascending: false });

        if (error) throw error;

        paymentHistory.value = data || [];

    } catch (error) {
        console.error('Error loading payment history:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el historial del pago',
            life: 3000
        });
    } finally {
        historyLoading.value = false;
    }
};

const saveNotes = async () => {
    try {
        const { error } = await supabase
            .from('payments')
            .update({
                internal_notes: internalNotes.value,
                updated_at: new Date().toISOString()
            })
            .eq('id', props.payment.id);

        if (error) throw error;

        emit('payment-updated');

        toast.add({
            severity: 'success',
            summary: 'Notas Guardadas',
            detail: 'Las notas internas se han actualizado',
            life: 3000
        });

    } catch (error) {
        console.error('Error saving notes:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron guardar las notas',
            life: 3000
        });
    }
};

const processPayment = () => {
    confirm.require({
        message: `¿Procesar el pago de $${props.payment.amount.toLocaleString()} ahora?`,
        header: 'Procesar Pago',
        icon: 'pi pi-question-triangle',
        accept: async () => {
            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        status: 'completed',
                        processed_at: new Date().toISOString(),
                        completed_at: new Date().toISOString(),
                        payment_reference: `PAY-${Date.now()}-${props.payment.id.substring(0, 8)}`,
                        internal_notes: (internalNotes.value || '') + '\n\nProcesado manualmente por administrador'
                    })
                    .eq('id', props.payment.id);

                if (error) throw error;

                emit('payment-updated');

                toast.add({
                    severity: 'success',
                    summary: 'Pago Procesado',
                    detail: 'El pago ha sido procesado exitosamente',
                    life: 3000
                });

            } catch (error) {
                console.error('Error processing payment:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo procesar el pago',
                    life: 3000
                });
            }
        }
    });
};

const retryPayment = () => {
    confirm.require({
        message: '¿Reintentar el procesamiento del pago?',
        header: 'Reintentar Pago',
        icon: 'pi pi-refresh',
        accept: async () => {
            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        status: 'pending',
                        retry_count: props.payment.retry_count + 1,
                        failure_reason: null,
                        internal_notes: (internalNotes.value || '') + '\n\nReintento iniciado por administrador'
                    })
                    .eq('id', props.payment.id);

                if (error) throw error;

                emit('payment-updated');

                toast.add({
                    severity: 'info',
                    summary: 'Reintento Programado',
                    detail: 'El pago ha sido programado para reintento',
                    life: 3000
                });

            } catch (error) {
                console.error('Error retrying payment:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo programar el reintento',
                    life: 3000
                });
            }
        }
    });
};

const cancelPayment = () => {
    confirm.require({
        message: '¿Cancelar este pago permanentemente?',
        header: 'Cancelar Pago',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        status: 'cancelled',
                        internal_notes: (internalNotes.value || '') + '\n\nCancelado manualmente por administrador'
                    })
                    .eq('id', props.payment.id);

                if (error) throw error;

                emit('payment-updated');

                toast.add({
                    severity: 'warn',
                    summary: 'Pago Cancelado',
                    detail: 'El pago ha sido cancelado',
                    life: 3000
                });

            } catch (error) {
                console.error('Error cancelling payment:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cancelar el pago',
                    life: 3000
                });
            }
        }
    });
};

const generateReceipt = () => {
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'La generación de comprobantes estará disponible pronto',
        life: 3000
    });
};

const viewRelatedJobs = () => {
    window.open(`/admin/payment-jobs?payment_id=${props.payment.id}`, '_blank');
};

const viewFullHistory = () => {
    window.open(`/admin/payments/${props.payment.id}/history`, '_blank');
};

const viewTicket = () => {
    window.open(`/admin/tickets/${props.payment.ticket?.id}`, '_blank');
};

// Utilidades
const getDueDateStatus = () => {
    const dueDate = new Date(props.payment.due_date);
    const now = new Date();

    if (props.payment.status === 'completed') {
        return 'Pago completado a tiempo';
    }

    if (dueDate < now) {
        const hoursOverdue = Math.round((now - dueDate) / (1000 * 60 * 60));
        return `Vencido hace ${hoursOverdue} horas`;
    }

    const hoursUntilDue = Math.round((dueDate - now) / (1000 * 60 * 60));
    return `${hoursUntilDue} horas restantes`;
};

const getDueDateClass = () => {
    const dueDate = new Date(props.payment.due_date);
    const now = new Date();

    if (dueDate < now) return 'bg-red-500'; // Vencido
    if ((dueDate - now) < 24 * 60 * 60 * 1000) return 'bg-orange-500'; // Menos de 24h
    return 'bg-blue-500'; // Normal
};

const getPaymentStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        scheduled: 'Programado',
        processing: 'Procesando',
        completed: 'Completado',
        failed: 'Fallido',
        cancelled: 'Cancelado'
    };
    return labels[status] || status;
};

const getPaymentStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        scheduled: 'info',
        processing: 'primary',
        completed: 'success',
        failed: 'danger',
        cancelled: 'secondary'
    };
    return severities[status] || 'secondary';
};

const getPaymentMethodLabel = (method) => {
    const labels = {
        transfer: 'Transferencia Bancaria',
        card: 'Tarjeta',
        paypal: 'PayPal',
        stripe: 'Stripe'
    };
    return labels[method] || method;
};

const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
    loadPaymentHistory();
});
</script>

<style scoped>
.field-group .field {
    margin-bottom: 1rem;
}

.field-group .field:last-child {
    margin-bottom: 0;
}

.bg-green-500 { background-color: #22c55e; }
.bg-green-600 { background-color: #16a34a; }
.bg-blue-500 { background-color: #3b82f6; }
.bg-orange-500 { background-color: #f97316; }
.bg-purple-500 { background-color: #a855f7; }
.bg-red-500 { background-color: #ef4444; }
</style>