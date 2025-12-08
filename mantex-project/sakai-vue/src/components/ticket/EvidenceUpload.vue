<template>
    <div class="evidence-upload">
        <div class="card">
            <div class="flex align-items-center justify-content-between mb-4">
                <h5 class="m-0">Evidencias del Trabajo</h5>
                <Tag :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" />
            </div>

            <!-- Información del ticket -->
            <div class="grid mb-4">
                <div class="col-12 md:col-6">
                    <div class="p-3 border-1 surface-border border-round">
                        <div class="text-sm text-500 mb-1">Ticket</div>
                        <div class="font-medium">{{ ticket.ticket_number }}</div>
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="p-3 border-1 surface-border border-round">
                        <div class="text-sm text-500 mb-1">Título</div>
                        <div class="font-medium">{{ ticket.title }}</div>
                    </div>
                </div>
            </div>

            <!-- Panel de Progreso de Evidencias Requeridas -->
            <div class="mb-4 p-4 border-1 surface-border border-round bg-blue-50">
                <div class="flex align-items-center justify-content-between mb-3">
                    <h6 class="m-0 text-blue-900">Evidencias Requeridas</h6>
                    <Tag :value="`${evidenceProgress}% Completo`"
                        :severity="evidenceProgress === 100 ? 'success' : 'warning'" />
                </div>

                <div class="grid">
                    <div class="col-12 md:col-6">
                        <div class="flex align-items-center gap-2 mb-2">
                            <i :class="hasBeforePhotos ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-gray-400'"
                                class="text-xl"></i>
                            <span :class="hasBeforePhotos ? 'font-semibold' : 'text-600'">Fotos del Estado
                                Inicial</span>
                            <Tag v-if="beforePhotosCount > 0" :value="`${beforePhotosCount}`" severity="info"
                                size="small" />
                        </div>
                        <small class="text-500 ml-4 block">Documenta el problema o área antes de iniciar</small>
                    </div>

                    <div class="col-12 md:col-6">
                        <div class="flex align-items-center gap-2 mb-2">
                            <i :class="hasAfterPhotos ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-gray-400'"
                                class="text-xl"></i>
                            <span :class="hasAfterPhotos ? 'font-semibold' : 'text-600'">Fotos del Resultado
                                Final</span>
                            <Tag v-if="afterPhotosCount > 0" :value="`${afterPhotosCount}`" severity="info"
                                size="small" />
                        </div>
                        <small class="text-500 ml-4 block">Muestra el trabajo completado</small>
                    </div>
                </div>

                <div class="mt-3 pt-3 border-top-1 border-blue-200">
                    <div class="text-sm text-600 mb-2">Evidencias Opcionales:</div>
                    <div class="flex flex-wrap gap-2">
                        <Tag v-if="progressPhotosCount > 0" :value="`Proceso: ${progressPhotosCount}`"
                            severity="secondary" size="small" />
                        <Tag v-if="documentsCount > 0" :value="`Documentos: ${documentsCount}`" severity="secondary"
                            size="small" />
                    </div>
                </div>

                <!-- Mensaje de estado -->
                <div v-if="showActionButtons" class="mt-3 pt-3 border-top-1 border-blue-200">
                    <div class="flex align-items-center gap-2 text-sm"
                        :class="hasRequiredEvidence ? 'text-green-700' : 'text-orange-700'">
                        <i :class="hasRequiredEvidence ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
                        <span class="font-semibold">{{ getActionMessage() }}</span>
                    </div>
                </div>
            </div>

            <!-- Tabs para tipos de evidencia -->
            <Tabs value="before">
                <TabList>
                    <Tab value="before">
                        <i class="pi pi-camera mr-2"></i>
                        Estado Inicial
                        <Tag value="REQUERIDO" severity="danger" size="small" class="ml-2" />
                        <Tag v-if="beforePhotosCount > 0" :value="`${beforePhotosCount}`" severity="info" size="small"
                            class="ml-2" />
                    </Tab>
                    <Tab value="after">
                        <i class="pi pi-check-circle mr-2"></i>
                        Resultado Final
                        <Tag value="REQUERIDO" severity="danger" size="small" class="ml-2" />
                        <Tag v-if="afterPhotosCount > 0" :value="`${afterPhotosCount}`" severity="info" size="small"
                            class="ml-2" />
                    </Tab>
                    <Tab value="progress">
                        <i class="pi pi-images mr-2"></i>
                        Proceso
                        <Tag v-if="progressPhotosCount > 0" :value="`${progressPhotosCount}`" severity="info"
                            size="small" class="ml-2" />
                    </Tab>
                    <Tab value="documents">
                        <i class="pi pi-file-pdf mr-2"></i>
                        Documentos
                        <Tag v-if="documentsCount > 0" :value="`${documentsCount}`" severity="info" size="small"
                            class="ml-2" />
                    </Tab>
                </TabList>

                <TabPanels>
                    <TabPanel value="before">
                        <FileUpload title="Fotos del Estado Inicial" :max-files="10" :max-size-m-b="5"
                            accepted-types="image/*"
                            :upload-function="(file, onProgress) => uploadEvidence(file, 'before', onProgress)"
                            @files-uploaded="onBeforePhotosUploaded" />
                        <small class="text-500 mt-2 block">
                            Documenta el estado inicial antes de comenzar el trabajo. Incluye fotos del problema o área
                            a trabajar.
                        </small>
                    </TabPanel>

                    <TabPanel value="after">
                        <FileUpload title="Fotos del Resultado Final" :max-files="10" :max-size-m-b="5"
                            accepted-types="image/*"
                            :upload-function="(file, onProgress) => uploadEvidence(file, 'after', onProgress)"
                            @files-uploaded="onAfterPhotosUploaded" />
                        <small class="text-500 mt-2 block">
                            Documenta el resultado final del trabajo completado. Estas fotos serán revisadas por el
                            cliente.
                        </small>
                    </TabPanel>

                    <TabPanel value="progress">
                        <FileUpload title="Fotos del Proceso" :max-files="15" :max-size-m-b="5" accepted-types="image/*"
                            :upload-function="(file, onProgress) => uploadEvidence(file, 'progress', onProgress)"
                            @files-uploaded="onProgressPhotosUploaded" />
                        <small class="text-500 mt-2 block">
                            Documenta el proceso de trabajo: herramientas utilizadas, pasos del proceso, materiales,
                            etc.
                        </small>
                    </TabPanel>

                    <TabPanel value="documents">
                        <FileUpload title="Documentos" :max-files="5" :max-size-m-b="10"
                            accepted-types=".pdf,.doc,.docx"
                            :upload-function="(file, onProgress) => uploadEvidence(file, 'document', onProgress)"
                            @files-uploaded="onDocumentsUploaded" />
                        <small class="text-500 mt-2 block">
                            Reportes de trabajo, facturas, garantías, manuales, checklist completo, etc.
                        </small>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <!-- Galería de evidencias existentes -->
            <div v-if="existingEvidence.length > 0" class="mt-6">
                <h6>Evidencias Subidas</h6>
                <div class="grid">
                    <div v-for="(evidence, index) in existingEvidence" :key="evidence.id"
                        class="col-12 sm:col-6 md:col-4 lg:col-3">
                        <div class="evidence-item border-1 surface-border border-round overflow-hidden">
                            <!-- Preview para imágenes -->
                            <div v-if="evidence.file_type === 'image'"
                                class="evidence-preview h-8rem bg-cover bg-center relative cursor-pointer"
                                :style="{ backgroundImage: `url(${evidence.url})` }"
                                @click="openImagePreview(evidence)">
                                <div class="absolute top-0 right-0 p-2">
                                    <Tag :value="getEvidenceTypeLabel(evidence.evidence_type)" size="small" />
                                </div>
                            </div>

                            <!-- Preview para documentos -->
                            <div v-else
                                class="evidence-preview h-8rem flex align-items-center justify-content-center cursor-pointer hover:bg-surface-100"
                                @click="openDocument(evidence)">
                                <div class="text-center">
                                    <i class="pi pi-file-pdf text-4xl text-red-500 mb-2"></i>
                                    <div class="text-sm font-medium">{{ evidence.file_name }}</div>
                                </div>
                            </div>

                            <div class="p-3">
                                <div class="text-sm text-500 mb-1">{{ formatDate(evidence.uploaded_at) }}</div>
                                <div class="text-xs text-600">{{ formatFileSize(evidence.file_size) }}</div>

                                <!-- Botón de eliminar (solo si el ticket no está cerrado) -->
                                <Button v-if="canDeleteEvidence" icon="pi pi-trash"
                                    class="p-button-rounded p-button-text p-button-sm p-button-danger mt-2"
                                    @click="confirmDeleteEvidence(evidence)" v-tooltip="'Eliminar evidencia'" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botones de acción -->
            <div v-if="showActionButtons" class="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button label="Cerrar" icon="pi pi-times" severity="danger" outlined @click="$emit('close')" />
                <div class="flex gap-2">
                    <Button v-if="canMarkAsCompleted" label="Marcar como Completado" icon="pi pi-check"
                        severity="success" @click="markAsCompleted" :disabled="!hasRequiredEvidence" />
                    <Button v-if="canRequestApproval" label="Solicitar Aprobación" icon="pi pi-send" severity="success"
                        @click="requestApproval" :disabled="!hasRequiredEvidence" />
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de vista previa de imágenes -->
    <Dialog v-model:visible="previewVisible" modal :header="previewEvidence?.file_name" class="w-full md:w-8">
        <img v-if="previewEvidence" :src="previewEvidence.url" :alt="previewEvidence.file_name"
            class="w-full h-auto max-h-30rem object-contain" />
    </Dialog>

    <!-- Confirmación de eliminación -->
    <ConfirmDialog />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabaseClient } from '@/composables/useSupabaseClient';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import FileUpload from '@/components/common/FileUpload.vue';

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['evidence-uploaded', 'status-changed']);

