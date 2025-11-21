<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Nuevo Activo" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Eliminar" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedAssets || !selectedAssets.length" />
                </template>

                <template #end>
                    <Button label="Exportar" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedAssets"
                :value="assets"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} activos"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Gestión de Activos</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Nombre" sortable style="min-width: 16rem"></Column>
                <Column field="type" header="Tipo" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.type" :severity="getTypeSeverity(slotProps.data.type)" />
                    </template>
                </Column>
                <Column field="size" header="Tamaño" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ formatFileSize(slotProps.data.size) }}
                    </template>
                </Column>
                <Column field="uploadedBy" header="Subido por" sortable style="min-width: 12rem"></Column>
                <Column field="uploadedAt" header="Fecha" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.uploadedAt) }}
                    </template>
                </Column>
                <Column field="status" header="Estado" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-download" severity="info" text rounded @click="downloadAsset(slotProps.data)" class="mr-2" />
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="editAsset(slotProps.data)" class="mr-2" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteAsset(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Asset Dialog -->
        <Dialog v-model:visible="assetDialog" :style="{ width: '600px' }" header="Detalles del Activo" :modal="true">
            <div class="flex flex-col gap-6">
                <div class="field">
                    <label for="name" class="font-bold">Nombre *</label>
                    <InputText id="name" v-model.trim="asset.name" required autofocus :invalid="submitted && !asset.name" fluid />
                    <small v-if="submitted && !asset.name" class="text-red-500">El nombre es requerido.</small>
                </div>

                <div class="field">
                    <label for="description" class="font-bold">Descripción</label>
                    <Textarea id="description" v-model="asset.description" rows="3" cols="20" fluid />
                </div>

                <div class="field">
                    <label for="type" class="font-bold">Tipo *</label>
                    <Dropdown id="type" v-model="asset.type" :options="assetTypes" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" required :invalid="submitted && !asset.type" fluid />
                    <small v-if="submitted && !asset.type" class="text-red-500">El tipo es requerido.</small>
                </div>

                <div class="field">
                    <label for="file" class="font-bold">Archivo</label>
                    <FileUpload
                        mode="basic"
                        name="file"
                        :url="uploadUrl"
                        accept="*/*"
                        :maxFileSize="10000000"
                        chooseLabel="Seleccionar Archivo"
                        @upload="onUpload"
                        @error="onUploadError"
                        auto
                    />
                </div>

                <div class="field">
                    <label for="status" class="font-bold">Estado</label>
                    <Dropdown id="status" v-model="asset.status" :options="statuses" optionLabel="label" optionValue="value" placeholder="Seleccionar estado" fluid />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" @click="saveAsset" />
            </template>
        </Dialog>

        <!-- Delete Asset Dialog -->
        <Dialog v-model:visible="deleteAssetDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="asset">¿Está seguro de que desea eliminar <b>{{ asset.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteAssetDialog = false" />
                <Button label="Sí" icon="pi pi-check" @click="deleteAsset" />
            </template>
        </Dialog>

        <!-- Delete Multiple Assets Dialog -->
        <Dialog v-model:visible="deleteAssetsDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="selectedAssets">¿Está seguro de que desea eliminar los activos seleccionados?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteAssetsDialog = false" />
                <Button label="Sí" icon="pi pi-check" @click="deleteSelectedAssets" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
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
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import FileUpload from 'primevue/fileupload';

const toast = useToast();
const dt = ref();
const assets = ref([]);
const assetDialog = ref(false);
const deleteAssetDialog = ref(false);
const deleteAssetsDialog = ref(false);
const asset = ref({});
const selectedAssets = ref();
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);

const uploadUrl = import.meta.env.VITE_API_URL + '/assets/upload';

const assetTypes = ref([
    { label: 'Imagen', value: 'image' },
    { label: 'Documento', value: 'document' },
    { label: 'Video', value: 'video' },
    { label: 'Audio', value: 'audio' },
    { label: 'Archivo', value: 'file' }
]);

