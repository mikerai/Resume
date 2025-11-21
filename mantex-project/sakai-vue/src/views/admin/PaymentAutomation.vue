<template>
    <div>
        <!-- Header Stats Cards - Sakai Standard -->
        <div class="grid">
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Pagos Pendientes</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">${{ stats.totalPendingAmount.toLocaleString() }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-clock text-orange-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-orange-500 font-medium">{{ stats.overduePayments }} </span>
                    <span class="text-muted-color">vencidos</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Pagos Hoy</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.paymentsToday }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-check-circle text-green-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">Completados </span>
                    <span class="text-muted-color">automáticamente</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Jobs Pendientes</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.pendingJobs }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-cog text-blue-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-blue-500 font-medium">Programados </span>
                    <span class="text-muted-color">para proceso</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Automatización</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                <Tag :value="automationEnabled ? 'Activa' : 'Inactiva'" :severity="automationEnabled ? 'success' : 'danger'" />
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-bolt text-cyan-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-cyan-500 font-medium">48H </span>
                    <span class="text-muted-color">retraso automático</span>
                </div>
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button
                        label="Procesar Jobs"
                        icon="pi pi-play"
                        severity="success"
                        class="mr-2"
                        @click="processJobs"
                        :loading="processingJobs"
                    />
                    <Button
                        label="Procesar Todo"
                        icon="pi pi-forward"
                        severity="info"
                        @click="processAllPending"
                        :loading="processingAll"
                    />
                </template>
                <template #end>
                    <Button
                        label="Configuración"
                        icon="pi pi-cog"
                        severity="secondary"
                        @click="showConfigDialog = true"
                    />
                </template>
            </Toolbar>

            <!-- Processing Result Message -->
            <Message v-if="lastProcessingResult" :severity="lastProcessingResult.success ? 'success' : 'warn'" class="mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <strong>Último procesamiento:</strong>
                        {{ lastProcessingResult.processed }} jobs procesados,
                        {{ lastProcessingResult.successful }} exitosos,
                        {{ lastProcessingResult.failed }} fallidos
                    </div>
                    <small>{{ formatDateTime(lastProcessingResult.timestamp) }}</small>
                </div>
            </Message>

            <TabView>
                <TabPanel header="Pagos Pendientes">
                    <DataTable
                        :value="pendingPayments"
                        dataKey="id"
                        :paginator="true"
                        :rows="10"
                        :filters="filters"
                        :loading="loading"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[5, 10, 25]"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pagos"
                    >
                        <template #header>
                            <div class="flex flex-wrap gap-2 items-center justify-between">
                                <h4 class="m-0">Pagos Pendientes de Procesamiento</h4>
                                <IconField>
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                                </IconField>
                            </div>
                        </template>

                        <Column field="ticket_number" header="Ticket" sortable style="min-width: 12rem">
                            <template #body="slotProps">
                                <div class="font-medium text-primary">#{{ slotProps.data.ticket?.ticket_number || 'N/A' }}</div>
                            </template>
                        </Column>
                        <Column field="supplier" header="Proveedor" sortable style="min-width: 16rem">
                            <template #body="slotProps">
                                <div v-if="slotProps.data.ticket?.supplier">
                                    <div class="font-medium">{{ slotProps.data.ticket.supplier.company_name }}</div>
                                    <div class="text-sm text-muted-color">{{ slotProps.data.ticket.supplier.contact_person }}</div>
                                </div>
                                <span v-else class="text-muted-color">No asignado</span>
                            </template>
                        </Column>
                        <Column field="amount" header="Monto" sortable style="min-width: 10rem">
                            <template #body="slotProps">
                                <div class="font-medium">${{ parseFloat(slotProps.data.amount || 0).toLocaleString() }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.currency || 'MXN' }}</div>
                            </template>
                        </Column>
                        <Column field="due_date" header="Fecha Límite" sortable style="min-width: 14rem">
                            <template #body="slotProps">
                                <div>{{ formatDateTime(slotProps.data.due_date) }}</div>
                                <Tag :value="getTimeUntilDue(slotProps.data.due_date)" :severity="getDateSeverity(slotProps.data.due_date)" />
                            </template>
                        </Column>
                        <Column field="status" header="Estado" sortable style="min-width: 10rem">
                            <template #body="slotProps">
                                <Tag :value="getPaymentStatusLabel(slotProps.data.status)" :severity="getPaymentStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                        <Column :exportable="false" style="min-width: 12rem">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" severity="info" text rounded @click="viewPaymentDetails(slotProps.data)" class="mr-2" />
                                <Button icon="pi pi-play" severity="success" text rounded @click="processPaymentNow(slotProps.data)" class="mr-2" />
                                <Button icon="pi pi-times" severity="danger" text rounded @click="cancelPayment(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>

                <TabPanel header="Pagos Completados">
                    <DataTable
                        :value="completedPayments"
                        dataKey="id"
                        :paginator="true"
                        :rows="10"
                        :loading="loading"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[5, 10, 25]"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pagos"
                    >
                        <Column field="ticket_number" header="Ticket" sortable>
                            <template #body="slotProps">
                                <div class="font-medium text-primary">#{{ slotProps.data.ticket?.ticket_number || 'N/A' }}</div>
                            </template>
                        </Column>
                        <Column field="supplier" header="Proveedor" sortable>
                            <template #body="slotProps">
                                <div v-if="slotProps.data.ticket?.supplier">
                                    <div class="font-medium">{{ slotProps.data.ticket.supplier.company_name }}</div>
                                </div>
                                <span v-else class="text-muted-color">No asignado</span>
                            </template>
                        </Column>
                        <Column field="amount" header="Monto" sortable>
                            <template #body="slotProps">
                                <div class="font-medium">${{ parseFloat(slotProps.data.amount || 0).toLocaleString() }}</div>
                            </template>
                        </Column>
                        <Column field="completed_at" header="Completado" sortable>
                            <template #body="slotProps">
                                <div class="text-sm">{{ formatDateTime(slotProps.data.completed_at) }}</div>
                            </template>
                        </Column>
                        <Column field="payment_reference" header="Referencia" sortable>
                            <template #body="slotProps">
                                <div class="font-mono text-sm">{{ slotProps.data.payment_reference }}</div>
                            </template>
                        </Column>
                        <Column :exportable="false" style="min-width: 8rem">
                            <template #body="slotProps">
                                <Button icon="pi pi-eye" severity="info" text rounded @click="viewPaymentDetails(slotProps.data)" />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>

                <TabPanel header="Jobs Programados">
                    <DataTable
                        :value="scheduledJobs"
                        dataKey="id"
                        :paginator="true"
                        :rows="10"
                        :loading="loading"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        :rowsPerPageOptions="[5, 10, 25]"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} jobs"
                    >
                        <Column field="job_type" header="Tipo" sortable>
                            <template #body="slotProps">
                                <Tag :value="getJobTypeLabel(slotProps.data.job_type)" />
                            </template>
                        </Column>
                        <Column field="payment_id" header="Ticket" sortable>
                            <template #body="slotProps">
                                <div class="font-medium text-primary">#{{ slotProps.data.payment?.ticket?.ticket_number || 'N/A' }}</div>
                            </template>
                        </Column>
                        <Column field="scheduled_for" header="Programado Para" sortable>
                            <template #body="slotProps">
                                <div class="text-sm">{{ formatDateTime(slotProps.data.scheduled_for) }}</div>
                            </template>
                        </Column>
                        <Column field="status" header="Estado" sortable>
                            <template #body="slotProps">
                                <Tag :value="getJobStatusLabel(slotProps.data.status)" :severity="getJobStatusSeverity(slotProps.data.status)" />
                            </template>
                        </Column>
                        <Column :exportable="false" style="min-width: 8rem">
                            <template #body="slotProps">
                                <Button
                                    v-if="slotProps.data.status === 'pending'"
                                    icon="pi pi-play"
                                    severity="success"
                                    text
                                    rounded
                                    @click="executeJobNow(slotProps.data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </TabPanel>
            </TabView>
        </div>

        <!-- Payment Details Dialog -->
        <Dialog v-model:visible="paymentDetailsDialog" :style="{ width: '800px' }" header="Detalles del Pago" :modal="true">
            <div v-if="selectedPayment" class="flex flex-col gap-6">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label class="font-bold">Ticket:</label>
                            <p class="font-medium text-primary">#{{ selectedPayment.ticket?.ticket_number }}</p>
                        </div>
                        <div class="field">
                            <label class="font-bold">Proveedor:</label>
                            <p>{{ selectedPayment.ticket?.supplier?.company_name || 'No asignado' }}</p>
                        </div>
                        <div class="field">
                            <label class="font-bold">Monto:</label>
                            <p class="font-medium">${{ parseFloat(selectedPayment.amount || 0).toLocaleString() }} {{ selectedPayment.currency }}</p>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label class="font-bold">Estado:</label>
                            <Tag :value="getPaymentStatusLabel(selectedPayment.status)" :severity="getPaymentStatusSeverity(selectedPayment.status)" />
                        </div>
                        <div class="field">
                            <label class="font-bold">Fecha Límite:</label>
                            <p>{{ formatDateTime(selectedPayment.due_date) }}</p>
                        </div>
                        <div class="field" v-if="selectedPayment.payment_reference">
                            <label class="font-bold">Referencia:</label>
                            <p class="font-mono">{{ selectedPayment.payment_reference }}</p>
                        </div>
                    </div>
                </div>
                <div class="field" v-if="selectedPayment.internal_notes">
                    <label class="font-bold">Notas Internas:</label>
                    <p>{{ selectedPayment.internal_notes }}</p>
                </div>
            </div>
            <template #footer>
                <Button label="Cerrar" icon="pi pi-times" @click="paymentDetailsDialog = false" />
            </template>
        </Dialog>

        <!-- Configuration Dialog -->
        <Dialog v-model:visible="showConfigDialog" :style="{ width: '600px' }" header="Configuración de Automatización" :modal="true">
            <div class="flex flex-col gap-6">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label for="automation-enabled" class="font-bold">Automatización Habilitada</label>
                            <InputSwitch id="automation-enabled" v-model="configDraft.auto_processing_enabled" />
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label for="delay-hours" class="font-bold">Horas de Retraso</label>
                            <InputNumber id="delay-hours" v-model="configDraft.payment_delay_hours" :min="1" :max="168" suffix=" horas" fluid />
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label for="max-amount" class="font-bold">Monto Máximo Auto</label>
                            <InputNumber id="max-amount" v-model="configDraft.max_amount_auto_process" mode="currency" currency="MXN" locale="es-MX" fluid />
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label for="notify-hours" class="font-bold">Notificar Antes (horas)</label>
                            <InputNumber id="notify-hours" v-model="configDraft.notify_before_hours" :min="0" :max="72" suffix=" horas" fluid />
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="showConfigDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="saveQuickConfig" />
            </template>
        </Dialog>

        <Toast />
        <ConfirmDialog />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Message from 'primevue/message';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';

