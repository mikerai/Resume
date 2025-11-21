<template>
    <div class="evidence-card border-1 surface-border border-round overflow-hidden transition-all duration-300 hover:shadow-4">
        <!-- Preview -->
        <div class="evidence-preview relative cursor-pointer" @click="$emit('view', evidence)">
            <!-- Imagen -->
            <div
                v-if="evidence.file_type === 'image'"
                class="h-10rem bg-cover bg-center"
                :style="{ backgroundImage: `url(${evidence.url})` }"
            />

            <!-- Documento -->
            <div
                v-else
                class="h-10rem flex align-items-center justify-content-center bg-gray-50"
            >
                <div class="text-center">
                    <i :class="getDocumentIcon(evidence.file_name)" class="text-4xl mb-2"></i>
                    <div class="text-sm font-medium px-2">{{ truncateFileName(evidence.file_name) }}</div>
                </div>
            </div>

            <!-- Estado de aprobación overlay -->
            <div class="absolute top-0 right-0 p-2">
                <Tag
                    v-if="evidence.approval_status"
                    :value="getApprovalLabel(evidence.approval_status)"
                    :severity="getApprovalSeverity(evidence.approval_status)"
                    size="small"
                />
            </div>

            <!-- Tipo de evidencia -->
            <div class="absolute bottom-0 left-0 p-2">
                <Tag
                    :value="getEvidenceTypeLabel(evidence.evidence_type)"
                    severity="secondary"
                    size="small"
                />
            </div>
        </div>

        <!-- Información -->
        <div class="p-3">
            <div class="flex align-items-start justify-content-between mb-2">
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-900 mb-1 truncate">
                        {{ evidence.file_name }}
                    </div>
                    <div class="text-xs text-500 mb-2">
                        {{ formatFileSize(evidence.file_size) }} • {{ formatDate(evidence.uploaded_at) }}
                    </div>
                </div>
            </div>

            <!-- Comentarios del cliente -->
            <div v-if="evidence.client_comments" class="mb-3">
                <div class="text-xs text-500 mb-1">Comentario:</div>
                <div class="text-sm text-600 p-2 bg-blue-50 border-round">
                    {{ evidence.client_comments }}
                </div>
            </div>

            <!-- Descripción del proveedor -->
            <div v-if="evidence.description" class="mb-3">
                <div class="text-xs text-500 mb-1">Descripción:</div>
                <div class="text-sm text-600">
                    {{ evidence.description }}
                </div>
            </div>

            <!-- Acciones -->
            <div v-if="canApprove" class="flex gap-1 justify-content-end">
                <Button
                    icon="pi pi-eye"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="$emit('view', evidence)"
                    v-tooltip="'Ver'"
                />

                <Button
                    v-if="evidence.approval_status !== 'approved'"
                    icon="pi pi-check"
                    class="p-button-rounded p-button-success p-button-sm"
                    @click="$emit('approve', evidence)"
                    v-tooltip="'Aprobar'"
                />

                <Button
                    icon="pi pi-comment"
                    class="p-button-rounded p-button-info p-button-sm"
                    @click="$emit('comment', evidence)"
                    v-tooltip="'Comentar'"
                />

                <Button
                    v-if="evidence.approval_status !== 'rejected'"
                    icon="pi pi-times"
                    class="p-button-rounded p-button-danger p-button-sm"
                    @click="$emit('reject', evidence)"
                    v-tooltip="'Rechazar'"
                />
            </div>

            <!-- Solo vista para evidencias ya procesadas -->
            <div v-else class="flex justify-content-end">
                <Button
                    icon="pi pi-eye"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="$emit('view', evidence)"
                    v-tooltip="'Ver'"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    evidence: {
        type: Object,
        required: true
    },
    canApprove: {
        type: Boolean,
        default: false
    }
});

defineEmits(['view', 'approve', 'reject', 'comment']);

// Utilidades
const getEvidenceTypeLabel = (type) => {
    const labels = {
        before: 'Inicial',
        progress: 'Proceso',
        after: 'Final',
        document: 'Documento'
    };
    return labels[type] || type;
};

const getApprovalLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        approved: 'Aprobada',
        rejected: 'Rechazada'
    };
    return labels[status] || status;
};

const getApprovalSeverity = (status) => {
    const severities = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
    };
    return severities[status] || 'secondary';
};

const getDocumentIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const icons = {
        pdf: 'pi pi-file-pdf text-red-500',
        doc: 'pi pi-file-word text-blue-500',
        docx: 'pi pi-file-word text-blue-500',
        xls: 'pi pi-file-excel text-green-500',
        xlsx: 'pi pi-file-excel text-green-500',
        txt: 'pi pi-file text-gray-500'
    };
    return icons[extension] || 'pi pi-file text-gray-500';
};

const truncateFileName = (fileName) => {
    if (fileName.length <= 25) return fileName;
    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    return name.substring(0, 20) + '...' + extension;
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<style scoped>
.evidence-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.evidence-preview {
    flex-shrink: 0;
}

.absolute {
    position: absolute;
}

.top-0 { top: 0; }
.right-0 { right: 0; }
.bottom-0 { bottom: 0; }
.left-0 { left: 0; }

.min-w-0 {
    min-width: 0;
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>