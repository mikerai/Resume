<template>
    <div class="evidence-review">
        <div class="card">
            <div class="flex align-items-center justify-content-between mb-4">
                <h5 class="m-0">🔍 Revisión de Evidencias</h5>
                <div class="flex align-items-center gap-2">
                    <Tag :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" />
                    <Tag v-if="ticket.evidence_status" :value="getEvidenceStatusLabel(ticket.evidence_status)" :severity="getEvidenceStatusSeverity(ticket.evidence_status)" />
                </div>
            </div>

            <!-- Información del ticket -->
            <div class="grid mb-4">
                <div class="col-12 md:col-4">
                    <div class="p-3 border-1 surface-border border-round">
                        <div class="text-sm text-500 mb-1">Ticket</div>
                        <div class="font-medium">{{ ticket.ticket_number }}</div>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="p-3 border-1 surface-border border-round">
                        <div class="text-sm text-500 mb-1">Proveedor</div>
                        <div class="font-medium">{{ ticket.supplier?.company_name || 'No asignado' }}</div>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="p-3 border-1 surface-border border-round">
                        <div class="text-sm text-500 mb-1">Trabajo</div>
                        <div class="font-medium">{{ ticket.title }}</div>
                    </div>
                </div>
            </div>

            <!-- Mensaje si no hay evidencias -->
            <div v-if="!loading && evidence.length === 0" class="text-center p-6">
                <i class="pi pi-image text-4xl text-300 mb-3"></i>
                <div class="text-xl text-500 mb-2">No hay evidencias disponibles</div>
                <div class="text-sm text-400">El proveedor aún no ha subido evidencias para este trabajo</div>
            </div>

            <!-- Categorías de evidencias -->
            <div v-else-if="!loading" class="evidence-categories">

                <!-- Fotos del Estado Inicial -->
                <div v-if="beforeEvidence.length > 0" class="mb-6">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h6 class="m-0 flex align-items-center gap-2">
                            <i class="pi pi-camera text-blue-500"></i>
                            📷 Estado Inicial
                        </h6>
                        <Badge :value="beforeEvidence.length" />
                    </div>
                    <div class="grid">
                        <div
                            v-for="item in beforeEvidence"
                            :key="item.id"
                            class="col-12 sm:col-6 md:col-4 lg:col-3"
                        >
                            <EvidenceCard
                                :evidence="item"
                                :can-approve="canApproveEvidence"
                                @view="viewEvidence"
                                @approve="approveEvidence"
                                @reject="rejectEvidence"
                                @comment="openCommentDialog"
                            />
                        </div>
                    </div>
                </div>

                <!-- Fotos del Proceso -->
                <div v-if="progressEvidence.length > 0" class="mb-6">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h6 class="m-0 flex align-items-center gap-2">
                            <i class="pi pi-cog text-orange-500"></i>
                            🔧 Proceso de Trabajo
                        </h6>
                        <Badge :value="progressEvidence.length" />
                    </div>
                    <div class="grid">
                        <div
                            v-for="item in progressEvidence"
                            :key="item.id"
                            class="col-12 sm:col-6 md:col-4 lg:col-3"
                        >
                            <EvidenceCard
                                :evidence="item"
                                :can-approve="canApproveEvidence"
                                @view="viewEvidence"
                                @approve="approveEvidence"
                                @reject="rejectEvidence"
                                @comment="openCommentDialog"
                            />
                        </div>
                    </div>
                </div>

                <!-- Fotos del Resultado Final -->
                <div v-if="afterEvidence.length > 0" class="mb-6">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h6 class="m-0 flex align-items-center gap-2">
                            <i class="pi pi-check-circle text-green-500"></i>
                            ✅ Resultado Final
                        </h6>
                        <Badge :value="afterEvidence.length" />
                    </div>
                    <div class="grid">
                        <div
                            v-for="item in afterEvidence"
                            :key="item.id"
                            class="col-12 sm:col-6 md:col-4 lg:col-3"
                        >
                            <EvidenceCard
                                :evidence="item"
                                :can-approve="canApproveEvidence"
                                @view="viewEvidence"
                                @approve="approveEvidence"
                                @reject="rejectEvidence"
                                @comment="openCommentDialog"
                            />
                        </div>
                    </div>
                </div>

                <!-- Documentos -->
                <div v-if="documentEvidence.length > 0" class="mb-6">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h6 class="m-0 flex align-items-center gap-2">
                            <i class="pi pi-file text-purple-500"></i>
                            📄 Documentos y Reportes
                        </h6>
                        <Badge :value="documentEvidence.length" />
                    </div>
                    <div class="grid">
                        <div
                            v-for="item in documentEvidence"
                            :key="item.id"
                            class="col-12 sm:col-6 md:col-4"
                        >
                            <EvidenceCard
                                :evidence="item"
                                :can-approve="canApproveEvidence"
                                @view="viewEvidence"
                                @approve="approveEvidence"
                                @reject="rejectEvidence"
                                @comment="openCommentDialog"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección de decisión final -->
            <div v-if="canMakeFinalDecision" class="mt-6 pt-4 border-top-1 surface-border">
                <div class="flex align-items-center justify-content-between mb-4">
                    <h6 class="m-0">📝 Decisión Final del Trabajo</h6>
                    <div class="text-sm text-500">
                        Total evidencias: {{ evidence.length }} |
                        Aprobadas: {{ approvedCount }} |
                        Rechazadas: {{ rejectedCount }}
                    </div>
                </div>

                <div class="grid">
                    <div class="col-12 md:col-8">
                        <div class="field">
                            <label for="final-comments">Comentarios finales:</label>
                            <Textarea
                                id="final-comments"
                                v-model="finalComments"
                                rows="4"
                                class="w-full"
                                placeholder="Agrega comentarios sobre el trabajo completado..."
                            />
                        </div>
                    </div>
                    <div class="col-12 md:col-4">
                        <div class="flex flex-column gap-3 h-full justify-content-center">
                            <Button
                                label="✅ Aprobar Trabajo"
                                icon="pi pi-check"
                                class="p-button-success"
                                @click="approveWork"
                                :disabled="!canApproveWork"
                            />
                            <Button
                                label="❌ Solicitar Correcciones"
                                icon="pi pi-times"
                                class="p-button-warning"
                                @click="requestRevisions"
                                :disabled="finalComments.trim().length === 0"
                            />
                            <Button
                                label="🚫 Rechazar Trabajo"
                                icon="pi pi-ban"
                                class="p-button-danger"
                                @click="rejectWork"
                                :disabled="finalComments.trim().length === 0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen de acciones completadas -->
            <div v-if="ticket.status === 'approved'" class="mt-4 p-4 bg-green-50 border-round">
                <div class="flex align-items-center gap-2 text-green-700 font-medium mb-2">
                    <i class="pi pi-check-circle"></i>
                    Trabajo Aprobado
                </div>
                <div class="text-sm text-green-600">
                    Este trabajo ha sido aprobado el {{ formatDate(ticket.approved_at) }}.
                    <span v-if="ticket.client_notes"> Comentarios: "{{ ticket.client_notes }}"</span>
                </div>
            </div>
        </div>

        <!-- Modal de vista previa -->
        <Dialog
            v-model:visible="previewVisible"
            modal
            :header="selectedEvidence?.file_name"
            class="w-full md:w-8"
        >
            <div v-if="selectedEvidence">
                <!-- Vista previa de imagen -->
                <img
                    v-if="selectedEvidence.file_type === 'image'"
                    :src="selectedEvidence.url"
                    :alt="selectedEvidence.file_name"
                    class="w-full h-auto max-h-30rem object-contain"
                />

                <!-- Información del documento -->
                <div v-else class="text-center p-4">
                    <i class="pi pi-file-pdf text-6xl text-red-500 mb-4"></i>
                    <div class="text-xl font-medium mb-2">{{ selectedEvidence.file_name }}</div>
                    <div class="text-sm text-500 mb-4">{{ formatFileSize(selectedEvidence.file_size) }}</div>
                    <Button label="Abrir Documento" icon="pi pi-external-link" @click="openDocument(selectedEvidence)" />
                </div>

                <!-- Metadatos -->
                <div class="mt-4 pt-4 border-top-1 surface-border">
                    <div class="grid text-sm">
                        <div class="col-6">
                            <div class="text-500">Subido por:</div>
                            <div class="font-medium">{{ ticket.supplier?.company_name }}</div>
                        </div>
                        <div class="col-6">
                            <div class="text-500">Fecha:</div>
                            <div class="font-medium">{{ formatDate(selectedEvidence.uploaded_at) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Dialog para comentar evidencia -->
        <Dialog v-model:visible="commentVisible" modal :style="{ width: '450px' }" header="Comentar Evidencia">
            <div class="field">
                <label>Archivo:</label>
                <p class="font-medium">{{ commentEvidence?.file_name }}</p>
            </div>
            <div class="field">
                <label for="evidence-comment">Comentario:</label>
                <Textarea
                    id="evidence-comment"
                    v-model="evidenceComment"
                    rows="4"
                    class="w-full"
                    placeholder="Agrega un comentario sobre esta evidencia..."
                />
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="commentVisible = false" />
                <Button label="Guardar Comentario" icon="pi pi-check" @click="saveComment" />
            </template>
        </Dialog>

        <!-- Confirmaciones -->
        <ConfirmDialog />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import EvidenceCard from '@/components/common/EvidenceCard.vue';

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['work-approved', 'revisions-requested', 'work-rejected', 'evidence-updated']);

const supabase = useSupabaseClient();
const toast = useToast();
const confirm = useConfirm();

// Estados reactivos
const evidence = ref([]);
const loading = ref(false);
const previewVisible = ref(false);
const selectedEvidence = ref(null);
const commentVisible = ref(false);
const commentEvidence = ref(null);
const evidenceComment = ref('');
const finalComments = ref('');

// Computadas para categorizar evidencias
const beforeEvidence = computed(() => evidence.value.filter(e => e.evidence_type === 'before'));
const progressEvidence = computed(() => evidence.value.filter(e => e.evidence_type === 'progress'));
const afterEvidence = computed(() => evidence.value.filter(e => e.evidence_type === 'after'));
const documentEvidence = computed(() => evidence.value.filter(e => e.evidence_type === 'document'));

// Permisos
const canApproveEvidence = computed(() => {
    return ['completed', 'under_review'].includes(props.ticket.status);
});

const canMakeFinalDecision = computed(() => {
    return props.ticket.status === 'under_review' && evidence.value.length > 0;
});

// Contadores
const approvedCount = computed(() => evidence.value.filter(e => e.approval_status === 'approved').length);
const rejectedCount = computed(() => evidence.value.filter(e => e.approval_status === 'rejected').length);

const canApproveWork = computed(() => {
    const hasRequiredEvidence = beforeEvidence.value.length > 0 && afterEvidence.value.length > 0;
    const hasNoRejectedEvidence = rejectedCount.value === 0;
    return hasRequiredEvidence && hasNoRejectedEvidence;
});

// Métodos de carga
const loadEvidence = async () => {
    try {
        loading.value = true;

        const { data, error } = await supabase
            .from('ticket_evidence')
            .select('*')
            .eq('ticket_id', props.ticket.id)
            .order('evidence_type')
            .order('uploaded_at', { ascending: true });

        if (error) throw error;

        evidence.value = data || [];

    } catch (error) {
        console.error('Error loading evidence:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar las evidencias',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Acciones de evidencias individuales
const viewEvidence = (evidenceItem) => {
    selectedEvidence.value = evidenceItem;
    previewVisible.value = true;
};

const approveEvidence = async (evidenceItem) => {
    try {
        const { error } = await supabase
            .from('ticket_evidence')
            .update({
                approval_status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: supabase.auth.user()?.id
            })
            .eq('id', evidenceItem.id);

        if (error) throw error;

        await loadEvidence();
        emit('evidence-updated');

        toast.add({
            severity: 'success',
            summary: 'Evidencia aprobada',
            detail: 'La evidencia ha sido aprobada',
            life: 3000
        });

    } catch (error) {
        console.error('Error approving evidence:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo aprobar la evidencia',
            life: 3000
        });
    }
};

const rejectEvidence = (evidenceItem) => {
    commentEvidence.value = evidenceItem;
    evidenceComment.value = '';
    commentVisible.value = true;
};

const openCommentDialog = (evidenceItem) => {
    commentEvidence.value = evidenceItem;
    evidenceComment.value = evidenceItem.client_comments || '';
    commentVisible.value = true;
};

const saveComment = async () => {
    try {
        const isRejection = commentEvidence.value.approval_status !== 'approved';

        const { error } = await supabase
            .from('ticket_evidence')
            .update({
                client_comments: evidenceComment.value,
                approval_status: isRejection ? 'rejected' : commentEvidence.value.approval_status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: supabase.auth.user()?.id
            })
            .eq('id', commentEvidence.value.id);

        if (error) throw error;

        await loadEvidence();
        commentVisible.value = false;
        emit('evidence-updated');

        toast.add({
            severity: 'success',
            summary: isRejection ? 'Evidencia rechazada' : 'Comentario guardado',
            detail: isRejection ? 'La evidencia ha sido rechazada' : 'El comentario se ha guardado',
            life: 3000
        });

    } catch (error) {
        console.error('Error saving comment:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el comentario',
            life: 3000
        });
    }
};

// Acciones finales del trabajo
const approveWork = async () => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                client_notes: finalComments.value
            })
            .eq('id', props.ticket.id);

        if (error) throw error;

        emit('work-approved');

        toast.add({
            severity: 'success',
            summary: 'Trabajo Aprobado',
            detail: 'El trabajo ha sido aprobado y se procederá al pago',
            life: 3000
        });

    } catch (error) {
        console.error('Error approving work:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo aprobar el trabajo',
            life: 3000
        });
    }
};