const supabase = useSupabaseClient();
const toast = useToast();
const confirm = useConfirm();

// Estados reactivos
const existingEvidence = ref([]);
const loading = ref(false);
const previewVisible = ref(false);
const previewEvidence = ref(null);
const activeAccordion = ref(['before', 'after']);

// Computadas para permisos de carga según el estado del ticket
const canUploadBeforePhotos = computed(() => {
    return ['opened', 'in_progress'].includes(props.ticket.status);
});

const canUploadProgressPhotos = computed(() => {
    return ['in_progress'].includes(props.ticket.status);
});

const canUploadAfterPhotos = computed(() => {
    return ['in_progress', 'completed'].includes(props.ticket.status);
});

const canUploadDocuments = computed(() => {
    return ['in_progress', 'completed'].includes(props.ticket.status);
});

const canDeleteEvidence = computed(() => {
    return !['approved', 'paid', 'closed'].includes(props.ticket.status);
});

const canMarkAsCompleted = computed(() => {
    return props.ticket.status === 'in_progress' && hasRequiredEvidence.value;
});

const canRequestApproval = computed(() => {
    return props.ticket.status === 'completed' && hasRequiredEvidence.value;
});

const showActionButtons = computed(() => {
    return canMarkAsCompleted.value || canRequestApproval.value;
});

