<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Profile Information Card -->
        <div class="col-span-12 xl:col-span-4">
            <div class="card mb-0">
                <!-- Header con gradiente -->
                <div class="surface-ground border-round-top p-5 mb-4" :class="isFlynn ? 'flynn-header' : adminProfile?.is_super_admin ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'">
                    <div class="flex flex-col items-center">
                        <!-- Avatar con indicador de Super Admin -->
                        <div class="relative">
                            <AvatarUpload
                                :currentAvatarUrl="avatarDisplayUrl"
                                :username="profile?.username || 'admin'"
                                bucket="avatars"
                                @upload-success="handleAvatarSuccess"
                            />
                            
                            <!-- Badge especial para FLYNN -->
                            <div
                                v-if="isFlynn"
                                class="flynn-mode-badge absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 border-round-lg flex align-items-center gap-1"
                                style="font-size: 0.7rem; font-weight: 700; z-index: 10;"
                            >
                                <i class="pi pi-bolt" style="font-size: 0.7rem;"></i>
                                <span>FLYNN MODE</span>
                            </div>
                            <!-- Badge especial para Super Admin -->
                            <div
                                v-else-if="adminProfile?.is_super_admin"
                                class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-3 py-1 border-round-lg shadow-md flex align-items-center gap-1"
                                style="font-size: 0.7rem; font-weight: 700; z-index: 10;"
                            >
                                <i class="pi pi-star-fill" style="font-size: 0.7rem;"></i>
                                <span>GOD MODE</span>
                            </div>
                        </div>
                        <div class="text-center mt-4 text-white">
                            <div class="font-bold text-2xl mb-1">{{ profile?.username || 'Admin' }}</div>
                            <div class="text-lg opacity-90">{{ adminProfile?.full_name || 'Administrador Principal' }}</div>
                            <div class="text-sm opacity-80 mt-1">{{ user?.email }}</div>
                        </div>
                    </div>
                </div>

                <!-- Información del perfil -->
                <div class="px-5 pb-5">
                    <div class="grid">
                        <!-- Departamento - Row 1 (centered) -->
                        <div class="col-12 mb-3">
                            <div class="surface-100 border-round p-3 text-center">
                                <div class="text-600 font-medium mb-2">
                                    <i class="pi pi-briefcase mr-2"></i>
                                    Departamento
                                </div>
                                <div class="text-900 font-semibold text-lg">
                                    {{ getDepartmentLabel(adminProfile?.department) || 'Operations' }}
                                </div>
                            </div>
                        </div>

                        <!-- Estado y Privilegios - Row 2 (symmetrical) -->
                        <div class="col-6">
                            <div class="surface-100 border-round p-3">
                                <div class="text-600 font-medium mb-2">
                                    <i class="pi pi-check-circle mr-2"></i>
                                    Estado
                                </div>
                                <Tag
                                    :value="getStatusLabel(adminProfile?.status)"
                                    :severity="adminProfile?.status === 'active' ? 'success' : 'warn'"
                                    class="font-semibold"
                                />
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="surface-100 border-round p-3">
                                <div class="text-600 font-medium mb-2">
                                    <i class="pi pi-shield mr-2"></i>
                                    Privilegios
                                </div>
                                <div class="flex flex-wrap gap-1">
                                    <!-- FLYNN Badge (solo para Mike) -->
                                    <Tag
                                        v-if="isFlynn"
                                        value="FLYNN!"
                                        severity="contrast"
                                        class="font-bold flynn-tag"
                                    >
                                        <i class="pi pi-bolt mr-1"></i>
                                    </Tag>
                                    <!-- GOD Badge (Super Admin) -->
                                    <Tag
                                        v-if="adminProfile?.is_super_admin"
                                        value="GOD"
                                        severity="warning"
                                        class="font-semibold"
                                    >
                                        <i class="pi pi-star-fill mr-1"></i>
                                    </Tag>
                                    <!-- Admin Badge -->
                                    <Tag
                                        value="Admin"
                                        severity="info"
                                        class="font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Divider />

                    <div class="flex flex-column gap-2">
                        <Button
                            label="Cambiar Contraseña"
                            icon="pi pi-key"
                            severity="secondary"
                            outlined
                            class="w-full"
                            @click="showPasswordDialog = true"
                        />
                        <Button
                            label="Editar Perfil"
                            icon="pi pi-user-edit"
                            severity="info"
                            outlined
                            class="w-full"
                            @click="editAdminProfile"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Users Management -->
        <div class="col-span-12 xl:col-span-8">
            <div class="card">
                <Toolbar class="mb-6">
                    <template #start>
                        <div class="font-semibold text-xl">Gestión de Administradores</div>
                    </template>
                    <template #end>
                        <Button label="Nuevo Admin" icon="pi pi-plus" @click="openNewAdmin" v-if="adminProfile?.is_super_admin" />
                    </template>
                </Toolbar>

                <DataTable
                    ref="dt"
                    v-model:selection="selectedAdmins"
                    :value="admins"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    :loading="loading"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} administradores"
                >
                    <template #header>
                        <div class="flex flex-wrap gap-2 items-center justify-between">
                            <h4 class="m-0">Lista de Administradores</h4>
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                            </IconField>
                        </div>
                    </template>

                    <Column selectionMode="multiple" style="width: 3rem" :exportable="false" v-if="adminProfile?.is_super_admin"></Column>
                    <Column field="username" header="Usuario" sortable style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.username }}</div>
                            <div class="text-sm text-muted-color">{{ slotProps.data.full_name }}</div>
                        </template>
                    </Column>
                    <Column field="email" header="Email" sortable style="min-width: 16rem"></Column>
                    <Column field="department" header="Departamento" sortable style="min-width: 10rem">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.department" severity="info" />
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                        </template>
                    </Column>
                    <Column field="is_super_admin" header="Super Admin" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <i :class="slotProps.data.is_super_admin ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                        </template>
                    </Column>
                    <Column field="created_at" header="Creado" sortable style="min-width: 10rem">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.created_at) }}
                        </template>
                    </Column>
                    <Column :exportable="false" style="min-width: 12rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" severity="info" text rounded @click="editAdmin(slotProps.data)" v-tooltip="'Editar'" />
                                <Button
                                    v-if="adminProfile?.is_super_admin && slotProps.data.id !== adminProfile?.id"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    rounded
                                    @click="confirmDeleteAdmin(slotProps.data)"
                                    v-tooltip="'Eliminar'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- System Settings Card (Super Admin Only) -->
        <div class="col-span-12" v-if="adminProfile?.is_super_admin">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Configuración del Sistema</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 lg:col-span-3">
                        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" @click="navigateToSupplierApproval">
                            <div class="flex items-center justify-between mb-2">
                                <i class="pi pi-users text-2xl text-blue-500"></i>
                                <Button icon="pi pi-external-link" text size="small" />
                            </div>
                            <div class="font-medium">Aprobar Suppliers</div>
                            <div class="text-sm text-muted-color">Gestionar solicitudes pendientes</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6 lg:col-span-3">
                        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" @click="navigateToTickets">
                            <div class="flex items-center justify-between mb-2">
                                <i class="pi pi-ticket text-2xl text-green-500"></i>
                                <Button icon="pi pi-external-link" text size="small" />
                            </div>
                            <div class="font-medium">Gestionar Tickets</div>
                            <div class="text-sm text-muted-color">Asignar y supervisar trabajos</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6 lg:col-span-3">
                        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" @click="navigateToPayments">
                            <div class="flex items-center justify-between mb-2">
                                <i class="pi pi-dollar text-2xl text-orange-500"></i>
                                <Button icon="pi pi-external-link" text size="small" />
                            </div>
                            <div class="font-medium">Automatización de Pagos</div>
                            <div class="text-sm text-muted-color">Configurar y monitorear pagos</div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6 lg:col-span-3">
                        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" @click="navigateToUsers">
                            <div class="flex items-center justify-between mb-2">
                                <i class="pi pi-cog text-2xl text-purple-500"></i>
                                <Button icon="pi pi-external-link" text size="small" />
                            </div>
                            <div class="font-medium">Gestión de Usuarios</div>
                            <div class="text-sm text-muted-color">Administrar todos los usuarios</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Admin Dialog -->
    <Dialog v-model:visible="adminDialog" :style="{ width: '600px' }" header="Detalles de Administrador" modal>
        <div class="grid" v-if="admin">
            <div class="col-span-12">
                <div class="field">
                    <label for="username" class="font-medium">Usuario *</label>
                    <InputText id="username" v-model="admin.username" required="true" :invalid="submitted && !admin.username" class="w-full" />
                    <small class="text-red-500" v-if="submitted && !admin.username">El usuario es obligatorio.</small>
                </div>
                <div class="field">
                    <label for="full_name" class="font-medium">Nombre Completo *</label>
                    <InputText id="full_name" v-model="admin.full_name" required="true" :invalid="submitted && !admin.full_name" class="w-full" />
                </div>
                <div class="field">
                    <label for="email" class="font-medium">Email *</label>
                    <InputText id="email" v-model="admin.email" required="true" :invalid="submitted && !admin.email" class="w-full" />
                </div>
                <div class="field">
                    <label for="department" class="font-medium">Departamento</label>
                    <Dropdown
                        id="department"
                        v-model="admin.department"
                        :options="departments"
                        option-label="label"
                        option-value="value"
                        placeholder="Seleccionar departamento"
                        class="w-full"
                    />
                </div>
                <div class="field">
                    <label for="status" class="font-medium">Estado</label>
                    <Dropdown
                        id="status"
                        v-model="admin.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="Seleccionar estado"
                        class="w-full"
                    />
                </div>
                <div class="field" v-if="adminProfile?.is_super_admin">
                    <div class="flex items-center">
                        <Checkbox id="is_super_admin" v-model="admin.is_super_admin" :binary="true" />
                        <label for="is_super_admin" class="ml-2">Super Administrador</label>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Guardar" icon="pi pi-check" @click="saveAdmin" />
        </template>
    </Dialog>

    <!-- Delete Admin Dialog -->
    <Dialog v-model:visible="deleteAdminDialog" :style="{ width: '450px' }" header="Confirmar" modal>
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-red-500" style="font-size: 2rem" />
            <span v-if="admin"
                >¿Estás seguro de que quieres eliminar al administrador <b>{{ admin.username }}</b>?</span
            >
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" text @click="deleteAdminDialog = false" />
            <Button label="Sí" icon="pi pi-check" @click="deleteAdmin" />
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
import { ref, onMounted, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';
import AvatarUpload from '@/components/common/AvatarUpload.vue';

const toast = useToast();
const router = useRouter();
const { user, profile } = useAuth();

const { getSignedUrl } = useS3Upload();

// Reactive data
const dt = ref();
const admins = ref([]);
const adminProfile = ref(null);
const avatarDisplayUrl = ref(null);
const admin = ref({});
const selectedAdmins = ref();
const adminDialog = ref(false);
const deleteAdminDialog = ref(false);
const submitted = ref(false);
const loading = ref(false);
const showPasswordDialog = ref(false);
const changingPassword = ref(false);

const passwordForm = ref({
    current: '',
    new: '',
    confirm: ''
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Options
const departments = ref([
    { label: 'Operations', value: 'operations' },
    { label: 'Finance', value: 'finance' },
    { label: 'IT', value: 'it' },
    { label: 'HR', value: 'hr' },
    { label: 'Management', value: 'management' }
]);

const statusOptions = ref([
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
    { label: 'Suspendido', value: 'suspended' }
]);

// Methods
const loadAdminProfile = async () => {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        adminProfile.value = data;
        
        if (data?.avatar_url) {
            avatarDisplayUrl.value = await getSignedUrl(data.avatar_url);
        }
    } catch (error) {
        console.error('Error loading admin profile:', error);
    }
};

const handleAvatarSuccess = async (s3Key) => {
    try {
        const { error } = await supabase
            .from('admins')
            .update({ avatar_url: s3Key })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Avatar actualizado', life: 3000 });
        await loadAdminProfile();
    } catch (error) {
        console.error('Error updating avatar in DB:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar avatar', life: 3000 });
    }
};

const loadAdmins = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        admins.value = data || [];
    } catch (error) {
        console.error('Error loading admins:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar administradores',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const openNewAdmin = () => {
    admin.value = {
        username: '',
        full_name: '',
        email: '',
        department: 'operations',
        status: 'active',
        is_super_admin: false
    };
    submitted.value = false;
    adminDialog.value = true;
};

const editAdmin = (adminData) => {
    admin.value = { ...adminData };
    adminDialog.value = true;
};

const hideDialog = () => {
    adminDialog.value = false;
    submitted.value = false;
};

const saveAdmin = async () => {
    submitted.value = true;

    if (!admin.value.username?.trim() || !admin.value.full_name?.trim() || !admin.value.email?.trim()) {
        return;
    }

    try {
        if (admin.value.id) {
            // Update existing admin
            const { error } = await supabase
                .from('admins')
                .update({
                    username: admin.value.username,
                    full_name: admin.value.full_name,
                    email: admin.value.email,
                    department: admin.value.department,
                    status: admin.value.status,
                    is_super_admin: admin.value.is_super_admin,
                    updated_at: new Date().toISOString()
                })
                .eq('id', admin.value.id);

            if (error) throw error;

            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Administrador actualizado', life: 3000 });
        } else {
            // Create new admin (would require creating user in auth first)
            toast.add({
                severity: 'warn',
                summary: 'Funcionalidad Pendiente',
                detail: 'La creación de nuevos admins requiere configuración adicional',
                life: 5000
            });
        }

        adminDialog.value = false;
        await loadAdmins();
    } catch (error) {
        console.error('Error saving admin:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al guardar administrador',
            life: 3000
        });
    }
};

const confirmDeleteAdmin = (adminData) => {
    admin.value = adminData;
    deleteAdminDialog.value = true;
};

const deleteAdmin = async () => {
    try {
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', admin.value.id);

        if (error) throw error;

        admins.value = admins.value.filter(val => val.id !== admin.value.id);
        deleteAdminDialog.value = false;
        admin.value = {};

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Administrador eliminado', life: 3000 });
    } catch (error) {
        console.error('Error deleting admin:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar administrador',
            life: 3000
        });
    }
};

