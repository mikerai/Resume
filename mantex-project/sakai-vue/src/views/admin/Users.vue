<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Nuevo Usuario" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Eliminar" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedUsers || !selectedUsers.length" />
                </template>

                <template #end>
                    <Button label="Exportar" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedUsers"
                :value="users"
                dataKey="id"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Gestión de Usuarios</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                        </IconField>
                    </div>
                </template>

                <Column header="Avatar" style="width: 4rem">
                    <template #body="slotProps">
                        <Avatar 
                            :label="slotProps.data.full_name?.charAt(0).toUpperCase()" 
                            shape="circle" 
                            size="large"
                            :style="{ 'background-color': getRoleColor(slotProps.data.role), 'color': '#ffffff' }"
                        />
                    </template>
                </Column>
                <Column field="full_name" header="Nombre / Empresa" sortable style="min-width: 16rem">
                    <template #body="slotProps">
                        <div>
                            <div class="font-medium">{{ slotProps.data.full_name || 'Sin nombre' }}</div>
                            <div v-if="slotProps.data.company_name" class="text-sm text-primary font-medium">{{ slotProps.data.company_name }}</div>
                            <div class="text-sm text-500">{{ slotProps.data.email }}</div>
                        </div>
                    </template>
                </Column>
                <Column field="role" header="Rol" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="getRoleLabel(slotProps.data.role)" :severity="getRoleSeverity(slotProps.data.role)" />
                    </template>
                </Column>
                <Column field="phone" header="Teléfono" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="text-sm">{{ slotProps.data.phone || 'Sin teléfono' }}</div>
                    </template>
                </Column>
                <Column field="onboarding_status" header="Onboarding" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag
                            :value="getOnboardingLabel(slotProps.data.onboarding_complete)"
                            :severity="slotProps.data.onboarding_complete ? 'success' : 'warning'"
                        />
                    </template>
                </Column>
                <Column field="profile_status" header="Estado" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag
                            :value="getProfileStatusLabel(slotProps.data.profile_status)"
                            :severity="getProfileStatusSeverity(slotProps.data.profile_status)"
                        />
                    </template>
                </Column>
                <Column field="created_at" header="Registro" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="text-sm">{{ formatDate(slotProps.data.created_at) }}</div>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" severity="info" text rounded @click="viewUser(slotProps.data)" class="mr-2" v-tooltip="'Ver detalles'" />
                        <Button
                            v-if="slotProps.data.role !== 'admin'"
                            icon="pi pi-ban"
                            severity="danger"
                            text
                            rounded
                            @click="confirmSuspendUser(slotProps.data)"
                            v-tooltip="'Suspender'"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- User Dialog -->
        <Dialog v-model:visible="userDialog" :style="{ width: '600px' }" header="Detalles del Usuario" :modal="true">
            <div class="flex flex-col gap-6">
                <div class="field">
                    <label for="username" class="font-bold">Usuario *</label>
                    <InputText id="username" v-model.trim="user.username" required autofocus :invalid="submitted && !user.username" fluid />
                    <small v-if="submitted && !user.username" class="text-red-500">El usuario es requerido.</small>
                </div>

                <div class="field">
                    <label for="email" class="font-bold">Email *</label>
                    <InputText id="email" v-model.trim="user.email" required :invalid="submitted && !user.email" fluid />
                    <small v-if="submitted && !user.email" class="text-red-500">El email es requerido.</small>
                </div>

                <div class="field">
                    <label for="role" class="font-bold">Rol *</label>
                    <Dropdown id="role" v-model="user.role" :options="roles" optionLabel="label" optionValue="value" placeholder="Seleccionar rol" required :invalid="submitted && !user.role" fluid />
                    <small v-if="submitted && !user.role" class="text-red-500">El rol es requerido.</small>
                </div>

                <div class="field">
                    <label for="status" class="font-bold">Estado</label>
                    <Dropdown id="status" v-model="user.status" :options="statuses" optionLabel="label" optionValue="value" placeholder="Seleccionar estado" fluid />
                </div>

                <div class="field" v-if="!user.id">
                    <label for="password" class="font-bold">Contraseña *</label>
                    <Password id="password" v-model="user.password" toggleMask required :invalid="submitted && !user.password" fluid />
                    <small v-if="submitted && !user.password" class="text-red-500">La contraseña es requerida.</small>
                </div>

                <div class="field">
                    <label class="font-bold">Permisos</label>
                    <div class="flex flex-wrap gap-3">
                        <div v-for="permission in availablePermissions" :key="permission.key" class="flex items-center">
                            <Checkbox v-model="user.permissions" :inputId="permission.key" :value="permission.key" />
                            <label :for="permission.key" class="ml-2">{{ permission.label }}</label>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" @click="saveUser" />
            </template>
        </Dialog>

        <!-- Delete User Dialog -->
        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="user">¿Está seguro de que desea eliminar al usuario <b>{{ user.username }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
                <Button label="Sí" icon="pi pi-check" @click="deleteUser" />
            </template>
        </Dialog>

        <!-- Delete Multiple Users Dialog -->
        <Dialog v-model:visible="deleteUsersDialog" :style="{ width: '450px' }" header="Confirmar" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="selectedUsers">¿Está seguro de que desea eliminar los usuarios seleccionados?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUsersDialog = false" />
                <Button label="Sí" icon="pi pi-check" @click="deleteSelectedUsers" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import { translateProfileStatus, getProfileStatusSeverity as getProfileStatusSev } from '@/utils/status-utils.js';

const toast = useToast();
const dt = ref();
const users = ref([]);
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const deleteUsersDialog = ref(false);
const user = ref({});
const selectedUsers = ref();
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);