const hasRequiredEvidence = computed(() => {
    const beforePhotos = existingEvidence.value.filter(e => e.evidence_type === 'before');
    const afterPhotos = existingEvidence.value.filter(e => e.evidence_type === 'after');
    return beforePhotos.length > 0 && afterPhotos.length > 0;
});

const beforePhotosCount = computed(() => existingEvidence.value.filter(e => e.evidence_type === 'before').length);
const afterPhotosCount = computed(() => existingEvidence.value.filter(e => e.evidence_type === 'after').length);
const progressPhotosCount = computed(() => existingEvidence.value.filter(e => e.evidence_type === 'progress').length);
const documentsCount = computed(() => existingEvidence.value.filter(e => e.evidence_type === 'document').length);

const hasBeforePhotos = computed(() => beforePhotosCount.value > 0);
const hasAfterPhotos = computed(() => afterPhotosCount.value > 0);

const evidenceProgress = computed(() => {
    let progress = 0;
    if (hasBeforePhotos.value) progress += 50;
    if (hasAfterPhotos.value) progress += 50;
    return progress;
});

// Métodos de carga de evidencias
const uploadEvidence = async (file, evidenceType, onProgress) => {
    try {
        // Import del storage service
        const { storageService } = await import('@/lib/storageService.js');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Usuario no autenticado');

        // Obtener username del profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        if (!profile?.username) throw new Error('Username no encontrado');

        // Simular progreso inicial
        onProgress(10);

        // 1. Subir archivo a S3
        const s3Result = await storageService.uploadTicketEvidence(
            file,
            profile.username,
            props.ticket.id,
            evidenceType
        );

        if (!s3Result.success) {
            throw new Error(s3Result.error || 'Error al subir archivo a S3');
        }

        onProgress(70);

        // 2. Guardar metadatos en Supabase con URL firmada
        const evidenceRecord = {
            ticket_id: props.ticket.id,
            evidence_type: evidenceType,
            file_name: file.name,
            file_type: file.type.startsWith('image/') ? 'image' : 'document',
            file_size: file.size,
            url: s3Result.signedUrl, // URL firmada de S3
            storage_path: s3Result.key, // Key en S3
            uploaded_by: user.id
        };

        const { data, error } = await supabase
            .from('ticket_evidence')
            .insert([evidenceRecord])
            .select()
            .single();

        if (error) throw error;

        onProgress(100);

        // Actualizar la lista de evidencias existentes
        await loadExistingEvidence();

        toast.add({
            severity: 'success',
            summary: 'Evidencia subida',
            detail: `${file.name} se subió correctamente`,
            life: 3000
        });

        return data;

    } catch (error) {
        console.error('Error uploading evidence:', error);
        toast.add({
            severity: 'error',
            summary: 'Error en la carga',
            detail: error.message,
            life: 5000
        });
        throw error;
    }
};

