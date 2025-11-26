<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Profile Information Card -->
        <div class="col-span-12 xl:col-span-4">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Mi Perfil de Proveedor</div>
                <div class="flex flex-col items-center mb-6">
                    <Avatar :label="profile?.username?.charAt(0).toUpperCase()" class="mr-2" size="xlarge" shape="circle" />
                    <div class="text-center mt-3">
                        <div class="font-medium text-lg">{{ supplierProfile?.company_name || 'Mi Empresa' }}</div>
                        <div class="text-muted-color">{{ profile?.username || 'supplier' }}</div>
                        <div class="text-sm text-muted-color">{{ user?.email }}</div>
                        <div class="text-sm text-muted-color">RFC: {{ supplierProfile?.rfc }}</div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="field">
                        <label class="font-medium text-sm">Estado de Aprobación:</label>
                        <Tag :value="getStatusLabel(supplierProfile?.status)" :severity="getStatusSeverity(supplierProfile?.status)" />
                    </div>
                    <div class="field" v-if="supplierProfile?.specialties?.length">
                        <label class="font-medium text-sm">Especialidades:</label>
                        <div class="flex flex-wrap gap-1 mt-1">
                            <Tag v-for="specialty in supplierProfile.specialties" :key="specialty" :value="specialty" severity="info" />
                        </div>
                    </div>
                    <div class="field" v-if="supplierProfile?.service_areas?.length">
                        <label class="font-medium text-sm">Áreas de Servicio:</label>
                        <div class="flex flex-wrap gap-1 mt-1">
                            <Tag v-for="area in supplierProfile.service_areas" :key="area" :value="area" severity="secondary" />
                        </div>
                    </div>
                    <div class="field" v-if="supplierProfile?.years_experience">
                        <label class="font-medium text-sm">Experiencia:</label>
                        <p class="text-muted-color">{{ supplierProfile.years_experience }} años</p>
                    </div>
                </div>

                <Divider />

                <div class="space-y-2">
                    <Button label="Cambiar Contraseña" icon="pi pi-key" severity="secondary" text class="w-full justify-start" @click="showPasswordDialog = true" />
                    <Button label="Actualizar Perfil" icon="pi pi-user-edit" severity="secondary" text class="w-full justify-start" @click="editProfile" />
                    <Button
                        v-if="supplierProfile?.status === 'rejected'"
                        label="Reenviar Solicitud"
                        icon="pi pi-refresh"
                        severity="warn"
                        text
                        class="w-full justify-start"
                        @click="resubmitApplication"
                    />
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

                <div class="grid grid-cols-12 gap-4" v-if="supplierProfile">
                    <div class="col-span-12 md:col-span-6">
                        <div class="field">
                            <label class="font-medium text-sm">Empresa:</label>
                            <p>{{ supplierProfile.company_name }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">RFC:</label>
                            <p>{{ supplierProfile.rfc }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Contacto:</label>
                            <p>{{ supplierProfile.contact_person }}</p>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="field">
                            <label class="font-medium text-sm">Teléfono:</label>
                            <p>{{ supplierProfile.phone_number }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Email:</label>
                            <p>{{ supplierProfile.email }}</p>
                        </div>
                        <div class="field">
                            <label class="font-medium text-sm">Dirección:</label>
                            <p>{{ supplierProfile.full_address || 'Sin dirección' }}</p>
                        </div>
                    </div>
                    <div class="col-span-12" v-if="supplierProfile.business_description">
                        <div class="field">
                            <label class="font-medium text-sm">Descripción del Negocio:</label>
                            <p>{{ supplierProfile.business_description }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Locations -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Sucursales y Ubicaciones de Servicio</div>
                    <Button icon="pi pi-plus" label="Agregar Sucursal" severity="secondary" @click="openNewLocation" />
                </div>

                <DataTable
                    :value="serviceLocations"
                    :paginator="false"
                    :loading="loadingLocations"
                    responsiveLayout="scroll"
                    emptyMessage="No hay sucursales registradas"
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
                            <div>{{ slotProps.data.contact_person }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.phone }}</div>
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="slotProps.data.status === 'active' ? 'success' : 'warn'" />
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
        </div>

        <!-- Financial Information (if approved) -->
        <div class="col-span-12" v-if="supplierProfile?.status === 'approved'">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Información Financiera</div>
                    <Button icon="pi pi-pencil" label="Actualizar" severity="secondary" @click="editFinancialInfo" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-green-600">$45,200</div>
                            <div class="text-sm text-muted-color">Ingresos Este Mes</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-blue-600">12</div>
                            <div class="text-sm text-muted-color">Trabajos Completados</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <div class="border rounded-lg p-4 text-center">
                            <div class="text-2xl font-bold text-orange-600">4.7</div>
                            <div class="text-sm text-muted-color">Calificación Promedio</div>
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
                    <label for="contact_person" class="font-medium">Persona de Contacto *</label>
                    <InputText id="contact_person" v-model="companyForm.contact_person" class="w-full" />
                </div>
                <div class="field">
                    <label for="phone_number" class="font-medium">Teléfono *</label>
                    <InputText id="phone_number" v-model="companyForm.phone_number" class="w-full" />
                </div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label for="email" class="font-medium">Email *</label>
                    <InputText id="email" v-model="companyForm.email" class="w-full" />
                </div>
                <div class="field">
                    <label class="font-medium">Dirección Legal</label>
                    <div class="grid grid-cols-12 gap-2 mt-2">
                        <div class="col-span-8">
                            <label for="street" class="text-sm">Calle *</label>
                            <InputText id="street" v-model="companyForm.street" class="w-full" />
                        </div>
                        <div class="col-span-4">
                            <label for="number" class="text-sm">No. Ext *</label>
                            <InputText id="number" v-model="companyForm.number" class="w-full" />
                        </div>
                        <div class="col-span-4">
                            <label for="apt" class="text-sm">No. Int</label>
                            <InputText id="apt" v-model="companyForm.apt" class="w-full" />
                        </div>
                        <div class="col-span-8">
                            <label for="neighborhood" class="text-sm">Colonia *</label>
                            <InputText id="neighborhood" v-model="companyForm.neighborhood" class="w-full" />
                        </div>
                        <div class="col-span-6">
                            <label for="municipality_city" class="text-sm">Municipio/Ciudad *</label>
                            <InputText id="municipality_city" v-model="companyForm.municipality_city" class="w-full" />
                        </div>
                        <div class="col-span-6">
                            <label for="state" class="text-sm">Estado *</label>
                            <InputText id="state" v-model="companyForm.state" class="w-full" />
                        </div>
                        <div class="col-span-6">
                            <label for="postal_code" class="text-sm">CP *</label>
                            <InputText id="postal_code" v-model="companyForm.postal_code" class="w-full" />
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12">
                <div class="field">
                    <label for="business_description" class="font-medium">Descripción del Negocio</label>
                    <Textarea id="business_description" v-model="companyForm.business_description" rows="3" class="w-full" />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="companyDialog = false" />
            <Button label="Guardar" icon="pi pi-check" @click="saveCompanyInfo" :loading="savingCompany" />
        </template>
    </Dialog>

    <!-- Location Dialog -->
    <Dialog v-model:visible="locationDialog" :style="{ width: '600px' }" header="Sucursal / Ubicación" modal>
        <div class="grid" v-if="locationForm">
            <div class="col-span-12">
                <div class="field">
                    <label for="location_name" class="font-medium">Nombre *</label>
                    <InputText id="location_name" v-model="locationForm.name" class="w-full" />
                </div>
                <div class="field">
                    <label for="location_type" class="font-medium">Tipo *</label>
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
                        <label for="location_contact" class="font-medium">Contacto</label>
                        <InputText id="location_contact" v-model="locationForm.contact_person" class="w-full" />
                    </div>
                    <div>
                        <label for="location_phone" class="font-medium">Teléfono</label>
                        <InputText id="location_phone" v-model="locationForm.phone" class="w-full" />
                    </div>
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
const supplierProfile = ref(null);
const serviceLocations = ref([]);
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
const locationTypes = ref([
    { label: 'Oficina Principal', value: 'headquarters' },
    { label: 'Sucursal', value: 'branch' },
    { label: 'Almacén', value: 'warehouse' },
    { label: 'Taller', value: 'workshop' },
    { label: 'Punto de Servicio', value: 'service_point' }
]);

// Methods
const loadSupplierProfile = async () => {
    try {
        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        supplierProfile.value = data;
    } catch (error) {
        console.error('Error loading supplier profile:', error);
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
                address: 'Av. Insurgentes 1234',
                city: 'Ciudad de México',
                state: 'CDMX',
                contact_person: 'Juan Pérez',
                phone: '55-1234-5678',
                status: 'active'
            }
        ];
    } catch (error) {
        console.error('Error loading service locations:', error);
    } finally {
        loadingLocations.value = false;
    }
};

const editProfile = () => {
    router.push('/onboarding/supplier');
};

const editCompanyInfo = () => {
    if (supplierProfile.value) {
        companyForm.value = {
            company_name: supplierProfile.value.company_name,
            contact_person: supplierProfile.value.contact_person,
            phone_number: supplierProfile.value.phone_number,
            email: supplierProfile.value.email,
            email: supplierProfile.value.email,
            street: supplierProfile.value.street,
            number: supplierProfile.value.number,
            apt: supplierProfile.value.apt,
            neighborhood: supplierProfile.value.neighborhood,
            municipality_city: supplierProfile.value.municipality_city,
            state: supplierProfile.value.state,
            postal_code: supplierProfile.value.postal_code,
            business_description: supplierProfile.value.business_description
        };
        companyDialog.value = true;
    }
};

const saveCompanyInfo = async () => {
    savingCompany.value = true;
    try {
        const { error } = await supabase
            .from('supplier_profiles')
            .update({
                company_name: companyForm.value.company_name,
                contact_person: companyForm.value.contact_person,
                phone_number: companyForm.value.phone_number,
                email: companyForm.value.email,
                email: companyForm.value.email,
                street: companyForm.value.street,
                number: companyForm.value.number,
                apt: companyForm.value.apt,
                neighborhood: companyForm.value.neighborhood,
                municipality_city: companyForm.value.municipality_city,
                state: companyForm.value.state,
                postal_code: companyForm.value.postal_code,
                business_description: companyForm.value.business_description,
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

        await loadSupplierProfile();
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
        status: 'active'
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

const resubmitApplication = async () => {
    try {
        const { error } = await supabase
            .from('supplier_profiles')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({
            severity: 'success',
            summary: 'Solicitud Reenviada',
            detail: 'Su solicitud ha sido reenviada para revisión',
            life: 3000
        });

        await loadSupplierProfile();
    } catch (error) {
        console.error('Error resubmitting application:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al reenviar solicitud',
            life: 3000
        });
    }
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

const editFinancialInfo = () => {
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'La edición de información financiera estará disponible próximamente',
        life: 3000
    });
};

// Utility functions
const getStatusLabel = (status) => {
    const labels = {
        'draft': 'Borrador',
        'submitted': 'Enviado',
        'under_review': 'En Revisión',
        'additional_info_required': 'Info Adicional',
        'approved': 'Aprobado',
        'rejected': 'Rechazado',
        'suspended': 'Suspendido'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        'draft': 'secondary',
        'submitted': 'info',
        'under_review': 'warn',
        'additional_info_required': 'warn',
        'approved': 'success',
        'rejected': 'danger',
        'suspended': 'danger'
    };
    return severities[status] || 'secondary';
};

// Lifecycle
onMounted(async () => {
    await loadSupplierProfile();
    await loadServiceLocations();
});
</script>