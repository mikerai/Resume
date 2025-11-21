<template>
    <div class="file-upload-container">
        <div class="flex align-items-center justify-content-between mb-3">
            <h6 class="m-0">{{ title }}</h6>
            <small class="text-500">{{ maxFiles > 1 ? `Máximo ${maxFiles} archivos` : 'Un archivo' }} - {{ maxSizeMB }}MB c/u</small>
        </div>

        <!-- Área de Drop Zone -->
        <div
            @drop="onDrop"
            @dragover="onDragOver"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
            @click="triggerFileInput"
            :class="[
                'drop-zone',
                'border-2 border-dashed p-4 text-center cursor-pointer transition-all duration-300',
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-300 hover:border-primary-300',
                files.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''
            ]"
        >
            <input
                ref="fileInput"
                type="file"
                :multiple="maxFiles > 1"
                :accept="acceptedTypes"
                @change="onFileSelect"
                class="hidden"
            />

            <div v-if="files.length < maxFiles">
                <i class="pi pi-cloud-upload text-4xl text-400 mb-3"></i>
                <div class="font-medium text-900 mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                </div>
                <div class="text-sm text-500">
                    Formatos: {{ acceptedTypesLabel }}
                </div>
            </div>

            <div v-else class="text-500">
                <i class="pi pi-check-circle text-2xl text-green-500 mb-2"></i>
                <div>Límite de archivos alcanzado</div>
            </div>
        </div>

        <!-- Lista de archivos -->
        <div v-if="files.length > 0" class="mt-4">
            <div class="text-sm font-medium text-900 mb-2">Archivos seleccionados:</div>
            <div class="space-y-2">
                <div
                    v-for="(file, index) in files"
                    :key="index"
                    class="flex align-items-center justify-content-between p-3 border-1 surface-border border-round"
                >
                    <div class="flex align-items-center gap-3">
                        <i :class="getFileIcon(file)" class="text-xl"></i>
                        <div>
                            <div class="font-medium text-sm">{{ file.name }}</div>
                            <div class="text-xs text-500">{{ formatFileSize(file.size) }}</div>
                        </div>
                    </div>

                    <div class="flex align-items-center gap-2">
                        <!-- Preview para imágenes -->
                        <Button
                            v-if="isImage(file)"
                            icon="pi pi-eye"
                            class="p-button-rounded p-button-text p-button-sm"
                            @click="openPreview(file)"
                            v-tooltip="'Vista previa'"
                        />

                        <!-- Progreso de carga -->
                        <div v-if="uploadProgress[index] !== undefined" class="flex align-items-center gap-2">
                            <ProgressBar :value="uploadProgress[index]" style="width: 100px" class="h-1rem" />
                            <span class="text-xs text-500">{{ uploadProgress[index] }}%</span>
                        </div>

                        <!-- Estado de carga -->
                        <Tag v-if="uploadStatus[index]" :severity="getUploadStatusSeverity(uploadStatus[index])">
                            {{ uploadStatus[index] }}
                        </Tag>

                        <!-- Eliminar archivo -->
                        <Button
                            icon="pi pi-times"
                            class="p-button-rounded p-button-text p-button-sm p-button-danger"
                            @click="removeFile(index)"
                            v-tooltip="'Eliminar'"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de acción -->
        <div v-if="files.length > 0" class="flex justify-content-end gap-2 mt-4">
            <Button
                label="Limpiar"
                icon="pi pi-refresh"
                class="p-button-outlined"
                @click="clearFiles"
            />
            <Button
                label="Subir Archivos"
                icon="pi pi-upload"
                :loading="isUploading"
                @click="uploadFiles"
                :disabled="files.length === 0"
            />
        </div>

        <!-- Modal de vista previa -->
        <Dialog
            v-model:visible="previewVisible"
            modal
            :header="previewFile?.name"
            class="w-full md:w-6"
        >
            <img
                v-if="previewUrl"
                :src="previewUrl"
                :alt="previewFile?.name"
                class="w-full h-auto max-h-30rem object-contain"
            />
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    title: {
        type: String,
        default: 'Subir Archivos'
    },
    maxFiles: {
        type: Number,
        default: 5
    },
    maxSizeMB: {
        type: Number,
        default: 10
    },
    acceptedTypes: {
        type: String,
        default: 'image/*,.pdf,.doc,.docx'
    },
    uploadFunction: {
        type: Function,
        required: true
    }
});

const emit = defineEmits(['files-uploaded', 'files-changed']);
const toast = useToast();

// Estados reactivos
const files = ref([]);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref({});
const uploadStatus = ref({});
const previewVisible = ref(false);
const previewFile = ref(null);
const previewUrl = ref(null);
const fileInput = ref(null);