// Cargar evidencias existentes
const loadExistingEvidence = async () => {
    try {
        loading.value = true;

        const { data, error } = await supabase
            .from('ticket_evidence')
            .select('*')
            .eq('ticket_id', props.ticket.id)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;

        existingEvidence.value = data || [];

    } catch (error) {
        console.error('Error loading evidence:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar las evidencias existentes',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Eliminar evidencia
const confirmDeleteEvidence = (evidence) => {
    confirm.require({
        message: `¿Estás seguro de eliminar "${evidence.file_name}"?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-trash',
        acceptClass: 'p-button-danger',
        accept: () => deleteEvidence(evidence)
    });
};

const deleteEvidence = async (evidence) => {
    try {
        const { storageService } = await import('@/lib/storageService.js');

        // 1. Eliminar de S3
        const deleted = await storageService.deleteFile(evidence.storage_path);

        if (!deleted) {
            throw new Error('No se pudo eliminar el archivo de S3');
        }

        // 2. Eliminar registro de la base de datos
        const { error: dbError } = await supabase
            .from('ticket_evidence')
            .delete()
            .eq('id', evidence.id);

        if (dbError) throw dbError;

        await loadExistingEvidence();

        toast.add({
            severity: 'success',
            summary: 'Evidencia eliminada',
            detail: 'La evidencia se eliminó correctamente',
            life: 3000
        });

    } catch (error) {
        console.error('Error deleting evidence:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la evidencia',
            life: 3000
        });
    }
};

// Acciones del ticket
const markAsCompleted = async () => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', props.ticket.id);

        if (error) throw error;

        emit('status-changed', 'completed');

        toast.add({
            severity: 'success',
            summary: 'Ticket completado',
            detail: 'El trabajo ha sido marcado como completado',
            life: 3000
        });

    } catch (error) {
        console.error('Error marking as completed:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo marcar como completado',
            life: 3000
        });
    }
};

const requestApproval = async () => {
    try {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'under_review' })
            .eq('id', props.ticket.id);

        if (error) throw error;

        emit('status-changed', 'under_review');

        toast.add({
            severity: 'success',
            summary: 'Aprobación solicitada',
            detail: 'Se ha enviado la solicitud de aprobación al cliente',
            life: 3000
        });

    } catch (error) {
        console.error('Error requesting approval:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo solicitar la aprobación',
            life: 3000
        });
    }
};

// Event handlers
const onBeforePhotosUploaded = (results) => {
    emit('evidence-uploaded', { type: 'before', files: results });
};

const onProgressPhotosUploaded = (results) => {
    emit('evidence-uploaded', { type: 'progress', files: results });
};

const onAfterPhotosUploaded = (results) => {
    emit('evidence-uploaded', { type: 'after', files: results });
};

const onDocumentsUploaded = (results) => {
    emit('evidence-uploaded', { type: 'document', files: results });
};

// Vista previa
const openImagePreview = (evidence) => {
    previewEvidence.value = evidence;
    previewVisible.value = true;
};

const openDocument = (evidence) => {
    window.open(evidence.url, '_blank');
};

// Utilidades
const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        opened: 'Abierto',
        in_progress: 'En Progreso',
        completed: 'Completado',
        under_review: 'En Revisión',
        approved: 'Aprobado',
        paid: 'Pagado',
        closed: 'Cerrado'
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
        paid: 'success',
        closed: 'secondary'
    };
    return severities[status] || 'secondary';
};

const getEvidenceTypeLabel = (type) => {
    const labels = {
        before: 'Inicial',
        progress: 'Proceso',
        after: 'Final',
        document: 'Documento'
    };
    return labels[type] || type;
};

const getActionMessage = () => {
    if (!hasRequiredEvidence.value) {
        return 'Se requieren fotos del estado inicial y final para continuar';
    }
    if (canMarkAsCompleted.value) {
        return 'Listo para marcar como completado';
    }
    if (canRequestApproval.value) {
        return 'Listo para solicitar aprobación del cliente';
    }
    return '';
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
    loadExistingEvidence();
});
</script>

<style scoped>
.evidence-item {
    transition: all 0.3s ease;
}

.evidence-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.evidence-preview {
    position: relative;
    overflow: hidden;
}

.absolute {
    position: absolute;
}

.top-0 {
    top: 0;
}

.right-0 {
    right: 0;
}
</style>