const roles = ref([
    { label: 'Administrador', value: 'admin' },
    { label: 'Proveedor', value: 'supplier' },
    { label: 'Cliente', value: 'client' }
]);

const statuses = ref([
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
    { label: 'Suspendido', value: 'suspended' }
]);

const availablePermissions = ref([
    { key: 'manage_users', label: 'Gestionar usuarios' },
    { key: 'manage_tickets', label: 'Gestionar tickets' },
    { key: 'view_analytics', label: 'Ver analíticas' },
    { key: 'manage_suppliers', label: 'Gestionar proveedores' },
    { key: 'manage_assets', label: 'Gestionar activos' }
]);

function formatDate(date) {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRoleLabel(role) {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'supplier': return 'Proveedor';
        case 'client': return 'Cliente';
        default: return role;
    }
}

function getRoleSeverity(role) {
    switch (role) {
        case 'admin': return 'danger';
        case 'supplier': return 'warn';
        case 'client': return 'info';
        default: return 'secondary';
    }
}

function getRoleColor(role) {
    switch (role) {
        case 'admin': return '#ef4444'; // red-500
        case 'supplier': return '#f59e0b'; // amber-500
        case 'client': return '#3b82f6'; // blue-500
        default: return '#6b7280'; // gray-500
    }
}

function getOnboardingLabel(isComplete) {
    return isComplete ? 'Completo' : 'Pendiente';
}

const getProfileStatusLabel = translateProfileStatus;
const getProfileStatusSeverity = getProfileStatusSev;

function openNew() {
    user.value = {
        status: 'active',
        permissions: []
    };
    submitted.value = false;
    userDialog.value = true;
}

function hideDialog() {
    userDialog.value = false;
    submitted.value = false;
}

function saveUser() {
    submitted.value = true;

    if (user.value.username?.trim() && user.value.email?.trim() && user.value.role) {
        if (!user.value.id && !user.value.password?.trim()) {
            return; // Password required for new users
        }

        if (user.value.id) {
            // Update existing user
            const index = findIndexById(user.value.id);
            users.value[index] = { ...user.value, updatedAt: new Date() };
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Usuario actualizado exitosamente', life: 3000 });
        } else {
            // Create new user
            user.value.id = createId();
            user.value.createdAt = new Date();
            user.value.lastLogin = null;
            users.value.push({ ...user.value });
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Usuario creado exitosamente', life: 3000 });
        }

        userDialog.value = false;
        user.value = {};
    }
}

function editUser(userData) {
    user.value = { ...userData };
    userDialog.value = true;
}

function confirmDeleteUser(userData) {
    user.value = userData;
    deleteUserDialog.value = true;
}

function deleteUser() {
    users.value = users.value.filter(val => val.id !== user.value.id);
    deleteUserDialog.value = false;
    user.value = {};
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado exitosamente', life: 3000 });
}

function confirmDeleteSelected() {
    deleteUsersDialog.value = true;
}

function deleteSelectedUsers() {
    users.value = users.value.filter(val => !selectedUsers.value.includes(val));
    deleteUsersDialog.value = false;
    selectedUsers.value = null;
    toast.add({ severity: 'success', summary: 'Eliminados', detail: 'Usuarios eliminados exitosamente', life: 3000 });
}

function exportCSV() {
    dt.value.exportCSV();
}

function findIndexById(id) {
    return users.value.findIndex(user => user.id === id);
}