const editAdminProfile = () => {
    if (adminProfile.value) {
        admin.value = { ...adminProfile.value };
        adminDialog.value = true;
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

// Utility functions
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX');
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'active': return 'success';
        case 'inactive': return 'warn';
        case 'suspended': return 'danger';
        default: return 'secondary';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'active': return 'Activo';
        case 'inactive': return 'Inactivo';
        case 'suspended': return 'Suspendido';
        default: return status;
    }
};

const getDepartmentLabel = (department) => {
    const dept = departments.value.find(d => d.value === department);
    return dept ? dept.label : department;
};

// FLYNN mode - exclusivo para Flynn
const isFlynn = computed(() => {
    return user.value?.email?.toLowerCase() === 'm@511.mx';
});

// Navigation functions
const navigateToSupplierApproval = () => router.push('/admin/suppliers-approval');
const navigateToTickets = () => router.push('/admin/tickets');
const navigateToPayments = () => router.push('/admin/payment-automation');
const navigateToUsers = () => router.push('/admin/users');

// Lifecycle
onMounted(async () => {
    await loadAdminProfile();
    await loadAdmins();
});
</script>

<style scoped>
/* 🌌 FLYNN MODE - TRON AESTHETIC */
.flynn-header {
    background: rgba(0, 20, 40, 0.95) !important;
    border: 1px solid #00d4ff !important;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3) !important;
}

.flynn-avatar {
    background: linear-gradient(45deg, #00d4ff, #0099cc) !important;
    color: #000 !important;
}

.flynn-mode-badge {
    background: rgba(0, 20, 40, 0.95);
    border: 1px solid #00d4ff;
    color: #00d4ff !important;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.flynn-tag {
    background: linear-gradient(45deg, #00d4ff, #0099cc) !important;
    color: #000 !important;
    border: 1px solid #00d4ff !important;
}
</style>