const requestRevisions = () => {
    confirm.require({
        message: '¿Solicitar correcciones al proveedor? Esto enviará el trabajo de vuelta para revisión.',
        header: 'Solicitar Correcciones',
        icon: 'pi pi-question-triangle',
        accept: async () => {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update({
                        status: 'revision_requested',
                        revision_comments: finalComments.value
                    })
                    .eq('id', props.ticket.id);

                if (error) throw error;

                emit('revisions-requested');

                toast.add({
                    severity: 'info',
                    summary: 'Correcciones Solicitadas',
                    detail: 'Se ha solicitado al proveedor realizar correcciones',
                    life: 3000
                });

            } catch (error) {
                console.error('Error requesting revisions:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo solicitar las correcciones',
                    life: 3000
                });
            }
        }
    });
};

const rejectWork = () => {
    confirm.require({
        message: '¿Rechazar completamente este trabajo? Esta acción no se puede deshacer.',
        header: 'Rechazar Trabajo',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update({
                        status: 'rejected',
                        rejection_reason: finalComments.value,
                        rejected_at: new Date().toISOString()
                    })
                    .eq('id', props.ticket.id);

                if (error) throw error;

                emit('work-rejected');

                toast.add({
                    severity: 'error',
                    summary: 'Trabajo Rechazado',
                    detail: 'El trabajo ha sido rechazado',
                    life: 3000
                });

            } catch (error) {
                console.error('Error rejecting work:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo rechazar el trabajo',
                    life: 3000
                });
            }
        }
    });
};

// Utilidades
const openDocument = (evidenceItem) => {
    window.open(evidenceItem.url, '_blank');
};

const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        opened: 'Abierto',
        in_progress: 'En Progreso',
        completed: 'Completado',
        under_review: 'En Revisión',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        revision_requested: 'Corrección Solicitada'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        pending: 'warning',
        opened: 'info',
        in_progress: 'primary',
        completed: 'success',
        under_review: 'secondary',
        approved: 'success',
        rejected: 'danger',
        revision_requested: 'warning'
    };
    return severities[status] || 'secondary';
};

const getEvidenceStatusLabel = (status) => {
    const labels = {
        pending: 'Sin Evidencias',
        partial: 'Evidencias Parciales',
        complete: 'Evidencias Completas',
        approved: 'Evidencias Aprobadas'
    };
    return labels[status] || status;
};

const getEvidenceStatusSeverity = (status) => {
    const severities = {
        pending: 'danger',
        partial: 'warning',
        complete: 'info',
        approved: 'success'
    };
    return severities[status] || 'secondary';
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

onMounted(() => {
    loadEvidence();
});
</script>

<style scoped>
.evidence-categories > div:not(:last-child) {
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 1.5rem;
}
</style>