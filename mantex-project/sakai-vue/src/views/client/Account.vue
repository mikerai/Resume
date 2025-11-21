<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Profile Information Card -->
        <div class="col-span-12 xl:col-span-4">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Mi Perfil de Cliente</div>
                <div class="flex flex-col items-center mb-6">
                    <Avatar :label="profile?.username?.charAt(0).toUpperCase()" class="mr-2" size="xlarge" shape="circle" />
                    <div class="text-center mt-3">
                        <div class="font-medium text-lg">{{ clientProfile?.company_name || 'Mi Empresa' }}</div>
                        <div class="text-muted-color">{{ profile?.username || 'client' }}</div>
                        <div class="text-sm text-muted-color">{{ user?.email }}</div>
                        <div class="text-sm text-muted-color" v-if="clientProfile?.rfc">RFC: {{ clientProfile.rfc }}</div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="field" v-if="clientProfile?.industry">
                        <label class="font-medium text-sm">Industria:</label>
                        <p class="text-muted-color">{{ clientProfile.industry }}</p>
                    </div>
                    <div class="field" v-if="clientProfile?.company_size">
                        <label class="font-medium text-sm">Tamaño de Empresa:</label>
                        <Tag :value="getSizeLabel(clientProfile.company_size)" severity="info" />
                    </div>
                    <div class="field" v-if="clientProfile?.number_of_locations">
                        <label class="font-medium text-sm">Ubicaciones:</label>
                        <p class="text-muted-color">{{ clientProfile.number_of_locations }} ubicaciones</p>
                    </div>
                    <div class="field" v-if="clientProfile?.preferred_maintenance_schedule">
                        <label class="font-medium text-sm">Mantenimiento:</label>
                        <p class="text-muted-color">{{ getScheduleLabel(clientProfile.preferred_maintenance_schedule) }}</p>
                    </div>
                </div>

                <Divider />

                <div class="space-y-2">
                    <Button label="Cambiar Contraseña" icon="pi pi-key" severity="secondary" text class="w-full justify-start" @click="showPasswordDialog = true" />
                    <Button label="Actualizar Perfil" icon="pi pi-user-edit" severity="secondary" text class="w-full justify-start" @click="editProfile" />
                    <Button label="Nueva Solicitud" icon="pi pi-plus" severity="primary" text class="w-full justify-start" @click="createRequest" />
                </div>
            </div>
        </div>

        <!-- Company Details & Locations -->
        <div class="col-span-12 xl:col-span-8">
            <!-- Company Information -->
            <div class="card mb-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Información de la Empresa</div>
                    <Button icon="pi pi-pencil" label="Editar" severity="secondary" @click="editCompanyInfo" />
                </div>

                <div class="grid grid-cols-12 gap-4" v-if="clientProfile">
                    <div class="col-span-12 md:col-span-6">
                        <div class="field">
                            <label class="font-medium text-sm">Empresa:</label>
                            <p>{{ clientProfile.company_name }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Tipo de Negocio:</label>
                            <p>{{ getBusinessTypeLabel(clientProfile.business_type) }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Contacto:</label>
                            <p>{{ clientProfile.contact_person }}</p>
                        </div>
                        <div class="field" v-if="clientProfile.position">
                            <label class="font-medium text-sm">Cargo:</label>
                            <p>{{ clientProfile.position }}</p>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="field">
                            <label class="font-medium text-sm">Teléfono:</label>
                            <p>{{ clientProfile.phone_number }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Email:</label>
                            <p>{{ clientProfile.email }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Dirección Legal:</label>
                            <p>{{ clientProfile.legal_address }}</p>
                        </div>
                        <div class="field" v-if="clientProfile.website_url">
                            <label class="font-medium text-sm">Sitio Web:</label>
                            <p>{{ clientProfile.website_url }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Locations -->
            <div class="card mb-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Ubicaciones de Servicio</div>
                    <Button icon="pi pi-plus" label="Agregar Ubicación" severity="secondary" @click="openNewLocation" />
                </div>

                <DataTable
                    :value="serviceLocations"
                    :paginator="false"
                    :loading="loadingLocations"
                    responsiveLayout="scroll"
                    emptyMessage="No hay ubicaciones registradas"
                >
                    <Column field="name" header="Nombre" sortable>
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.name }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.type }}</div>
                        </template>
                    </Column>
                    <Column field="address" header="Dirección" sortable>
                        <template #body="slotProps">
                            <div>{{ slotProps.data.address }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.city }}, {{ slotProps.data.state }}</div>
                        </template>
                    </Column>
                    <Column field="contact" header="Contacto" sortable>
                        <template #body="slotProps">
                            <div>{{ slotProps.data.contact_person || 'No especificado' }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.phone || '-' }}</div>
                        </template>
                    </Column>
                    <Column field="priority" header="Prioridad" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.priority" :severity="getPrioritySeverity(slotProps.data.priority)" />
                        </template>
                    </Column>
                    <Column :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" severity="info" text rounded @click="editLocation(slotProps.data)" v-tooltip="'Editar'" />
                                <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteLocation(slotProps.data)" v-tooltip="'Eliminar'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Preferred Suppliers -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Proveedores Preferidos</div>
                    <Button icon="pi pi-plus" label="Agregar Proveedor" severity="secondary" @click="openSupplierSelection" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 lg:col-span-4" v-for="supplier in preferredSuppliers" :key="supplier.id">
                        <div class="border rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div class="font-medium">{{ supplier.name }}</div>
                                <Button icon="pi pi-times" severity="danger" text size="small" @click="removePreferredSupplier(supplier.id)" />
                            </div>
                            <div class="text-sm text-muted-color mb-2">{{ supplier.specialties.join(', ') }}</div>
                            <div class="flex items-center gap-2">
                                <Rating :modelValue="supplier.rating" :readonly="true" :stars="5" />
                                <span class="text-sm">({{ supplier.rating }})</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12" v-if="preferredSuppliers.length === 0">
                        <div class="text-center text-muted-color p-4">
                            <i class="pi pi-users text-4xl mb-3 block"></i>
                            <p>No tienes proveedores preferidos configurados</p>
                            <Button label="Explorar Proveedores" severity="secondary" @click="openSupplierSelection" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Usage Statistics -->
        <div class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Estadísticas de Uso</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-3">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-blue-600">24</div>
                            <div class="text-sm text-muted-color">Solicitudes Este Mes</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-green-600">18</div>
                            <div class="text-sm text-muted-color">Trabajos Completados</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-orange-600">$85,400</div>
                            <div class="text-sm text-muted-color">Gastado Este Mes</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-purple-600">2.3</div>
                            <div class="text-sm text-muted-color">Días Promedio</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Company Dialog -->
    <Dialog v-model:visible="companyDialog" :style="{ width: '700px' }" header="Editar Información de la Empresa" modal>
        <div class="grid" v-if="companyForm">
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label for="company_name" class="font-medium">Nombre de la Empresa *</label>
                    <InputText id="company_name" v-model="companyForm.company_name" class="w-full" />
                </div>
                <div class="field">
                    <label for="business_type" class="font-medium">Tipo de Negocio *</label>
                    <Dropdown
                        id="business_type"
                        v-model="companyForm.business_type"
                        :options="businessTypes"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
                <div class="field">
                    <label for="contact_person" class="font-medium">Persona de Contacto *</label>
                    <InputText id="contact_person" v-model="companyForm.contact_person" class="w-full" />
                </div>
                <div class="field">
                    <label for="position" class="font-medium">Cargo</label>
                    <InputText id="position" v-model="companyForm.position" class="w-full" />
                </div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label for="phone_number" class="font-medium">Teléfono *</label>
                    <InputText id="phone_number" v-model="companyForm.phone_number" class="w-full" />
                </div>
                <div class="field">
                    <label for="email" class="font-medium">Email *</label>
                    <InputText id="email" v-model="companyForm.email" class="w-full" />
                </div>
                <div class="field">
                    <label for="website_url" class="font-medium">Sitio Web</label>
                    <InputText id="website_url" v-model="companyForm.website_url" class="w-full" />
                </div>
                <div class="field">
                    <label for="rfc" class="font-medium">RFC</label>
                    <InputText id="rfc" v-model="companyForm.rfc" class="w-full" />
                </div>
            </div>
            <div class="col-span-12">
                <div class="field">
                    <label for="legal_address" class="font-medium">Dirección Legal *</label>
                    <Textarea id="legal_address" v-model="companyForm.legal_address" rows="3" class="w-full" />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="companyDialog = false" />
            <Button label="Guardar" icon="pi pi-check" @click="saveCompanyInfo" :loading="savingCompany" />
        </template>
    </Dialog>

    <!-- Location Dialog -->
    <Dialog v-model:visible="locationDialog" :style="{ width: '600px' }" header="Ubicación de Servicio" modal>
        <div class="grid" v-if="locationForm">
            <div class="col-span-12">
                <div class="field">
                    <label for="location_name" class="font-medium">Nombre de la Ubicación *</label>
                    <InputText id="location_name" v-model="locationForm.name" class="w-full" />
                </div>
                <div class="field">
                    <label for="location_type" class="font-medium">Tipo de Ubicación *</label>
                    <Dropdown
                        id="location_type"
                        v-model="locationForm.type"
                        :options="locationTypes"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
                <div class="field">
                    <label for="location_address" class="font-medium">Dirección *</label>
                    <Textarea id="location_address" v-model="locationForm.address" rows="2" class="w-full" />
                </div>
                <div class="field grid grid-cols-2 gap-4">
                    <div>
                        <label for="location_city" class="font-medium">Ciudad *</label>
                        <InputText id="location_city" v-model="locationForm.city" class="w-full" />
                    </div>
                    <div>
                        <label for="location_state" class="font-medium">Estado *</label>
                        <InputText id="location_state" v-model="locationForm.state" class="w-full" />
                    </div>
                </div>
                <div class="field grid grid-cols-2 gap-4">
                    <div>
                        <label for="location_contact" class="font-medium">Contacto Local</label>
                        <InputText id="location_contact" v-model="locationForm.contact_person" class="w-full" />
                    </div>
                    <div>
                        <label for="location_phone" class="font-medium">Teléfono Local</label>
                        <InputText id="location_phone" v-model="locationForm.phone" class="w-full" />
                    </div>
                </div>
                <div class="field">
                    <label for="priority" class="font-medium">Prioridad de Mantenimiento</label>
                    <Dropdown
                        id="priority"
                        v-model="locationForm.priority"
                        :options="priorityOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="locationDialog = false" />
            <Button label="Guardar" icon="pi pi-check" @click="saveLocation" :loading="savingLocation" />
        </template>
    </Dialog>

    <!-- Delete Location Dialog -->
    <Dialog v-model:visible="deleteLocationDialog" :style="{ width: '450px' }" header="Confirmar Eliminación" modal>
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 2rem" />
            <span v-if="locationToDelete">
                ¿Estás seguro de que quieres eliminar la ubicación <b>{{ locationToDelete.name }}</b>?
            </span>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="deleteLocationDialog = false" />
            <Button label="Eliminar" icon="pi pi-check" severity="danger" @click="deleteLocation" />
        </template>
    </Dialog>

    <!-- Change Password Dialog -->
    <Dialog v-model:visible="showPasswordDialog" :style="{ width: '500px' }" header="Cambiar Contraseña" modal>
        <div class="space-y-4">
            <div class="field">
                <label for="current_password" class="font-medium">Contraseña Actual *</label>
                <Password id="current_password" v-model="passwordForm.current" class="w-full" :feedback="false" />
            </div>
            <div class="field">
                <label for="new_password" class="font-medium">Nueva Contraseña *</label>
                <Password id="new_password" v-model="passwordForm.new" class="w-full" />
            </div>
            <div class="field">
                <label for="confirm_password" class="font-medium">Confirmar Contraseña *</label>
                <Password id="confirm_password" v-model="passwordForm.confirm" class="w-full" :feedback="false" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closePasswordDialog" />
            <Button label="Cambiar Contraseña" icon="pi pi-key" @click="changePassword" :loading="changingPassword" />
        </template>
    </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';

