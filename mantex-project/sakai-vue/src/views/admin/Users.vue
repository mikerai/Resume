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

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="username" header="Usuario" sortable style="min-width: 14rem"></Column>
                <Column field="email" header="Email" sortable style="min-width: 16rem"></Column>
                <Column field="role" header="Rol" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.role" :severity="getRoleSeverity(slotProps.data.role)" />
                    </template>
                </Column>
                <Column field="status" header="Estado" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column field="lastLogin" header="Último acceso" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="text-sm">{{ formatDate(slotProps.data.lastLogin) }}</div>
                    </template>
                </Column>
                <Column field="createdAt" header="Creado" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <div class="text-sm">{{ formatDate(slotProps.data.createdAt) }}</div>
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="editUser(slotProps.data)" class="mr-2" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteUser(slotProps.data)" />
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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

function getRoleSeverity(role) {
    switch (role) {
        case 'admin': return 'danger';
        case 'supplier': return 'warn';
        case 'client': return 'info';
        default: return 'secondary';
    }
}

function getStatusSeverity(status) {
    switch (status) {
        case 'active': return 'success';
        case 'inactive': return 'warn';
        case 'suspended': return 'danger';
        default: return 'info';
    }
}

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

// Load mock data
const loadMockData = () => {
    const mockUsers = [
        {
            id: 'USR001',
            username: 'admin',
            email: 'admin@mantex.com',
            role: 'admin',
            status: 'active',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            lastLogin: new Date('2024-01-15T14:30:00Z'),
            permissions: ['manage_users', 'manage_tickets', 'view_analytics', 'manage_suppliers', 'manage_assets']
        },
        {
            id: 'USR002',
            username: 'juanperez',
            email: 'juan.perez@email.com',
            role: 'supplier',
            status: 'active',
            createdAt: new Date('2024-01-10T08:15:00Z'),
            lastLogin: new Date('2024-01-14T16:45:00Z'),
            permissions: ['manage_tickets']
        },
        {
            id: 'USR003',
            username: 'mariagarcia',
            email: 'maria.garcia@empresa.com',
            role: 'client',
            status: 'active',
            createdAt: new Date('2024-01-12T11:30:00Z'),
            lastLogin: new Date('2024-01-13T09:20:00Z'),
            permissions: ['view_analytics']
        },
        {
            id: 'USR004',
            username: 'carloslopez',
            email: 'carlos.lopez@email.com',
            role: 'supplier',
            status: 'inactive',
            createdAt: new Date('2024-01-05T15:20:00Z'),
            lastLogin: new Date('2024-01-10T12:15:00Z'),
            permissions: []
        }
    ];
    users.value = mockUsers;
};

onMounted(() => {
    loadMockData();
});
</script>

<style scoped>
</style>