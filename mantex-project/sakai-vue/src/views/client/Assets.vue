<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';
import { formatDate } from '@/lib/constants.js';

import OverlayPanel from 'primevue/overlaypanel';
import Galleria from 'primevue/galleria';

const toast = useToast();
const { user } = useAuth();
const { uploadFileToS3, getSignedUrl, isUploading } = useS3Upload();

// State
const assets = ref([]);
const branches = ref([]);
const client = ref(null);
const loading = ref(true);
const creating = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedAsset = ref(null);
const clientId = ref(null);

// Form Data
const assetForm = ref({
    name: '',
    description: '',
    category: '',
    status: 'operational',
    location_type: '',
    branch_id: null,
    photos: [],
    documents: []
});

// Options
const categoryOptions = [
    { label: 'HVAC', value: 'hvac' },
    { label: 'Eléctrico', value: 'electrical' },
    { label: 'Plomería', value: 'plumbing' },
    { label: 'Seguridad', value: 'security' },
    { label: 'Tecnología', value: 'technology' },
    { label: 'Mobiliario', value: 'furniture' },
    { label: 'Vehículos', value: 'vehicles' },
    { label: 'Otros', value: 'others' }
];

const statusOptions = [
    { label: 'Operativo', value: 'operational' },
    { label: 'En Mantenimiento', value: 'maintenance' },
    { label: 'Fuera de Servicio', value: 'out_of_order' },
    { label: 'Retirado', value: 'retired' }
];

// Computed
const locationOptions = computed(() => {
    const options = [];
    
    // Add HQ if exists
    if (client.value && client.value.hq_street) {
        options.push({
            label: 'Oficina Central',
            value: 'HEADQUARTERS',
            type: 'HEADQUARTERS',
            id: null
        });
    }
    
    // Add Branches
    branches.value.forEach(branch => {
        options.push({
            label: branch.name,
            value: branch.id, // We'll handle this mapping in save
            type: 'BRANCH',
            id: branch.id
        });
    });
    
    return options;
});

const hasLocations = computed(() => {
    return (client.value && client.value.hq_street) || branches.value.length > 0;
});

const inMaintenanceCount = computed(() => assets.value.filter(a => a.status === 'maintenance').length);
const operationalCount = computed(() => assets.value.filter(a => a.status === 'operational').length);

// Methods
const loadData = async () => {
    loading.value = true;
    try {
        // 1. Get Client ID and HQ info
        const { data: clientData, error: clientError } = await supabase
            .from('client_profiles')
            .select('id, hq_street')
            .eq('user_id', user.value.id)
            .single();
            
        if (clientError) throw clientError;
        client.value = clientData;
        clientId.value = clientData.id;

        // 2. Get Branches
        const { data: branchData, error: branchError } = await supabase
            .from('client_branches')
            .select('id, name')
            .eq('client_id', clientId.value);
            
        if (branchError) throw branchError;
        branches.value = branchData || [];

        // 3. Get Assets
        await loadAssets();

    } catch (error) {
        console.error('Error loading data:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const loadAssets = async () => {
    const { data, error } = await supabase
        .from('client_assets')
        .select(`
            *,
            branch:client_branches(name)
        `)
        .eq('client_id', clientId.value)
        .order('created_at', { ascending: false });

    if (error) throw error;
    assets.value = data || [];
};

const openCreateDialog = () => {
    selectedAsset.value = null;
    assetForm.value = {
        name: '',
        description: '',
        category: '',
        status: 'operational',
        location_type: '',
        branch_id: null,
        photos: [],
        documents: []
    };
    showCreateDialog.value = true;
};

const editAsset = (asset) => {
    selectedAsset.value = asset;
    
    // Determine location value for dropdown
    let locationVal = '';
    if (asset.location_type === 'HEADQUARTERS') {
        locationVal = 'HEADQUARTERS';
    } else {
        locationVal = asset.branch_id;
    }

    assetForm.value = {
        name: asset.name,
        description: asset.description,
        category: asset.category,
        status: asset.status,
        location_val: locationVal, // Temporary for dropdown binding
        photos: asset.photos || [],
        documents: asset.documents || []
    };
    showCreateDialog.value = true;
};

const saveAsset = async () => {
    if (!assetForm.value.name || !assetForm.value.category || !assetForm.value.location_val) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
        return;
    }

    creating.value = true;
    try {
        const username = user.value.email.split('@')[0];
        
        // Handle File Uploads
        const photoKeys = [...(Array.isArray(assetForm.value.photos) ? assetForm.value.photos.filter(p => typeof p === 'string') : [])];
        const docKeys = [...(Array.isArray(assetForm.value.documents) ? assetForm.value.documents.filter(d => typeof d === 'string') : [])];

        // Upload new photos
        if (Array.isArray(assetForm.value.photos)) {
             const newPhotos = assetForm.value.photos.filter(p => p instanceof File);
             for (const file of newPhotos) {
                const res = await uploadFileToS3(file, username, 'infrastructure/assets');
                photoKeys.push(res.s3_key);
             }
        }

        // Upload new docs
        if (Array.isArray(assetForm.value.documents)) {
             const newDocs = assetForm.value.documents.filter(d => d instanceof File);
             for (const file of newDocs) {
                const res = await uploadFileToS3(file, username, 'infrastructure/assets');
                docKeys.push(res.s3_key);
             }
        }

        // Determine Location Type and ID
        let locType = 'BRANCH';
        let branchId = null;
        
        if (assetForm.value.location_val === 'HEADQUARTERS') {
            locType = 'HEADQUARTERS';
        } else {
            branchId = assetForm.value.location_val;
        }

        const payload = {
            client_id: clientId.value,
            name: assetForm.value.name,
            description: assetForm.value.description,
            category: assetForm.value.category,
            status: assetForm.value.status,
            location_type: locType,
            branch_id: branchId,
            photos: photoKeys,
            documents: docKeys,
            updated_at: new Date().toISOString()
        };

        let error;
        if (selectedAsset.value) {
            ({ error } = await supabase
                .from('client_assets')
                .update(payload)
                .eq('id', selectedAsset.value.id));
        } else {
            ({ error } = await supabase
                .from('client_assets')
                .insert(payload));
        }

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Activo guardado correctamente', life: 3000 });
        await loadAssets();
        showCreateDialog.value = false;
    } catch (error) {
        console.error('Error saving asset:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el activo', life: 3000 });
    } finally {
        creating.value = false;
    }
};