const toast = useToast();
const router = useRouter();
const { user, profile } = useAuth();

// Reactive data
const clientProfile = ref(null);
const serviceLocations = ref([]);
const preferredSuppliers = ref([]);
const companyForm = ref({});
const locationForm = ref({});
const locationToDelete = ref(null);

const companyDialog = ref(false);
const locationDialog = ref(false);
const deleteLocationDialog = ref(false);
const showPasswordDialog = ref(false);

const loadingLocations = ref(false);
const savingCompany = ref(false);
const savingLocation = ref(false);
const changingPassword = ref(false);

const passwordForm = ref({
    current: '',
    new: '',
    confirm: ''
});

// Options
const businessTypes = ref([
    { label: 'Corporación', value: 'corporation' },
    { label: 'PYME', value: 'sme' },
    { label: 'Startup', value: 'startup' },
    { label: 'Individual', value: 'individual' }
]);

const locationTypes = ref([
    { label: 'Oficina Principal', value: 'headquarters' },
    { label: 'Sucursal', value: 'branch' },
    { label: 'Planta/Fábrica', value: 'factory' },
    { label: 'Almacén', value: 'warehouse' },
    { label: 'Centro Comercial', value: 'retail' },
    { label: 'Otro', value: 'other' }
]);

const priorityOptions = ref([
    { label: 'Baja', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'Alta', value: 'high' },
    { label: 'Crítica', value: 'critical' }
]);