const statuses = ref([
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
    { label: 'Archivado', value: 'archived' }
]);

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTypeSeverity(type) {
    switch (type) {
        case 'image': return 'info';
        case 'document': return 'secondary';
        case 'video': return 'warn';
        case 'audio': return 'success';
        default: return 'primary';
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'active': return 'success';
        case 'inactive': return 'warn';
        case 'archived': return 'secondary';
        default: return 'info';
    }
}

function openNew() {
    asset.value = { status: 'active' };
    submitted.value = false;
    assetDialog.value = true;
}

function hideDialog() {
    assetDialog.value = false;
    submitted.value = false;
}

function saveAsset() {
    submitted.value = true;

    if (asset.value.name?.trim() && asset.value.type) {
        if (asset.value.id) {
            // Update existing asset
            const index = findIndexById(asset.value.id);
            assets.value[index] = { ...asset.value, updatedAt: new Date() };
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Activo actualizado exitosamente', life: 3000 });
        } else {
            // Create new asset
            asset.value.id = createId();
            asset.value.uploadedAt = new Date();
            asset.value.uploadedBy = 'Usuario Admin';
            asset.value.size = Math.floor(Math.random() * 5000000); // Mock size
            assets.value.push({ ...asset.value });
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Activo creado exitosamente', life: 3000 });
        }

        assetDialog.value = false;
        asset.value = {};
    }
}

function editAsset(assetData) {
    asset.value = { ...assetData };
    assetDialog.value = true;
}

function confirmDeleteAsset(assetData) {
    asset.value = assetData;
    deleteAssetDialog.value = true;
}

function deleteAsset() {
    assets.value = assets.value.filter(val => val.id !== asset.value.id);
    deleteAssetDialog.value = false;
    asset.value = {};
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Activo eliminado exitosamente', life: 3000 });
}

function confirmDeleteSelected() {
    deleteAssetsDialog.value = true;
}

function deleteSelectedAssets() {
    assets.value = assets.value.filter(val => !selectedAssets.value.includes(val));
    deleteAssetsDialog.value = false;
    selectedAssets.value = null;
    toast.add({ severity: 'success', summary: 'Eliminados', detail: 'Activos eliminados exitosamente', life: 3000 });
}

function downloadAsset(assetData) {
    // Mock download functionality
    toast.add({ severity: 'info', summary: 'Descarga', detail: `Descargando ${assetData.name}...`, life: 3000 });
}

function exportCSV() {
    dt.value.exportCSV();
}

function findIndexById(id) {
    return assets.value.findIndex(asset => asset.id === id);
}

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function onUpload(event) {
    const file = event.files[0];
    asset.value.name = file.name;
    asset.value.size = file.size;
    toast.add({ severity: 'success', summary: 'Archivo subido', detail: 'Archivo cargado exitosamente', life: 3000 });
}

function onUploadError(event) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al subir archivo', life: 3000 });
}

// Load mock data
const loadMockData = () => {
    const mockAssets = [
        {
            id: 'AST001',
            name: 'Manual de Usuario.pdf',
            type: 'document',
            size: 2048000,
            uploadedBy: 'Admin Sistema',
            uploadedAt: new Date('2024-01-15T10:30:00Z'),
            status: 'active',
            description: 'Manual de usuario del sistema'
        },
        {
            id: 'AST002',
            name: 'Logo Empresa.png',
            type: 'image',
            size: 512000,
            uploadedBy: 'Admin Sistema',
            uploadedAt: new Date('2024-01-14T14:20:00Z'),
            status: 'active',
            description: 'Logo oficial de la empresa'
        },
        {
            id: 'AST003',
            name: 'Video Tutorial.mp4',
            type: 'video',
            size: 15728640,
            uploadedBy: 'Admin Sistema',
            uploadedAt: new Date('2024-01-13T09:15:00Z'),
            status: 'active',
            description: 'Tutorial de uso del sistema'
        }
    ];
    assets.value = mockAssets;
};

onMounted(() => {
    loadMockData();
});
</script>

<style scoped>
</style>