const deleteAsset = async (asset) => {
    if (!confirm(`¿Eliminar el activo ${asset.name}?`)) return;
    
    try {
        const { error } = await supabase
            .from('client_assets')
            .delete()
            .eq('id', asset.id);
            
        if (error) throw error;
        
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Activo eliminado', life: 3000 });
        await loadAssets();
    } catch (error) {
        console.error('Error deleting asset:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

const getLocationLabel = (asset) => {
    if (asset.location_type === 'HEADQUARTERS') return 'Oficina Central';
    if (asset.branch) return asset.branch.name;
    return 'Desconocido';
};

const getStatusLabel = (status) => {
    const labels = {
        'operational': 'Operativo',
        'maintenance': 'En Mantenimiento',
        'out_of_order': 'Fuera de Servicio',
        'retired': 'Retirado'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        'operational': 'success',
        'maintenance': 'warn',
        'out_of_order': 'danger',
        'retired': 'secondary'
    };
    return severities[status] || 'info';
};

const viewAsset = (asset) => {
    selectedAsset.value = asset;
    showDetailsDialog.value = true;
};

// Gallery Logic
const op = ref(null);
const galleryImages = ref([]);
const loadingGallery = ref(false);
const galleriaResponsiveOptions = ref([
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
]);

const toggleGallery = async (event, asset) => {
    op.value.toggle(event);
    
    if (!asset.photos || asset.photos.length === 0) {
        galleryImages.value = [];
        return;
    }

    loadingGallery.value = true;
    galleryImages.value = []; // Clear previous

    try {
        const urls = await Promise.all(
            asset.photos.map(async (key) => {
                const url = await getSignedUrl(key);
                return {
                    itemImageSrc: url,
                    thumbnailImageSrc: url,
                    alt: asset.name
                };
            })
        );
        galleryImages.value = urls;
    } catch (error) {
        console.error('Error loading gallery images:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las imágenes', life: 3000 });
    } finally {
        loadingGallery.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Stats -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Activos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ assets.length }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-box text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">En Mantenimiento</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ inMaintenanceCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-wrench text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Operativos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ operationalCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check-circle text-green-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Table -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Mis Activos</div>
                    <Button 
                        v-if="hasLocations"
                        icon="pi pi-plus" 
                        label="Registrar Activo" 
                        @click="openCreateDialog" 
                    />
                </div>

                <div v-if="!hasLocations && !loading" class="text-center p-5 border-round surface-100">
                    <i class="pi pi-building text-4xl mb-3 text-500 block"></i>
                    <h3 class="text-xl font-medium text-900 mb-2">Registra tu Empresa</h3>
                    <p class="text-600 mb-4">Para registrar activos, primero debes configurar tu Oficina Central o Sucursales.</p>
                    <Button label="Ir a Mi Empresa" icon="pi pi-arrow-right" @click="$router.push('/client/account')" />
                </div>

                <DataTable v-else :value="assets" :loading="loading" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column field="name" header="Nombre" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.name }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.category }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column header="Ubicación" sortable>
                        <template #body="slotProps">
                            <Tag :value="getLocationLabel(slotProps.data)" severity="secondary" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column header="Archivos">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button 
                                    v-if="slotProps.data.photos?.length" 
                                    icon="pi pi-images" 
                                    text 
                                    rounded 
                                    severity="primary" 
                                    v-tooltip="'Ver Fotos'"
                                    @click="toggleGallery($event, slotProps.data)"
                                />
                                <i v-if="slotProps.data.documents?.length" class="pi pi-file text-primary p-2" v-tooltip="'Tiene documentos'"></i>
                            </div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" severity="info" text rounded @click="editAsset(slotProps.data)" />
                                <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteAsset(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="text-center p-4 text-500">
                            No hay activos registrados
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showCreateDialog" modal :style="{ width: '600px' }" :header="selectedAsset ? 'Editar Activo' : 'Registrar Nuevo Activo'">
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="field mb-4">
                    <label for="name" class="font-medium block mb-2">Nombre del Activo *</label>
                    <InputText id="name" v-model="assetForm.name" class="w-full" placeholder="Ej: Aire Acondicionado Oficina 1" />
                </div>
                
                <div class="field mb-4">
                    <label for="category" class="font-medium block mb-2">Categoría *</label>
                    <Dropdown id="category" v-model="assetForm.category" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="Selecciona categoría" class="w-full" />
                </div>

                <div class="field mb-4">
                    <label for="location" class="font-medium block mb-2">Ubicación *</label>
                    <Dropdown 
                        id="location" 
                        v-model="assetForm.location_val" 
                        :options="locationOptions" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Selecciona ubicación" 
                        class="w-full" 
                    />
                </div>

                <div class="field mb-4">
                    <label for="status" class="font-medium block mb-2">Estado</label>
                    <Dropdown id="status" v-model="assetForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="field mb-4">
                    <label for="description" class="font-medium block mb-2">Descripción</label>
                    <Textarea id="description" v-model="assetForm.description" rows="3" class="w-full" placeholder="Descripción detallada..." />
                </div>

                <div class="field mb-4">
                    <label class="font-medium block mb-2">Fotos (Opcional)</label>
                    <FileUpload 
                        mode="basic" 
                        name="photos[]" 
                        accept="image/*" 
                        :multiple="true" 
                        :maxFileSize="5000000" 
                        @select="assetForm.photos = $event.files"
                        chooseLabel="Seleccionar Fotos"
                    />
                    <div v-if="selectedAsset && selectedAsset.photos?.length" class="mt-2 text-sm text-500">
                        {{ selectedAsset.photos.length }} fotos existentes
                    </div>
                </div>

                <div class="field mb-4">
                    <label class="font-medium block mb-2">Documentos / Manuales (Opcional)</label>
                    <FileUpload 
                        mode="basic" 
                        name="docs[]" 
                        accept=".pdf,.doc,.docx" 
                        :multiple="true" 
                        :maxFileSize="10000000" 
                        @select="assetForm.documents = $event.files"
                        chooseLabel="Seleccionar Documentos"
                    />
                    <div v-if="selectedAsset && selectedAsset.documents?.length" class="mt-2 text-sm text-500">
                        {{ selectedAsset.documents.length }} documentos existentes
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" severity="danger" text @click="showCreateDialog = false" />
            <Button label="Guardar" icon="pi pi-check" @click="saveAsset" :loading="creating || isUploading" />
        </template>
    </Dialog>

    <!-- Gallery Overlay -->
    <OverlayPanel ref="op" appendTo="body" :showCloseIcon="true" style="width: 450px">
        <div v-if="loadingGallery" class="flex justify-center items-center p-4">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <div v-else-if="galleryImages.length > 0">
            <Galleria 
                :value="galleryImages" 
                :responsiveOptions="galleriaResponsiveOptions" 
                :numVisible="5" 
                containerStyle="max-width: 100%"
                :circular="true"
                :showItemNavigators="true"
                :showThumbnails="false"
                :showIndicators="true"
            >
                <template #item="slotProps">
                    <img 
                        :src="slotProps.item.itemImageSrc" 
                        :alt="slotProps.item.alt" 
                        style="width: 100%; display: block; max-height: 300px; object-fit: contain;"
                    />
                </template>
            </Galleria>
        </div>
        <div v-else class="text-center p-4">
            No hay imágenes disponibles
        </div>
    </OverlayPanel>
</template>
