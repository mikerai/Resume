<template>
    <div class="evidence-detail-panel">
        <div class="grid">
            <!-- Vista previa de la evidencia -->
            <div class="col-12 md:col-6">
                <div class="card h-full">
                    <h6>📎 Archivo</h6>

                    <!-- Imagen -->
                    <div v-if="evidence.file_type === 'image'" class="text-center">
                        <img
                            :src="evidence.url"
                            :alt="evidence.file_name"
                            class="w-full max-w-20rem h-auto border-round"
                        />
                        <div class="mt-3">
                            <Button
                                label="Ver Tamaño Original"
                                icon="pi pi-external-link"
                                @click="openFullSize"
                                class="p-button-outlined p-button-sm"
                            />
                        </div>
                    </div>

                    <!-- Documento -->
                    <div v-else class="text-center p-6">
                        <i :class="getFileIcon(evidence.file_name)" class="text-6xl mb-4"></i>
                        <div class="text-xl font-medium mb-2">{{ evidence.file_name }}</div>
                        <div class="text-500 mb-4">{{ formatFileSize(evidence.file_size) }}</div>
                        <Button
                            label="Abrir Documento"
                            icon="pi pi-download"
                            @click="openDocument"
                            class="p-button-outlined"
                        />
                    </div>
                </div>
            </div>

            <!-- Información y metadatos -->
            <div class="col-12 md:col-6">
                <div class="card h-full">
                    <h6>ℹ️ Información</h6>

                    <div class="field-group">
                        <div class="field">
                            <label>Tipo de Evidencia:</label>
                            <Tag
                                :value="getEvidenceTypeLabel(evidence.evidence_type)"
                                :severity="getEvidenceTypeSeverity(evidence.evidence_type)"
                            />
                        </div>

                        <div class="field">
                            <label>Estado de Aprobación:</label>
                            <Tag
                                :value="getApprovalStatusLabel(evidence.approval_status)"
                                :severity="getApprovalStatusSeverity(evidence.approval_status)"
                            />
                        </div>

                        <div class="field">
                            <label>Subido por:</label>
                            <div>{{ evidence.ticket?.supplier?.company_name || 'Proveedor no disponible' }}</div>
                        </div>

                        <div class="field">
                            <label>Fecha de subida:</label>
                            <div>{{ formatDateTime(evidence.uploaded_at) }}</div>
                        </div>

                        <div v-if="evidence.reviewed_at" class="field">
                            <label>Revisado el:</label>
                            <div>{{ formatDateTime(evidence.reviewed_at) }}</div>
                        </div>

                        <div v-if="evidence.approved_at" class="field">
                            <label>Aprobado el:</label>
                            <div>{{ formatDateTime(evidence.approved_at) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comentarios y notas -->
            <div class="col-12">
                <div class="card">
                    <h6>💬 Comentarios y Notas</h6>

                    <!-- Descripción del proveedor -->
                    <div v-if="evidence.description" class="mb-4">
                        <div class="field">
                            <label>📝 Descripción del Proveedor:</label>
                            <div class="p-3 bg-blue-50 border-round">
                                {{ evidence.description }}
                            </div>
                        </div>
                    </div>

                    <!-- Comentarios del cliente -->
                    <div v-if="evidence.client_comments" class="mb-4">
                        <div class="field">
                            <label>🗣️ Comentarios del Cliente:</label>
                            <div class="p-3 bg-orange-50 border-round">
                                {{ evidence.client_comments }}
                            </div>
                        </div>
                    </div>

                    <!-- Notas de administrador -->
                    <div class="mb-4">
                        <div class="field">
                            <label for="admin-notes">🛡️ Notas de Administrador:</label>
                            <Textarea
                                id="admin-notes"
                                v-model="adminNotes"
                                rows="3"
                                class="w-full"
                                placeholder="Agregar notas internas..."
                            />
                        </div>
                        <div class="flex justify-content-end">
                            <Button
                                label="Guardar Notas"
                                icon="pi pi-save"
                                @click="saveAdminNotes"
                                :disabled="adminNotes === (evidence.admin_notes || '')"
                                class="p-button-sm"
                            />
                        </div>
                    </div>

                    <!-- Historial de cambios -->
                    <div v-if="evidence.approval_status !== 'pending'" class="mb-4">
                        <h6>📋 Historial de Cambios</h6>
                        <Timeline :value="statusHistory" class="w-full">
                            <template #content="slotProps">
                                <div class="p-2">
                                    <div class="font-medium">{{ slotProps.item.title }}</div>
                                    <div class="text-sm text-500">{{ slotProps.item.date }}</div>
                                    <div v-if="slotProps.item.comment" class="text-sm mt-1">
                                        "{{ slotProps.item.comment }}"
                                    </div>
                                </div>
                            </template>
                        </Timeline>
                    </div>
                </div>
            </div>

            <!-- Información del ticket asociado -->
            <div class="col-12">
                <div class="card">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h6 class="m-0">🎫 Información del Ticket</h6>
                        <Button
                            label="Ver Ticket Completo"
                            icon="pi pi-external-link"
                            @click="viewFullTicket"
                            class="p-button-outlined p-button-sm"
                        />
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label>Número:</label>
                                <div class="font-medium">{{ evidence.ticket?.ticket_number }}</div>
                            </div>
                        </div>
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label>Estado:</label>
                                <Tag
                                    :value="getTicketStatusLabel(evidence.ticket?.status)"
                                    :severity="getTicketStatusSeverity(evidence.ticket?.status)"
                                />
                            </div>
                        </div>
                        <div class="col-12 md:col-4">
                            <div class="field">
                                <label>Prioridad:</label>
                                <Tag
                                    :value="getPriorityLabel(evidence.ticket?.priority)"
                                    :severity="getPrioritySeverity(evidence.ticket?.priority)"
                                />
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="field">
                                <label>Título:</label>
                                <div class="font-medium">{{ evidence.ticket?.title }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Acciones de administrador -->
            <div v-if="isAdmin" class="col-12">
                <div class="card">
                    <h6>⚙️ Acciones de Administrador</h6>
                    <div class="flex flex-wrap gap-2">
                        <Button
                            v-if="evidence.approval_status === 'rejected' && evidence.client_comments"
                            label="Mediar Disputa"
                            icon="pi pi-users"
                            @click="$emit('mediate-dispute')"
                            class="p-button-warning"
                        />
                        <Button
                            label="Ver Analytics del Proveedor"
                            icon="pi pi-chart-line"
                            @click="viewSupplierAnalytics"
                            class="p-button-info"
                        />
                        <Button
                            label="Historial Completo"
                            icon="pi pi-history"
                            @click="viewFullHistory"
                            class="p-button-secondary"
                        />
                        <Button
                            v-if="canOverrideDecision"
                            label="Anular Decisión"
                            icon="pi pi-exclamation-triangle"
                            @click="confirmOverride"
                            class="p-button-danger p-button-outlined"
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
    evidence: {
        type: Object,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['admin-comment-added', 'status-updated', 'mediate-dispute']);

const supabase = useSupabaseClient();
const toast = useToast();
const confirm = useConfirm();

// Estados reactivos
const adminNotes = ref(props.evidence.admin_notes || '');

// Computadas
const canOverrideDecision = computed(() => {
    return props.isAdmin && props.evidence.approval_status !== 'pending';
});

const statusHistory = computed(() => {
    const history = [];

    history.push({
        title: 'Evidencia subida',
        date: formatDateTime(props.evidence.uploaded_at),
        comment: props.evidence.description
    });

    if (props.evidence.reviewed_at) {
        history.push({
            title: 'Revisada por cliente',
            date: formatDateTime(props.evidence.reviewed_at),
            comment: props.evidence.client_comments
        });
    }

    if (props.evidence.approved_at) {
        history.push({
            title: 'Aprobada',
            date: formatDateTime(props.evidence.approved_at)
        });
    }

    return history;
});

// Métodos
const saveAdminNotes = async () => {
    try {
        const { error } = await supabase
            .from('ticket_evidence')
            .update({
                admin_notes: adminNotes.value,
                admin_reviewed_at: new Date().toISOString(),
                admin_reviewed_by: supabase.auth.user()?.id
            })
            .eq('id', props.evidence.id);

        if (error) throw error;

        emit('admin-comment-added');

        toast.add({
            severity: 'success',
            summary: 'Notas guardadas',
            detail: 'Las notas de administrador se han guardado',
            life: 3000
        });

    } catch (error) {
        console.error('Error saving admin notes:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron guardar las notas',
            life: 3000
        });
    }
};

const openFullSize = () => {
    window.open(props.evidence.url, '_blank');
};

const openDocument = () => {
    window.open(props.evidence.url, '_blank');
};

const viewFullTicket = () => {
    window.open(`/admin/tickets/${props.evidence.ticket.id}`, '_blank');
};

const viewSupplierAnalytics = () => {
    window.open(`/admin/suppliers/${props.evidence.ticket.supplier?.id}/analytics`, '_blank');
};

const viewFullHistory = () => {
    // Implementar vista de historial completo
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'El historial completo estará disponible pronto',
        life: 3000
    });
};