// Methods
const loadClientProfile = async () => {
    try {
        const { data, error } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        clientProfile.value = data;
    } catch (error) {
        console.error('Error loading client profile:', error);
    }
};

const loadServiceLocations = async () => {
    loadingLocations.value = true;
    try {
        // Mock data for now - would connect to a service_locations table
        serviceLocations.value = [
            {
                id: 1,
                name: 'Oficina Central',
                type: 'headquarters',
                address: 'Av. Reforma 1234, Colonia Centro',
                city: 'Ciudad de México',
                state: 'CDMX',
                contact_person: 'Ana García',
                phone: '55-1234-5678',
                priority: 'high'
            },
            {
                id: 2,
                name: 'Sucursal Norte',
                type: 'branch',
                address: 'Blvd. Satelite 567',
                city: 'Naucalpan',
                state: 'Estado de México',
                contact_person: '',
                phone: '',
                priority: 'normal'
            }
        ];
    } catch (error) {
        console.error('Error loading service locations:', error);
    } finally {
        loadingLocations.value = false;
    }
};

const loadPreferredSuppliers = async () => {
    try {
        // Mock data for now
        preferredSuppliers.value = [
            {
                id: 1,
                name: 'HVAC Solutions Pro',
                specialties: ['Aire Acondicionado', 'Calefacción', 'Ventilación'],
                rating: 4.8
            },
            {
                id: 2,
                name: 'ElectroTech MX',
                specialties: ['Sistemas Eléctricos', 'UPS', 'Iluminación'],
                rating: 4.6
            }
        ];
    } catch (error) {
        console.error('Error loading preferred suppliers:', error);
    }
};

