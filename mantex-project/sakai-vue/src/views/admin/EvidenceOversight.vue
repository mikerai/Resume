<template>
    <div>
        <!-- Header Stats Cards - Sakai Standard -->
        <div class="grid">
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Total Evidencias</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalEvidence }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-images text-blue-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-blue-500 font-medium">+{{ stats.newThisWeek }} </span>
                    <span class="text-muted-color">esta semana</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Pendientes</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.pendingEvidence }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-clock text-orange-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-orange-500 font-medium">Requieren </span>
                    <span class="text-muted-color">revisión</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Aprobadas</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.approvedEvidence }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-check-circle text-green-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">{{ approvalRate }}% </span>
                    <span class="text-muted-color">tasa aprobación</span>
                </div>
            </div>
            <div class="col-12 lg:col-6 xl:col-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Rechazadas</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.rejectedEvidence }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-times-circle text-red-500 !text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">{{ stats.avgRejectionTime }}h </span>
                    <span class="text-muted-color">tiempo promedio</span>
                </div>
            </div>
        </div>

        <!-- Main Content Card -->
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button
                        label="Aprobar Seleccionadas"
                        icon="pi pi-check"
                        severity="success"
                        class="mr-2"
                        @click="approveSelected"
                        :disabled="!selectedEvidence || !selectedEvidence.length"
                    />
                    <Button
                        label="Rechazar Seleccionadas"
                        icon="pi pi-times"
                        severity="danger"
                        @click="rejectSelected"
                        :disabled="!selectedEvidence || !selectedEvidence.length"
                    />
                </template>
                <template #end>
                    <Button
                        label="Exportar Reporte"
                        icon="pi pi-download"
                        severity="secondary"
                        @click="exportReport"
                    />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedEvidence"
                :value="filteredEvidence"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} evidencias"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Supervisión de Evidencias</h4>
                        <div class="flex gap-2">
                            <Dropdown
                                v-model="selectedStatus"
                                :options="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Estado"
                                class="w-44"
                            />
                            <Dropdown
                                v-model="selectedType"
                                :options="typeOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Tipo"
                                class="w-36"
                            />
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                            </IconField>
                        </div>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="ticket_number" header="Ticket" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="font-medium text-primary">#{{ slotProps.data.ticket?.ticket_number || 'N/A' }}</div>
                    </template>
                </Column>
                <Column field="supplier" header="Proveedor" sortable style="min-width: 16rem">
                    <template #body="slotProps">
                        <div v-if="slotProps.data.supplier">
                            <div class="font-medium">{{ slotProps.data.supplier.company_name }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.supplier.contact_person }}</div>
                        </div>
                        <span v-else class="text-muted-color">No asignado</span>
                    </template>
                </Column>
                <Column field="evidence_type" header="Tipo" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag :value="getEvidenceTypeLabel(slotProps.data.evidence_type)" :severity="getEvidenceTypeSeverity(slotProps.data.evidence_type)" />
                    </template>
                </Column>
                <Column field="files_count" header="Archivos" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <div class="font-medium">{{ slotProps.data.files?.length || 0 }} archivos</div>
                        <div class="text-sm text-muted-color">{{ getTotalSize(slotProps.data.files) }}</div>
                    </template>
                </Column>
                <Column field="uploaded_at" header="Subido" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="text-sm">{{ formatDateTime(slotProps.data.uploaded_at) }}</div>
                        <div class="text-xs text-muted-color">{{ getTimeAgo(slotProps.data.uploaded_at) }}</div>
                    </template>
                </Column>
                <Column field="approval_status" header="Estado" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="getApprovalStatusLabel(slotProps.data.approval_status)" :severity="getApprovalStatusSeverity(slotProps.data.approval_status)" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 14rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" severity="info" text rounded @click="viewEvidence(slotProps.data)" class="mr-2" />
                        <Button
                            v-if="slotProps.data.approval_status === 'pending'"
                            icon="pi pi-check"
                            severity="success"
                            text
                            rounded
                            @click="approveEvidence(slotProps.data)"
                            class="mr-2"
                        />
                        <Button
                            v-if="slotProps.data.approval_status === 'pending'"
                            icon="pi pi-times"
                            severity="danger"
                            text
                            rounded
                            @click="rejectEvidence(slotProps.data)"
                        />
                        <Button
                            v-if="slotProps.data.approval_status !== 'pending'"
                            icon="pi pi-download"
                            severity="secondary"
                            text
                            rounded
                            @click="downloadEvidence(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Evidence Details Dialog -->
        <Dialog v-model:visible="evidenceDialog" :style="{ width: '1000px' }" header="Detalles de Evidencia" :modal="true">
            <div v-if="selectedEvidenceItem" class="flex flex-col gap-6">
                <!-- Evidence Info -->
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label class="font-bold">Ticket:</label>
                            <p class="font-medium text-primary">#{{ selectedEvidenceItem.ticket?.ticket_number }}</p>
                        </div>
                        <div class="field">
                            <label class="font-bold">Proveedor:</label>
                            <p>{{ selectedEvidenceItem.supplier?.company_name || 'No asignado' }}</p>
                        </div>
                        <div class="field">
                            <label class="font-bold">Tipo de Evidencia:</label>
                            <Tag :value="getEvidenceTypeLabel(selectedEvidenceItem.evidence_type)" :severity="getEvidenceTypeSeverity(selectedEvidenceItem.evidence_type)" />
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="field">
                            <label class="font-bold">Estado:</label>
                            <Tag :value="getApprovalStatusLabel(selectedEvidenceItem.approval_status)" :severity="getApprovalStatusSeverity(selectedEvidenceItem.approval_status)" />
                        </div>
                        <div class="field">
                            <label class="font-bold">Subido:</label>
                            <p>{{ formatDateTime(selectedEvidenceItem.uploaded_at) }}</p>
                        </div>
                        <div class="field" v-if="selectedEvidenceItem.reviewed_at">
                            <label class="font-bold">Revisado:</label>
                            <p>{{ formatDateTime(selectedEvidenceItem.reviewed_at) }}</p>
                        </div>
                    </div>
                </div>

                <!-- Files Gallery -->
                <div class="field">
                    <label class="font-bold">Archivos de Evidencia:</label>
                    <div class="grid mt-2">
                        <div v-for="file in selectedEvidenceItem.files" :key="file.id" class="col-12 md:col-4 lg:col-3">
                            <div class="border-1 border-round p-3 text-center">
                                <div v-if="isImage(file.file_name)" class="mb-2">
                                    <img :src="file.file_url" :alt="file.file_name" class="w-full border-round" style="max-height: 200px; object-fit: cover" />
                                </div>
                                <div v-else class="mb-2">
                                    <i class="pi pi-file text-4xl text-muted-color"></i>
                                </div>
                                <div class="text-sm font-medium">{{ file.file_name }}</div>
                                <div class="text-xs text-muted-color">{{ formatFileSize(file.file_size) }}</div>
                                <Button icon="pi pi-download" text rounded @click="downloadFile(file)" class="mt-2" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="field" v-if="selectedEvidenceItem.description">
                    <label class="font-bold">Descripción:</label>
                    <p>{{ selectedEvidenceItem.description }}</p>
                </div>

                <!-- Review Notes -->
                <div class="field" v-if="selectedEvidenceItem.review_notes">
                    <label class="font-bold">Notas de Revisión:</label>
                    <p>{{ selectedEvidenceItem.review_notes }}</p>
                </div>

                <!-- Review Form -->
                <div v-if="selectedEvidenceItem.approval_status === 'pending'" class="field">
                    <label class="font-bold">Notas de Revisión:</label>
                    <Textarea v-model="reviewNotes" rows="3" placeholder="Agregar notas sobre la revisión..." fluid />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between w-full">
                    <div>
                        <Button
                            v-if="selectedEvidenceItem?.approval_status === 'pending'"
                            label="Rechazar"
                            icon="pi pi-times"
                            severity="danger"
                            @click="rejectEvidence(selectedEvidenceItem)"
                        />
                    </div>
                    <div class="flex gap-2">
                        <Button label="Cerrar" icon="pi pi-times" text @click="evidenceDialog = false" />
                        <Button
                            v-if="selectedEvidenceItem?.approval_status === 'pending'"
                            label="Aprobar"
                            icon="pi pi-check"
                            severity="success"
                            @click="approveEvidence(selectedEvidenceItem)"
                        />
                    </div>
                </div>
            </template>
        </Dialog>

        <!-- Rejection Dialog -->
        <Dialog v-model:visible="rejectionDialog" :style="{ width: '500px' }" header="Rechazar Evidencia" :modal="true">
            <div class="flex flex-col gap-4">
                <p>¿Está seguro de que desea rechazar esta evidencia?</p>
                <div class="field">
                    <label class="font-bold">Motivo del rechazo *</label>
                    <Textarea v-model="rejectionReason" rows="4" placeholder="Explique el motivo del rechazo..." required fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="rejectionDialog = false" />
                <Button label="Confirmar Rechazo" icon="pi pi-check" severity="danger" @click="confirmRejection" />
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
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const toast = useToast();
const confirm = useConfirm();
const dt = ref();