const toast = useToast();
const confirm = useConfirm();

// Estados reactivos
const loading = ref(false);
const processingJobs = ref(false);
const processingAll = ref(false);
const payments = ref([]);
const jobs = ref([]);
const config = ref({});
const configDraft = ref({});
const stats = ref({
    totalPendingAmount: 0,
    paymentsToday: 0,
    overduePayments: 0,
    pendingJobs: 0
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Diálogos
const paymentDetailsDialog = ref(false);
const showConfigDialog = ref(false);
const selectedPayment = ref(null);
const lastProcessingResult = ref(null);

// Computadas
const automationEnabled = computed(() => config.value?.auto_processing_enabled || false);

const pendingPayments = computed(() =>
    payments.value.filter(p => ['pending', 'scheduled'].includes(p.status))
);

const completedPayments = computed(() =>
    payments.value.filter(p => p.status === 'completed')
);

const scheduledJobs = computed(() =>
    jobs.value.filter(j => j.status === 'pending')
);

// Mock data para demostración
const loadMockData = () => {
    const mockPayments = [
        {
            id: 'PAY001',
            amount: 15000,
            currency: 'MXN',
            status: 'pending',
            due_date: new Date(Date.now() + 3600000 * 12).toISOString(),
            created_at: new Date().toISOString(),
            ticket: {
                ticket_number: 'TK-001',
                supplier: {
                    company_name: 'Servicios Técnicos SA',
                    contact_person: 'Juan Pérez'
                }
            }
        },
        {
            id: 'PAY002',
            amount: 25000,
            currency: 'MXN',
            status: 'completed',
            due_date: new Date(Date.now() - 3600000 * 2).toISOString(),
            completed_at: new Date(Date.now() - 3600000).toISOString(),
            payment_reference: 'REF-20241117-001',
            created_at: new Date().toISOString(),
            ticket: {
                ticket_number: 'TK-002',
                supplier: {
                    company_name: 'Mantenimiento Integral',
                    contact_person: 'María García'
                }
            }
        }
    ];

    const mockJobs = [
        {
            id: 'JOB001',
            job_type: 'process_payment',
            status: 'pending',
            scheduled_for: new Date(Date.now() + 3600000 * 6).toISOString(),
            payment: {
                ticket: { ticket_number: 'TK-001' }
            }
        }
    ];

    payments.value = mockPayments;
    jobs.value = mockJobs;

    config.value = {
        auto_processing_enabled: true,
        payment_delay_hours: 48,
        max_amount_auto_process: 50000,
        notify_before_hours: 4
    };
    configDraft.value = { ...config.value };

    calculateStats();
};

const calculateStats = () => {
    const pending = pendingPayments.value;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    stats.value = {
        totalPendingAmount: pending.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        paymentsToday: payments.value.filter(p => {
            if (!p.completed_at) return false;
            const completedDate = new Date(p.completed_at);
            return completedDate >= today;
        }).length,
        overduePayments: pending.filter(p => new Date(p.due_date) < now).length,
        pendingJobs: scheduledJobs.value.length
    };
};

// Métodos principales
const loadData = () => {
    loading.value = true;
    try {
        loadMockData();
    } finally {
        loading.value = false;
    }
};

const processJobs = async () => {
    processingJobs.value = true;
    try {
        // Simulación de procesamiento
        await new Promise(resolve => setTimeout(resolve, 2000));

        lastProcessingResult.value = {
            processed: 3,
            successful: 3,
            failed: 0,
            success: true,
            timestamp: new Date()
        };

        toast.add({
            severity: 'success',
            summary: 'Jobs Procesados',
            detail: '3/3 jobs procesados exitosamente',
            life: 3000
        });

        loadData();
    } finally {
        processingJobs.value = false;
    }
};

const processAllPending = () => {
    confirm.require({
        message: '¿Procesar todos los pagos pendientes manualmente?',
        header: 'Confirmar Procesamiento',
        icon: 'pi pi-question-triangle',
        accept: async () => {
            processingAll.value = true;
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                toast.add({
                    severity: 'success',
                    summary: 'Procesamiento Masivo',
                    detail: `Se procesaron ${pendingPayments.value.length} pagos`,
                    life: 3000
                });

                loadData();
            } finally {
                processingAll.value = false;
            }
        }
    });
};

const processPaymentNow = async (payment) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.add({
            severity: 'success',
            summary: 'Pago Procesado',
            detail: `Pago de $${parseFloat(payment.amount).toLocaleString()} completado`,
            life: 3000
        });

        loadData();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo procesar el pago',
            life: 3000
        });
    }
};