const editProfile = () => {
    router.push('/onboarding/client');
};

const createRequest = () => {
    router.push('/client/requests');
};

const editCompanyInfo = () => {
    if (clientProfile.value) {
        companyForm.value = {
            company_name: clientProfile.value.company_name,
            business_type: clientProfile.value.business_type,
            contact_person: clientProfile.value.contact_person,
            position: clientProfile.value.position,
            phone_number: clientProfile.value.phone_number,
            email: clientProfile.value.email,
            website_url: clientProfile.value.website_url,
            rfc: clientProfile.value.rfc,
            legal_address: clientProfile.value.legal_address
        };
        companyDialog.value = true;
    }
};

const saveCompanyInfo = async () => {
    savingCompany.value = true;
    try {
        const { error } = await supabase
            .from('client_profiles')
            .update({
                company_name: companyForm.value.company_name,
                business_type: companyForm.value.business_type,
                contact_person: companyForm.value.contact_person,
                position: companyForm.value.position,
                phone_number: companyForm.value.phone_number,
                email: companyForm.value.email,
                website_url: companyForm.value.website_url,
                rfc: companyForm.value.rfc,
                legal_address: companyForm.value.legal_address,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Información de empresa actualizada',
            life: 3000
        });

        await loadClientProfile();
        companyDialog.value = false;
    } catch (error) {
        console.error('Error updating company info:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar información',
            life: 3000
        });
    } finally {
        savingCompany.value = false;
    }
};