function createId() {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Load all users from Supabase
const loadUsers = async () => {
    loading.value = true;
    try {
        console.log('Cargando todos los usuarios de la plataforma...');

        // First, get ALL users from the profiles table (this is the source of truth)
        const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        console.log(`Total profiles found: ${allProfiles?.length || 0}`);

        // Get all client profiles for enrichment
        const { data: clientProfiles, error: clientError } = await supabase
            .from('client_profiles')
            .select('user_id, company_name, onboarding_complete, status, phone_number');

        if (clientError) console.warn('Error loading client profiles:', clientError);

        // Get all supplier profiles for enrichment
        const { data: supplierProfiles, error: supplierError } = await supabase
            .from('supplier_profiles')
            .select('user_id, company_name, onboarding_complete, status, phone_number');

        if (supplierError) console.warn('Error loading supplier profiles:', supplierError);

        // Get all admin profiles for enrichment
        const { data: adminProfiles, error: adminError } = await supabase
            .from('admins')
            .select('user_id, status');

        if (adminError) console.warn('Error loading admin profiles:', adminError);

        // Create lookup maps for quick access
        const clientMap = new Map((clientProfiles || []).map(p => [p.user_id, p]));
        const supplierMap = new Map((supplierProfiles || []).map(p => [p.user_id, p]));
        const adminMap = new Map((adminProfiles || []).map(p => [p.user_id, p]));

        // Combine all profiles into users array
        const combinedUsers = (allProfiles || []).map(profile => {
            const userId = profile.id;
            const role = profile.role;

            // Base user object
            const user = {
                id: userId,
                email: profile.email || 'Sin email',
                role: role,
                full_name: profile.full_name || 'Sin nombre',
                company_name: null,
                phone: profile.phone_number,
                onboarding_complete: false,
                profile_status: 'unknown',
                created_at: profile.created_at,
                last_sign_in_at: profile.last_sign_in_at,
                profile: profile
            };

            // Enrich with role-specific data
            if (role === 'client' && clientMap.has(userId)) {
                const clientProfile = clientMap.get(userId);
                user.company_name = clientProfile.company_name;
                user.onboarding_complete = clientProfile.onboarding_complete;
                user.profile_status = clientProfile.status;
                if (clientProfile.phone_number) user.phone = clientProfile.phone_number;
            } else if (role === 'supplier' && supplierMap.has(userId)) {
                const supplierProfile = supplierMap.get(userId);
                user.company_name = supplierProfile.company_name;
                user.onboarding_complete = supplierProfile.onboarding_complete;
                user.profile_status = supplierProfile.status;
                if (supplierProfile.phone_number) user.phone = supplierProfile.phone_number;
            } else if (role === 'admin' && adminMap.has(userId)) {
                const adminProfile = adminMap.get(userId);
                user.onboarding_complete = true;
                user.profile_status = adminProfile.status || 'active';
            }

            return user;
        });

        users.value = combinedUsers;

        console.log('Usuarios cargados y combinados exitosamente');
        console.log('Desglose por rol:', {
            admins: combinedUsers.filter(u => u.role === 'admin').length,
            clients: combinedUsers.filter(u => u.role === 'client').length,
            suppliers: combinedUsers.filter(u => u.role === 'supplier').length,
            total: combinedUsers.length
        });

    } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los usuarios',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const router = useRouter();

async function viewUser(userData) {
    if (userData.role === 'client') {
        // Try to get client_id from profile
        const clientId = userData.profile?.client_id;
        
        if (clientId) {
             router.push(`/admin/clients/${clientId}`);
        } else {
            // Fallback: try to fetch client by user_id
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('user_id', userData.id)
                    .single();
                
                if (data) {
                    router.push(`/admin/clients/${data.id}`);
                } else {
                    toast.add({ severity: 'warn', summary: 'Info', detail: 'No se encontró una empresa asociada a este usuario', life: 3000 });
                }
            } catch (e) {
                console.error(e);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar empresa del cliente', life: 3000 });
            }
        }
    } else if (userData.role === 'supplier') {
         // Navigate to Supplier Detail using user_id
         router.push(`/admin/suppliers/${userData.id}`);
    } else {
        toast.add({
            severity: 'info',
            summary: 'Detalles',
            detail: `Ver detalles de ${userData.full_name}`,
            life: 2000
        });
    }
}

const suspendUserDialog = ref(false);
const userToSuspend = ref(null);

function confirmSuspendUser(userData) {
    userToSuspend.value = userData;
    suspendUserDialog.value = true;
}

async function suspendUser() {
    if (!userToSuspend.value) return;
    
    try {
        const user = userToSuspend.value;
        let table = '';
        
        if (user.role === 'client') table = 'client_profiles';
        else if (user.role === 'supplier') table = 'supplier_profiles';
        else {
             toast.add({ severity: 'warn', summary: 'Aviso', detail: 'No se puede suspender este tipo de usuario', life: 3000 });
             return;
        }

        const { error } = await supabase
            .from(table)
            .update({ status: 'suspended' })
            .eq('user_id', user.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Suspendido', detail: 'Usuario suspendido exitosamente', life: 3000 });
        await loadUsers();
        suspendUserDialog.value = false;
        userToSuspend.value = null;
    } catch (error) {
        console.error('Error suspending user:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al suspender usuario', life: 3000 });
    }
}

onMounted(() => {
    loadUsers();
});
</script>

<style scoped>
</style>