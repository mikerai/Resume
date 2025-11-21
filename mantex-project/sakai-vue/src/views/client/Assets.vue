<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Assets Stats -->
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
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Valor Total</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">$250,000</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-purple-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assets Table -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Mis Activos</div>
                    <Button icon="pi pi-plus" label="Registrar Activo" @click="showCreateDialog = true" />
                </div>
                <DataTable :value="assets" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column field="id" header="ID" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.id }}</span>
                        </template>
                    </Column>
                    <Column field="name" header="Nombre" sortable>
                        <template #body="slotProps">
                            <div>
                                <div class="font-medium">{{ slotProps.data.name }}</div>
                                <div class="text-sm text-muted-color">{{ slotProps.data.description }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="category" header="Categoría" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.category" severity="info" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="location" header="Ubicación" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ slotProps.data.location }}</div>
                        </template>
                    </Column>
                    <Column field="last_maintenance" header="Último Mantenimiento" sortable>
                        <template #body="slotProps">
                            <div class="text-sm">{{ formatDate(slotProps.data.last_maintenance) }}</div>
                        </template>
                    </Column>
                    <Column header="Acciones" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <Button icon="pi pi-eye" severity="info" text rounded @click="viewAsset(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- Create Asset Dialog -->
    <Dialog v-model:visible="showCreateDialog" modal :style="{ width: '600px' }" header="Registrar Nuevo Activo">
        <div class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label for="name">Nombre del Activo *</label>
                    <InputText id="name" v-model="newAsset.name" class="w-full" placeholder="Ej: Aire Acondicionado Oficina 1" />
                </div>
                <div class="field">
                    <label for="description">Descripción</label>
                    <Textarea id="description" v-model="newAsset.description" rows="3" class="w-full" placeholder="Descripción detallada del activo..." />
                </div>
                <div class="field">
                    <label for="category">Categoría *</label>
                    <Dropdown id="category" v-model="newAsset.category" :options="categoryOptions" option-label="label" option-value="value" placeholder="Selecciona categoría" class="w-full" />
                </div>
                <div class="field">
                    <label for="location">Ubicación *</label>
                    <InputText id="location" v-model="newAsset.location" class="w-full" placeholder="Ej: Edificio A, Piso 3, Oficina 301" />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeCreateDialog" />
            <Button label="Registrar Activo" icon="pi pi-check" @click="createAsset" :loading="creating" />
        </template>
    </Dialog>

    <!-- Asset Details Dialog -->
    <Dialog v-model:visible="showDetailsDialog" modal :style="{ width: '600px' }" header="Detalles del Activo">
        <div v-if="selectedAsset" class="grid">
            <div class="col-span-12">
                <div class="field">
                    <label>ID:</label>
                    <p class="font-medium">{{ selectedAsset.id }}</p>
                </div>
                <div class="field">
                    <label>Nombre:</label>
                    <p class="font-medium">{{ selectedAsset.name }}</p>
                </div>
                <div class="field">
                    <label>Descripción:</label>
                    <p>{{ selectedAsset.description }}</p>
                </div>
                <div class="field">
                    <label>Estado:</label>
                    <Tag :value="getStatusLabel(selectedAsset.status)" :severity="getStatusSeverity(selectedAsset.status)" class="mt-1" />
                </div>
                <div class="field">
                    <label>Ubicación:</label>
                    <p>{{ selectedAsset.location }}</p>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" text @click="showDetailsDialog = false" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { formatDate } from '@/lib/constants.js';

const toast = useToast();

// Reactive data
const assets = ref([]);
const creating = ref(false);
const showCreateDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedAsset = ref(null);

// Form data for new asset
const newAsset = ref({
    name: '',
    description: '',
    category: '',
    location: ''
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

// Computed
const inMaintenanceCount = computed(() => {
    return assets.value.filter(asset => asset.status === 'maintenance').length;
});

const operationalCount = computed(() => {
    return assets.value.filter(asset => asset.status === 'operational').length;
});

// Methods
const loadAssets = async () => {
    try {
        // Mock data for demonstration
        const mockAssets = [
            {
                id: 'AC-001',
                name: 'Aire Acondicionado Central',
                description: 'Sistema HVAC principal del edificio',
                category: 'hvac',
                status: 'operational',
                location: 'Edificio Principal, Azotea',
                last_maintenance: '2024-10-15T10:00:00Z'
            },
            {
                id: 'ELV-001',
                name: 'Elevador Principal',
                description: 'Elevador de pasajeros, capacidad 8 personas',
                category: 'electrical',
                status: 'maintenance',
                location: 'Torre Norte',
                last_maintenance: '2024-11-01T09:00:00Z'
            },
            {
                id: 'SEC-001',
                name: 'Sistema de Cámaras',
                description: 'Red de videovigilancia completa',
                category: 'security',
                status: 'operational',
                location: 'Todo el complejo',
                last_maintenance: '2024-09-20T14:00:00Z'
            }
        ];
        assets.value = mockAssets;
    } catch (error) {
        console.error('Error loading assets:', error);
    }
};

const createAsset = async () => {
    if (!validateForm()) return;

    creating.value = true;
    try {
        // Mock creation
        const newAssetData = {
            id: `AST-${(assets.value.length + 1).toString().padStart(3, '0')}`,
            ...newAsset.value,
            status: 'operational',
            last_maintenance: new Date().toISOString()
        };

        assets.value.unshift(newAssetData);

        toast.add({
            severity: 'success',
            summary: 'Activo Registrado',
            detail: 'El activo se registró exitosamente',
            life: 3000
        });

        closeCreateDialog();
    } catch (error) {
        console.error('Error creating asset:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al registrar el activo',
            life: 3000
        });
    } finally {
        creating.value = false;
    }
};

const validateForm = () => {
    const required = ['name', 'category', 'location'];

    for (const field of required) {
        if (!newAsset.value[field] || newAsset.value[field].trim() === '') {
            toast.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: `El campo es obligatorio`,
                life: 3000
            });
            return false;
        }
    }
    return true;
};

const closeCreateDialog = () => {
    showCreateDialog.value = false;
    newAsset.value = {
        name: '',
        description: '',
        category: '',
        location: ''
    };
};

const viewAsset = (asset) => {
    selectedAsset.value = asset;
    showDetailsDialog.value = true;
};

// Utility functions
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

onMounted(() => {
    loadAssets();
});
</script>

<style scoped>
.field {
    margin-bottom: 1rem;
}

.field label {
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    color: var(--text-color-secondary);
}
</style>