const openNewLocation = () => {
    locationForm.value = {
        name: '',
        type: 'branch',
        address: '',
        city: '',
        state: '',
        contact_person: '',
        phone: '',
        priority: 'normal'
    };
    locationDialog.value = true;
};

const editLocation = (location) => {
    locationForm.value = { ...location };
    locationDialog.value = true;
};

const saveLocation = async () => {
    savingLocation.value = true;
    try {
        // Mock save - would save to service_locations table
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (locationForm.value.id) {
            // Update existing
            const index = serviceLocations.value.findIndex(l => l.id === locationForm.value.id);
            if (index !== -1) {
                serviceLocations.value[index] = { ...locationForm.value };
            }
        } else {
            // Add new
            locationForm.value.id = Date.now();
            serviceLocations.value.push({ ...locationForm.value });
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Ubicación guardada correctamente',
            life: 3000
        });

        locationDialog.value = false;
    } catch (error) {
        console.error('Error saving location:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al guardar ubicación',
            life: 3000
        });
    } finally {
        savingLocation.value = false;
    }
};

const confirmDeleteLocation = (location) => {
    locationToDelete.value = location;
    deleteLocationDialog.value = true;
};

const deleteLocation = async () => {
    try {
        serviceLocations.value = serviceLocations.value.filter(l => l.id !== locationToDelete.value.id);
        deleteLocationDialog.value = false;
        locationToDelete.value = null;

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Ubicación eliminada',
            life: 3000
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar ubicación',
            life: 3000
        });
    }
};

const openSupplierSelection = () => {
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'La selección de proveedores estará disponible próximamente',
        life: 3000
    });
};

const removePreferredSupplier = (supplierId) => {
    preferredSuppliers.value = preferredSuppliers.value.filter(s => s.id !== supplierId);
    toast.add({
        severity: 'success',
        summary: 'Proveedor Removido',
        detail: 'El proveedor ha sido removido de sus preferidos',
        life: 3000
    });
};

const changePassword = async () => {
    if (!passwordForm.value.current || !passwordForm.value.new || !passwordForm.value.confirm) {
        toast.add({
            severity: 'warn',
            summary: 'Campos Requeridos',
            detail: 'Todos los campos son obligatorios',
            life: 3000
        });
        return;
    }

    if (passwordForm.value.new !== passwordForm.value.confirm) {
        toast.add({
            severity: 'warn',
            summary: 'Error',
            detail: 'Las contraseñas no coinciden',
            life: 3000
        });
        return;
    }

    changingPassword.value = true;
    try {
        const { error } = await supabase.auth.updateUser({
            password: passwordForm.value.new
        });

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Contraseña actualizada correctamente',
            life: 3000
        });

        closePasswordDialog();
    } catch (error) {
        console.error('Error changing password:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cambiar la contraseña',
            life: 3000
        });
    } finally {
        changingPassword.value = false;
    }
};

const closePasswordDialog = () => {
    showPasswordDialog.value = false;
    passwordForm.value = {
        current: '',
        new: '',
        confirm: ''
    };
};

// Utility functions
const getSizeLabel = (size) => {
    const labels = {
        'small': 'Pequeña',
        'medium': 'Mediana',
        'large': 'Grande',
        'enterprise': 'Empresarial'
    };
    return labels[size] || size;
};

const getBusinessTypeLabel = (type) => {
    const labels = {
        'corporation': 'Corporación',
        'sme': 'PYME',
        'startup': 'Startup',
        'individual': 'Individual'
    };
    return labels[type] || type;
};

const getScheduleLabel = (schedule) => {
    const labels = {
        'monthly': 'Mensual',
        'quarterly': 'Trimestral',
        'biannual': 'Semestral',
        'annual': 'Anual'
    };
    return labels[schedule] || schedule;
};

const getPrioritySeverity = (priority) => {
    const severities = {
        'low': 'secondary',
        'normal': 'info',
        'high': 'warn',
        'critical': 'danger'
    };
    return severities[priority] || 'secondary';
};

// Lifecycle
onMounted(async () => {
    await loadClientProfile();
    await loadServiceLocations();
    await loadPreferredSuppliers();
});
</script>