// Estados reactivos
const loading = ref(false);
const evidence = ref([]);
const selectedEvidence = ref([]);
const selectedEvidenceItem = ref(null);
const selectedStatus = ref('all');
const selectedType = ref('all');
const reviewNotes = ref('');
const rejectionReason = ref('');

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const stats = ref({
    totalEvidence: 0,
    pendingEvidence: 0,
    approvedEvidence: 0,
    rejectedEvidence: 0,
    newThisWeek: 0,
    avgRejectionTime: 0
});

// Diálogos
const evidenceDialog = ref(false);
const rejectionDialog = ref(false);

// Opciones
const statusOptions = ref([
    { label: 'Todos', value: 'all' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Aprobado', value: 'approved' },
    { label: 'Rechazado', value: 'rejected' }
]);

const typeOptions = ref([
    { label: 'Todos', value: 'all' },
    { label: 'Antes', value: 'before' },
    { label: 'Durante', value: 'during' },
    { label: 'Después', value: 'after' },
    { label: 'Adicional', value: 'additional' }
]);

// Computadas
const filteredEvidence = computed(() => {
    let filtered = evidence.value;

    if (selectedStatus.value !== 'all') {
        filtered = filtered.filter(e => e.approval_status === selectedStatus.value);
    }

    if (selectedType.value !== 'all') {
        filtered = filtered.filter(e => e.evidence_type === selectedType.value);
    }

    return filtered;
});

const approvalRate = computed(() => {
    const total = stats.value.approvedEvidence + stats.value.rejectedEvidence;
    return total > 0 ? Math.round((stats.value.approvedEvidence / total) * 100) : 0;
});

// Mock data para demostración
const loadMockData = () => {
    const mockEvidence = [
        {
            id: 'EV001',
            ticket: { ticket_number: 'TK-001' },
            supplier: { company_name: 'Servicios Técnicos SA', contact_person: 'Juan Pérez' },
            evidence_type: 'before',
            approval_status: 'pending',
            uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            description: 'Evidencia antes del trabajo de mantenimiento',
            files: [
                {
                    id: 'F001',
                    file_name: 'antes_mantenimiento_1.jpg',
                    file_size: 1024000,
                    file_url: 'https://via.placeholder.com/400x300/007bff/ffffff?text=Antes'
                },
                {
                    id: 'F002',
                    file_name: 'antes_mantenimiento_2.jpg',
                    file_size: 856000,
                    file_url: 'https://via.placeholder.com/400x300/007bff/ffffff?text=Antes+2'
                }
            ]
        },
        {
            id: 'EV002',
            ticket: { ticket_number: 'TK-002' },
            supplier: { company_name: 'Mantenimiento Integral', contact_person: 'María García' },
            evidence_type: 'after',
            approval_status: 'approved',
            uploaded_at: new Date(Date.now() - 3600000 * 6).toISOString(),
            reviewed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            description: 'Evidencia después del trabajo completado',
            review_notes: 'Excelente trabajo, evidencia clara y completa',
            files: [
                {
                    id: 'F003',
                    file_name: 'despues_trabajo.jpg',
                    file_size: 1200000,
                    file_url: 'https://via.placeholder.com/400x300/28a745/ffffff?text=Después'
                }
            ]
        },
        {
            id: 'EV003',
            ticket: { ticket_number: 'TK-003' },
            supplier: { company_name: 'Reparaciones López', contact_person: 'Carlos López' },
            evidence_type: 'during',
            approval_status: 'rejected',
            uploaded_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            reviewed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
            description: 'Evidencia durante el proceso',
            review_notes: 'Imágenes borrosas, requiere evidencia más clara',
            files: [
                {
                    id: 'F004',
                    file_name: 'proceso_trabajo.pdf',
                    file_size: 2400000,
                    file_url: '#'
                }
            ]
        }
    ];

    evidence.value = mockEvidence;
    calculateStats();
};

const calculateStats = () => {
    const total = evidence.value.length;
    const pending = evidence.value.filter(e => e.approval_status === 'pending').length;
    const approved = evidence.value.filter(e => e.approval_status === 'approved').length;
    const rejected = evidence.value.filter(e => e.approval_status === 'rejected').length;

    stats.value = {
        totalEvidence: total,
        pendingEvidence: pending,
        approvedEvidence: approved,
        rejectedEvidence: rejected,
        newThisWeek: Math.floor(total * 0.3),
        avgRejectionTime: 4
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

const viewEvidence = (evidenceItem) => {
    selectedEvidenceItem.value = evidenceItem;
    reviewNotes.value = evidenceItem.review_notes || '';
    evidenceDialog.value = true;
};

const approveEvidence = async (evidenceItem) => {
    try {
        // Simulación de aprobación
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.add({
            severity: 'success',
            summary: 'Evidencia Aprobada',
            detail: `Evidencia de ticket #${evidenceItem.ticket?.ticket_number} aprobada`,
            life: 3000
        });

        evidenceDialog.value = false;
        loadData();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo aprobar la evidencia',
            life: 3000
        });
    }
};

const rejectEvidence = (evidenceItem) => {
    selectedEvidenceItem.value = evidenceItem;
    rejectionReason.value = '';
    rejectionDialog.value = true;
};

const confirmRejection = async () => {
    if (!rejectionReason.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Campo Requerido',
            detail: 'Debe proporcionar un motivo para el rechazo',
            life: 3000
        });
        return;
    }

    try {
        // Simulación de rechazo
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.add({
            severity: 'info',
            summary: 'Evidencia Rechazada',
            detail: `Evidencia de ticket #${selectedEvidenceItem.value.ticket?.ticket_number} rechazada`,
            life: 3000
        });

        rejectionDialog.value = false;
        evidenceDialog.value = false;
        loadData();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo rechazar la evidencia',
            life: 3000
        });
    }
};