const cancelPayment = (payment) => {
    confirm.require({
        message: `¿Cancelar el pago de $${parseFloat(payment.amount).toLocaleString()}?`,
        header: 'Cancelar Pago',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => {
            toast.add({
                severity: 'info',
                summary: 'Pago Cancelado',
                detail: 'El pago ha sido cancelado',
                life: 3000
            });
            loadData();
        }
    });
};

const executeJobNow = async (job) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.add({
            severity: 'success',
            summary: 'Job Ejecutado',
            detail: 'Job ejecutado exitosamente',
            life: 3000
        });
        loadData();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo ejecutar el job',
            life: 3000
        });
    }
};

const saveQuickConfig = () => {
    config.value = { ...configDraft.value };
    showConfigDialog.value = false;

    toast.add({
        severity: 'success',
        summary: 'Configuración Guardada',
        detail: 'La configuración se ha actualizado correctamente',
        life: 3000
    });
};

const viewPaymentDetails = (payment) => {
    selectedPayment.value = payment;
    paymentDetailsDialog.value = true;
};

// Utilidades
const getDateSeverity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (date - now) / (1000 * 60 * 60);

    if (diffHours < 0) return 'danger';
    if (diffHours < 24) return 'warn';
    return 'info';
};

const getTimeUntilDue = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (date - now) / (1000 * 60 * 60);

    if (diffHours < 0) return 'Vencido';
    if (diffHours < 1) return 'Menos de 1 hora';
    if (diffHours < 24) return `${Math.round(diffHours)}h`;
    return `${Math.round(diffHours / 24)}d`;
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
        pending: 'warn',
        scheduled: 'info',
        processing: 'primary',
        completed: 'success',
        failed: 'danger',
        cancelled: 'secondary'
    };
    return severities[status] || 'secondary';
};

const getJobTypeLabel = (type) => {
    const labels = {
        process_payment: 'Procesar Pago',
        notify: 'Notificación',
        retry_payment: 'Reintentar'
    };
    return labels[type] || type;
};

const getJobStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        running: 'Ejecutando',
        completed: 'Completado',
        failed: 'Fallido'
    };
    return labels[status] || status;
};

const getJobStatusSeverity = (status) => {
    const severities = {
        pending: 'warn',
        running: 'primary',
        completed: 'success',
        failed: 'danger'
    };
    return severities[status] || 'secondary';
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
</style>