const confirmOverride = () => {
    confirm.require({
        message: '¿Estás seguro de anular la decisión actual? Esta acción requiere justificación.',
        header: 'Anular Decisión',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => {
            // Implementar anulación de decisión
            toast.add({
                severity: 'warn',
                summary: 'Función en desarrollo',
                detail: 'La anulación de decisiones estará disponible pronto',
                life: 3000
            });
        }
    });
};

// Utilidades
const getEvidenceTypeLabel = (type) => {
    const labels = {
        before: 'Estado Inicial',
        progress: 'Proceso de Trabajo',
        after: 'Resultado Final',
        document: 'Documento/Reporte'
    };
    return labels[type] || type;
};

const getEvidenceTypeSeverity = (type) => {
    const severities = {
        before: 'info',
        progress: 'warning',
        after: 'success',
        document: 'secondary'
    };
    return severities[type] || 'secondary';
};

const getApprovalStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente de Revisión',
        approved: 'Aprobada',
        rejected: 'Rechazada'
    };
    return labels[status] || status;
};

const getApprovalStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return severities[status] || 'secondary';
};

const getTicketStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        opened: 'Abierto',
        in_progress: 'En Progreso',
        completed: 'Completado',
        under_review: 'En Revisión',
        approved: 'Aprobado',
        rejected: 'Rechazado'
    };
    return labels[status] || status;
};

const getTicketStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        opened: 'info',
        in_progress: 'primary',
        completed: 'success',
        under_review: 'secondary',
        approved: 'success',
        rejected: 'danger'
    };
    return severities[status] || 'secondary';
};

const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
};

const getPrioritySeverity = (priority) => {
    const severities = {
        low: 'success',
        medium: 'info',
        high: 'warning',
        urgent: 'danger'
    };
    return severities[priority] || 'secondary';
};

const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const icons = {
        pdf: 'pi pi-file-pdf text-red-500',
        doc: 'pi pi-file-word text-blue-500',
        docx: 'pi pi-file-word text-blue-500',
        xls: 'pi pi-file-excel text-green-500',
        xlsx: 'pi pi-file-excel text-green-500'
    };
    return icons[extension] || 'pi pi-file text-gray-500';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
</script>

<style scoped>
.field-group .field {
    margin-bottom: 1rem;
}

.field-group .field:last-child {
    margin-bottom: 0;
}

.max-w-20rem {
    max-width: 20rem;
}
</style>