const approveSelected = () => {
    if (!selectedEvidence.value?.length) return;

    confirm.require({
        message: `¿Aprobar ${selectedEvidence.value.length} evidencias seleccionadas?`,
        header: 'Confirmar Aprobación',
        icon: 'pi pi-question-triangle',
        accept: async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                toast.add({
                    severity: 'success',
                    summary: 'Evidencias Aprobadas',
                    detail: `Se aprobaron ${selectedEvidence.value.length} evidencias`,
                    life: 3000
                });

                selectedEvidence.value = [];
                loadData();
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron aprobar todas las evidencias',
                    life: 3000
                });
            }
        }
    });
};

const rejectSelected = () => {
    if (!selectedEvidence.value?.length) return;

    confirm.require({
        message: `¿Rechazar ${selectedEvidence.value.length} evidencias seleccionadas?`,
        header: 'Confirmar Rechazo',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                toast.add({
                    severity: 'info',
                    summary: 'Evidencias Rechazadas',
                    detail: `Se rechazaron ${selectedEvidence.value.length} evidencias`,
                    life: 3000
                });

                selectedEvidence.value = [];
                loadData();
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron rechazar todas las evidencias',
                    life: 3000
                });
            }
        }
    });
};

const downloadEvidence = (evidenceItem) => {
    toast.add({
        severity: 'info',
        summary: 'Descarga Iniciada',
        detail: 'Descargando evidencia completa...',
        life: 3000
    });
};