// Computadas
const acceptedTypesLabel = computed(() => {
    const types = props.acceptedTypes.split(',');
    return types.map(type => {
        if (type.includes('image')) return 'Imágenes';
        if (type.includes('pdf')) return 'PDF';
        if (type.includes('doc')) return 'Word';
        return type;
    }).join(', ');
});

// Métodos de drag & drop
const onDragEnter = (e) => {
    e.preventDefault();
    isDragging.value = true;
};

const onDragOver = (e) => {
    e.preventDefault();
};

const onDragLeave = (e) => {
    e.preventDefault();
    isDragging.value = false;
};

const onDrop = (e) => {
    e.preventDefault();
    isDragging.value = false;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
};

// Selección de archivos
const triggerFileInput = () => {
    if (files.value.length < props.maxFiles) {
        fileInput.value.click();
    }
};

const onFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
};

// Manejo de archivos
const handleFiles = (newFiles) => {
    const remainingSlots = props.maxFiles - files.value.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);

    for (const file of filesToAdd) {
        if (validateFile(file)) {
            files.value.push(file);
        }
    }

    emit('files-changed', files.value);
};

const validateFile = (file) => {
    // Validar tamaño
    const maxSizeBytes = props.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        toast.add({
            severity: 'warn',
            summary: 'Archivo muy grande',
            detail: `${file.name} excede el límite de ${props.maxSizeMB}MB`,
            life: 3000
        });
        return false;
    }

    // Validar tipo de archivo
    const acceptedTypes = props.acceptedTypes.split(',');
    const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType);
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
        toast.add({
            severity: 'warn',
            summary: 'Tipo de archivo no válido',
            detail: `${file.name} no es un tipo de archivo aceptado`,
            life: 3000
        });
        return false;
    }

    return true;
};

const removeFile = (index) => {
    files.value.splice(index, 1);
    delete uploadProgress.value[index];
    delete uploadStatus.value[index];
    emit('files-changed', files.value);
};

const clearFiles = () => {
    files.value = [];
    uploadProgress.value = {};
    uploadStatus.value = {};
    emit('files-changed', files.value);
};

// Upload de archivos
const uploadFiles = async () => {
    if (files.value.length === 0) return;

    isUploading.value = true;
    const uploadPromises = [];

    for (let i = 0; i < files.value.length; i++) {
        const file = files.value[i];
        uploadProgress.value[i] = 0;
        uploadStatus.value[i] = 'uploading';

        const uploadPromise = uploadFile(file, i);
        uploadPromises.push(uploadPromise);
    }

    try {
        const results = await Promise.all(uploadPromises);
        emit('files-uploaded', results);

        toast.add({
            severity: 'success',
            summary: 'Carga exitosa',
            detail: 'Todos los archivos se han subido correctamente',
            life: 3000
        });

        // Limpiar archivos después de la carga exitosa
        clearFiles();

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error en la carga',
            detail: 'Algunos archivos no se pudieron subir',
            life: 5000
        });
    } finally {
        isUploading.value = false;
    }
};

const uploadFile = async (file, index) => {
    try {
        // Simular progreso de carga
        const progressInterval = setInterval(() => {
            if (uploadProgress.value[index] < 90) {
                uploadProgress.value[index] += Math.random() * 20;
            }
        }, 200);

        // Llamar a la función de upload proporcionada
        const result = await props.uploadFunction(file, (progress) => {
            uploadProgress.value[index] = progress;
        });

        clearInterval(progressInterval);
        uploadProgress.value[index] = 100;
        uploadStatus.value[index] = 'success';

        return result;

    } catch (error) {
        uploadStatus.value[index] = 'error';
        throw error;
    }
};

// Vista previa
const openPreview = (file) => {
    if (isImage(file)) {
        previewFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
        previewVisible.value = true;
    }
};

// Utilidades
const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return 'pi pi-image text-blue-500';
    if (file.type === 'application/pdf') return 'pi pi-file-pdf text-red-500';
    if (file.type.includes('word')) return 'pi pi-file-word text-blue-600';
    return 'pi pi-file text-500';
};

const isImage = (file) => {
    return file.type.startsWith('image/');
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getUploadStatusSeverity = (status) => {
    switch (status) {
        case 'success': return 'success';
        case 'error': return 'danger';
        case 'uploading': return 'info';
        default: return 'secondary';
    }
};

onMounted(() => {
    // Limpiar URLs de vista previa al desmontar
    return () => {
        if (previewUrl.value) {
            URL.revokeObjectURL(previewUrl.value);
        }
    };
});
</script>

<style scoped>
.drop-zone {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.hidden {
    display: none !important;
}

.space-y-2 > * + * {
    margin-top: 0.5rem;
}
</style>