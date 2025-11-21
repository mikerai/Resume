<template>
    <div class="dispute-mediation-panel">
        <!-- Resumen de la disputa -->
        <div class="card mb-4">
            <div class="flex align-items-center gap-3 mb-4">
                <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
                <div>
                    <h5 class="m-0">Disputa en Evidencia</h5>
                    <p class="m-0 text-500">{{ evidence.file_name }}</p>
                </div>
            </div>

            <div class="grid">
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Ticket:</label>
                        <div class="font-medium">{{ evidence.ticket?.ticket_number }}</div>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Proveedor:</label>
                        <div class="font-medium">{{ evidence.ticket?.supplier?.company_name }}</div>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Cliente:</label>
                        <div class="font-medium">{{ evidence.ticket?.client?.company_name }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vista previa de la evidencia en disputa -->
        <div class="grid mb-4">
            <div class="col-12 md:col-6">
                <div class="card">
                    <h6>🖼️ Evidencia en Disputa</h6>
                    <div v-if="evidence.file_type === 'image'" class="text-center">
                        <img
                            :src="evidence.url"
                            :alt="evidence.file_name"
                            class="w-full max-w-15rem h-auto border-round"
                        />
                    </div>
                    <div v-else class="text-center p-4">
                        <i :class="getFileIcon(evidence.file_name)" class="text-4xl mb-2"></i>
                        <div class="font-medium">{{ evidence.file_name }}</div>
                    </div>
                </div>
            </div>

            <div class="col-12 md:col-6">
                <div class="card">
                    <h6>📋 Detalles de la Disputa</h6>
                    <div class="field">
                        <label>Tipo de Evidencia:</label>
                        <Tag :value="getEvidenceTypeLabel(evidence.evidence_type)" />
                    </div>
                    <div class="field">
                        <label>Fecha de Rechazo:</label>
                        <div>{{ formatDateTime(evidence.reviewed_at) }}</div>
                    </div>
                    <div class="field">
                        <label>Tiempo en Disputa:</label>
                        <div class="font-medium text-red-600">{{ getDisputeDuration() }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Comentarios de las partes -->
        <div class="card mb-4">
            <h6>💬 Posiciones de las Partes</h6>
            <div class="grid">
                <!-- Comentarios del proveedor -->
                <div class="col-12 md:col-6">
                    <div class="p-3 border-1 border-blue-200 border-round bg-blue-50">
                        <div class="flex align-items-center gap-2 mb-2">
                            <i class="pi pi-user text-blue-600"></i>
                            <strong class="text-blue-700">Proveedor</strong>
                        </div>
                        <div class="text-sm mb-2 text-blue-600">Descripción original:</div>
                        <p class="m-0 text-blue-800">{{ evidence.description || 'Sin descripción proporcionada' }}</p>
                    </div>
                </div>

                <!-- Comentarios del cliente -->
                <div class="col-12 md:col-6">
                    <div class="p-3 border-1 border-orange-200 border-round bg-orange-50">
                        <div class="flex align-items-center gap-2 mb-2">
                            <i class="pi pi-building text-orange-600"></i>
                            <strong class="text-orange-700">Cliente</strong>
                        </div>
                        <div class="text-sm mb-2 text-orange-600">Motivo del rechazo:</div>
                        <p class="m-0 text-orange-800">{{ evidence.client_comments }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Análisis y evaluación del administrador -->
        <div class="card mb-4">
            <h6>🔍 Análisis de la Disputa</h6>

            <!-- Criterios de evaluación -->
            <div class="grid mb-4">
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Calidad de la Evidencia:</label>
                        <Rating v-model="evaluation.qualityRating" :readonly="false" />
                        <small class="text-500">Claridad, resolución, relevancia</small>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Cumplimiento de Requisitos:</label>
                        <Rating v-model="evaluation.complianceRating" :readonly="false" />
                        <small class="text-500">Cumple con los estándares solicitados</small>
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field">
                        <label>Justificación del Rechazo:</label>
                        <Rating v-model="evaluation.rejectionJustification" :readonly="false" />
                        <small class="text-500">¿Es válida la objeción del cliente?</small>
                    </div>
                </div>
            </div>

            <!-- Notas del análisis -->
            <div class="field">
                <label for="analysis-notes">📝 Notas del Análisis:</label>
                <Textarea
                    id="analysis-notes"
                    v-model="evaluation.analysisNotes"
                    rows="4"
                    class="w-full"
                    placeholder="Análisis detallado de la disputa, factores considerados, precedentes similares..."
                />
            </div>
        </div>

        <!-- Opciones de resolución -->
        <div class="card mb-4">
            <h6>⚖️ Opciones de Resolución</h6>
            <div class="flex flex-column gap-3">
                <div class="flex align-items-start gap-3">
                    <RadioButton v-model="resolution.type" value="approve-evidence" />
                    <div>
                        <label class="font-medium text-green-700">✅ Aprobar Evidencia</label>
                        <div class="text-sm text-500">La evidencia cumple con los estándares. Anular rechazo del cliente.</div>
                    </div>
                </div>

                <div class="flex align-items-start gap-3">
                    <RadioButton v-model="resolution.type" value="uphold-rejection" />
                    <div>
                        <label class="font-medium text-red-700">❌ Mantener Rechazo</label>
                        <div class="text-sm text-500">El rechazo del cliente es válido. Solicitar nueva evidencia al proveedor.</div>
                    </div>
                </div>

                <div class="flex align-items-start gap-3">
                    <RadioButton v-model="resolution.type" value="partial-resolution" />
                    <div>
                        <label class="font-medium text-orange-700">🤝 Resolución Parcial</label>
                        <div class="text-sm text-500">Aceptar evidencia con condiciones o solicitar complemento.</div>
                    </div>
                </div>

                <div class="flex align-items-start gap-3">
                    <RadioButton v-model="resolution.type" value="escalate" />
                    <div>
                        <label class="font-medium text-purple-700">📞 Escalamiento</label>
                        <div class="text-sm text-500">Requiere mediación directa con las partes o revisión superior.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resolución detallada -->
        <div v-if="resolution.type" class="card mb-4">
            <h6>📄 Detalles de la Resolución</h6>

            <div class="field">
                <label for="resolution-summary">Resumen de la Decisión:</label>
                <InputText
                    id="resolution-summary"
                    v-model="resolution.summary"
                    class="w-full"
                    placeholder="Resumen en una línea de la decisión tomada..."
                />
            </div>

            <div class="field">
                <label for="resolution-details">Explicación Detallada:</label>
                <Textarea
                    id="resolution-details"
                    v-model="resolution.details"
                    rows="4"
                    class="w-full"
                    placeholder="Explicación completa de la decisión, criterios aplicados, acciones requeridas..."
                />
            </div>

            <!-- Acciones de seguimiento -->
            <div class="field">
                <label>Acciones de Seguimiento:</label>
                <div class="flex flex-column gap-2">
                    <div class="flex align-items-center gap-2">
                        <Checkbox v-model="resolution.actions.notifyClient" binary />
                        <label>Notificar al cliente de la resolución</label>
                    </div>
                    <div class="flex align-items-center gap-2">
                        <Checkbox v-model="resolution.actions.notifySupplier" binary />
                        <label>Notificar al proveedor de la resolución</label>
                    </div>
                    <div class="flex align-items-center gap-2">
                        <Checkbox v-model="resolution.actions.requestNewEvidence" binary />
                        <label>Solicitar nueva evidencia al proveedor</label>
                    </div>
                    <div class="flex align-items-center gap-2">
                        <Checkbox v-model="resolution.actions.scheduleFollowUp" binary />
                        <label>Programar seguimiento en 48 horas</label>
                    </div>
                    <div class="flex align-items-center gap-2">
                        <Checkbox v-model="resolution.actions.escalateToSupervisor" binary />
                        <label>Escalar a supervisor</label>
                    </div>
                </div>
            </div>

            <!-- Fecha límite para cumplimiento -->
            <div v-if="resolution.actions.requestNewEvidence" class="field">
                <label for="deadline">Fecha Límite para Nueva Evidencia:</label>
                <Calendar
                    id="deadline"
                    v-model="resolution.deadline"
                    dateFormat="dd/mm/yy"
                    :minDate="new Date()"
                    class="w-full md:w-14rem"
                    placeholder="Seleccionar fecha..."
                />
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-content-between">
            <div class="flex gap-2">
                <Button
                    label="Ver Historial Completo"
                    icon="pi pi-history"
                    class="p-button-outlined"
                    @click="viewFullHistory"
                />
                <Button
                    label="Consultar Precedentes"
                    icon="pi pi-book"
                    class="p-button-outlined"
                    @click="consultPrecedents"
                />
            </div>

            <div class="flex gap-2">
                <Button
                    label="Guardar Borrador"
                    icon="pi pi-save"
                    class="p-button-secondary"
                    @click="saveDraft"
                />
                <Button
                    label="Aplicar Resolución"
                    icon="pi pi-check"
                    class="p-button-success"
                    @click="applyResolution"
                    :disabled="!isResolutionComplete"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    evidence: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['resolution-saved']);

const supabase = useSupabaseClient();
const toast = useToast();

// Estados reactivos
const evaluation = ref({
    qualityRating: 3,
    complianceRating: 3,
    rejectionJustification: 3,
    analysisNotes: ''
});

const resolution = ref({
    type: '',
    summary: '',
    details: '',
    deadline: null,
    actions: {
        notifyClient: true,
        notifySupplier: true,
        requestNewEvidence: false,
        scheduleFollowUp: false,
        escalateToSupervisor: false
    }
});

// Computadas
const isResolutionComplete = computed(() => {
    return resolution.value.type &&
           resolution.value.summary &&
           resolution.value.details;
});

// Métodos
const getDisputeDuration = () => {
    const reviewDate = new Date(props.evidence.reviewed_at);
    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 día';
    if (diffDays < 7) return `${diffDays} días`;

    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return '1 semana';
    return `${weeks} semanas`;
};

const applyResolution = async () => {
    try {
        // Crear registro de mediación
        const mediationRecord = {
            evidence_id: props.evidence.id,
            ticket_id: props.evidence.ticket_id,
            resolution_type: resolution.value.type,
            summary: resolution.value.summary,
            details: resolution.value.details,
            evaluation: evaluation.value,
            actions: resolution.value.actions,
            deadline: resolution.value.deadline,
            mediated_by: supabase.auth.user()?.id,
            mediated_at: new Date().toISOString()
        };

        // Guardar mediación
        const { error: mediationError } = await supabase
            .from('dispute_mediations')
            .insert([mediationRecord]);

        if (mediationError) throw mediationError;

        // Actualizar estado de la evidencia según la resolución
        let newStatus = props.evidence.approval_status;
        if (resolution.value.type === 'approve-evidence') {
            newStatus = 'approved';
        } else if (resolution.value.type === 'uphold-rejection') {
            newStatus = 'rejected';
        }

        const { error: updateError } = await supabase
            .from('ticket_evidence')
            .update({
                approval_status: newStatus,
                admin_resolution: resolution.value.type,
                admin_notes: `RESOLUCIÓN: ${resolution.value.summary}\n\n${evaluation.value.analysisNotes}`,
                resolved_at: new Date().toISOString(),
                resolved_by: supabase.auth.user()?.id
            })
            .eq('id', props.evidence.id);

        if (updateError) throw updateError;

        // Crear notificaciones si es necesario
        await createNotifications();

        emit('resolution-saved');

        toast.add({
            severity: 'success',
            summary: 'Resolución Aplicada',
            detail: 'La disputa ha sido resuelta exitosamente',
            life: 4000
        });

    } catch (error) {
        console.error('Error applying resolution:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo aplicar la resolución',
            life: 4000
        });
    }
};

const createNotifications = async () => {
    const notifications = [];

    if (resolution.value.actions.notifyClient) {
        notifications.push({
            recipient_id: props.evidence.ticket.client?.user_id,
            type: 'dispute_resolved',
            title: 'Disputa Resuelta',
            message: `La disputa sobre la evidencia ${props.evidence.file_name} ha sido resuelta: ${resolution.value.summary}`,
            ticket_id: props.evidence.ticket_id
        });
    }

    if (resolution.value.actions.notifySupplier) {
        notifications.push({
            recipient_id: props.evidence.ticket.supplier?.user_id,
            type: 'dispute_resolved',
            title: 'Disputa Resuelta',
            message: `La disputa sobre la evidencia ${props.evidence.file_name} ha sido resuelta: ${resolution.value.summary}`,
            ticket_id: props.evidence.ticket_id
        });
    }

    if (notifications.length > 0) {
        const { error } = await supabase
            .from('notifications')
            .insert(notifications);

        if (error) {
            console.error('Error creating notifications:', error);
        }
    }
};

const saveDraft = () => {
    // Guardar en localStorage como borrador
    const draft = {
        evidence_id: props.evidence.id,
        evaluation: evaluation.value,
        resolution: resolution.value,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(`mediation_draft_${props.evidence.id}`, JSON.stringify(draft));

    toast.add({
        severity: 'info',
        summary: 'Borrador Guardado',
        detail: 'La resolución se ha guardado como borrador',
        life: 3000
    });
};

const viewFullHistory = () => {
    window.open(`/admin/evidence/${props.evidence.id}/history`, '_blank');
};

const consultPrecedents = () => {
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'La consulta de precedentes estará disponible pronto',
        life: 3000
    });
};

// Utilidades
const getEvidenceTypeLabel = (type) => {
    const labels = {
        before: 'Estado Inicial',
        progress: 'Proceso',
        after: 'Resultado Final',
        document: 'Documento'
    };
    return labels[type] || type;
};

const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const icons = {
        pdf: 'pi pi-file-pdf text-red-500',
        doc: 'pi pi-file-word text-blue-500',
        docx: 'pi pi-file-word text-blue-500'
    };
    return icons[extension] || 'pi pi-file text-gray-500';
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

// Cargar borrador si existe
const loadDraft = () => {
    const draft = localStorage.getItem(`mediation_draft_${props.evidence.id}`);
    if (draft) {
        const parsed = JSON.parse(draft);
        evaluation.value = parsed.evaluation;
        resolution.value = parsed.resolution;
    }
};

// Cargar borrador al montar
loadDraft();
</script>

<style scoped>
.max-w-15rem {
    max-width: 15rem;
}
</style>