const downloadFile = (file) => {
    toast.add({
        severity: 'info',
        summary: 'Descarga Iniciada',
        detail: `Descargando ${file.file_name}...`,
        life: 3000
    });
};

const exportReport = () => {
    toast.add({
        severity: 'info',
        summary: 'Reporte Exportado',
        detail: 'El reporte de evidencias se está generando...',
        life: 3000
    });
};

// Utilidades
const getEvidenceTypeLabel = (type) => {
    const labels = {
        before: 'Antes',
        during: 'Durante',
        after: 'Después',
        additional: 'Adicional'
    };
    return labels[type] || type;
};

const getEvidenceTypeSeverity = (type) => {
    const severities = {
        before: 'info',
        during: 'warn',
        after: 'success',
        additional: 'secondary'
    };
    return severities[type] || 'info';
};

const getApprovalStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado'
    };
    return labels[status] || status;
};

const getApprovalStatusSeverity = (status) => {
    const severities = {
        pending: 'warn',
        approved: 'success',
        rejected: 'danger'
    };
    return severities[status] || 'info';
};

const getTotalSize = (files) => {
    if (!files?.length) return '0 KB';
    const total = files.reduce((sum, file) => sum + (file.file_size || 0), 0);
    return formatFileSize(total);
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const isImage = (fileName) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
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

const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 1) return 'Hace menos de 1h';
    if (diffHours < 24) return `Hace ${Math.round(diffHours)}h`;
    const diffDays = Math.round(diffHours / 24);
    return `Hace ${diffDays} días`;
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
</style>