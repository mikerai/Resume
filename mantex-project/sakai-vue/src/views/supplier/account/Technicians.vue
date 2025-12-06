<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import TechnicianForm from './components/TechnicianForm.vue';

const toast = useToast();
const { user } = useAuth();

const technicians = ref([]);
const loading = ref(true);
const technicianDialog = ref(false);
const saving = ref(false);
const selectedTechnician = ref(null);
const supplierId = ref(null);

const formData = ref({
    first_name: '',
    last_name: '',
    email: ''
});

const loadSupplierId = async () => {
    try {
        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        supplierId.value = data.id;
    } catch (error) {
        console.error('Error loading supplier ID:', error);
    }
};

const loadTechnicians = async () => {
    if (!supplierId.value) return;

    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('supplier_team_members')
            .select('*')
            .eq('supplier_id', supplierId.value)
            .order('created_at', { ascending: false });

        if (error) throw error;
        technicians.value = data || [];
    } catch (error) {
        console.error('Error loading technicians:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los técnicos', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const openNewTechnician = () => {
    selectedTechnician.value = null;
    formData.value = {
        first_name: '',
        last_name: '',
        email: ''
    };
    technicianDialog.value = true;
};

const editTechnician = (tech) => {
    selectedTechnician.value = tech;
    formData.value = {
        first_name: tech.first_name || '',
        last_name: tech.last_name || '',
        email: tech.email || ''
    };
    // If technician is already active (user_id present), maybe we prevent editing email?
    // For now, let's allow editing basic info in the team table.
    technicianDialog.value = true;
};

const saveTechnician = async () => {
    if (!formData.value.first_name || !formData.value.last_name || !formData.value.email) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        const techData = {
            supplier_id: supplierId.value,
            first_name: formData.value.first_name,
            last_name: formData.value.last_name,
            email: formData.value.email,
            updated_at: new Date().toISOString()
        };

        let error;
        if (selectedTechnician.value) {
            // Update
            // If user is already linked (user_id not null), email change might be tricky for auth, 
            // but for team list it's fine. 
            // Ideally we check if user_id is null before allowing email change.
            if (selectedTechnician.value.user_id && selectedTechnician.value.email !== formData.value.email) {
                 toast.add({ severity: 'warn', summary: 'Atención', detail: 'No se puede cambiar el email de un usuario activo', life: 3000 });
                 saving.value = false;
                 return;
            }

            ({ error } = await supabase
                .from('supplier_team_members')
                .update(techData)
                .eq('id', selectedTechnician.value.id));
        } else {
            // Insert
            techData.status = 'invited';
            ({ error } = await supabase
                .from('supplier_team_members')
                .insert(techData));
        }

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Técnico guardado correctamente', life: 3000 });
        await loadTechnicians();
        technicianDialog.value = false;
    } catch (error) {
        console.error('Error saving technician:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const deleteTechnician = async (tech) => {
    if (!confirm(`¿Eliminar a ${tech.first_name} ${tech.last_name}?`)) return;

    try {
        const { error } = await supabase
            .from('supplier_team_members')
            .delete()
            .eq('id', tech.id);

        if (error) throw error;

        if (tech.user_id) {
             // Also unlink/deactivate user? Logic to implement later.
        }

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Técnico eliminado', life: 3000 });
        await loadTechnicians();
    } catch (error) {
        console.error('Error deleting technician:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

const getStatusLabel = (status) => {
    const labels = {
        'invited': 'Invitado',
        'active': 'Activo',
        'inactive': 'Inactivo',
        'suspended': 'Suspendido'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severities = {
        'invited': 'warn',
        'active': 'success',
        'inactive': 'secondary',
        'suspended': 'danger'
    };
    return severities[status] || 'info';
};

onMounted(async () => {
    await loadSupplierId();
    if (supplierId.value) {
        await loadTechnicians();
    }
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <div>
                <h5 class="m-0">Técnicos</h5>
                <p class="text-sm text-muted-color mt-1">Gestione el personal técnico que realizará los servicios</p>
            </div>
            <Button label="Agregar Técnico" icon="pi pi-plus" @click="openNewTechnician" />
        </div>

        <DataTable :value="technicians" :loading="loading" responsiveLayout="scroll">
            <Column header="Nombre" sortable field="first_name">
                <template #body="slotProps">
                    <div class="font-medium">{{ slotProps.data.first_name }} {{ slotProps.data.last_name }}</div>
                </template>
            </Column>
            <Column field="email" header="Email" sortable />
            <Column field="status" header="Estado" sortable>
                <template #body="slotProps">
                    <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
            </Column>
            <Column header="Fecha Registro">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.created_at).toLocaleDateString() }}
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="editTechnician(slotProps.data)" v-tooltip="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteTechnician(slotProps.data)" v-tooltip="'Eliminar'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-8 text-muted-color">
                    <i class="pi pi-users text-4xl mb-3"></i>
                    <p>No hay técnicos registrados</p>
                    <p class="text-sm">Agregue técnicos por su correo para invitarlos a la plataforma</p>
                </div>
            </template>
        </DataTable>

        <Dialog v-model:visible="technicianDialog" modal header="Datos del Técnico" :style="{ width: '500px' }">
            <TechnicianForm v-model="formData" />

            <template #footer>
                <Button label="Cancelar" severity="secondary" icon="pi pi-times" text @click="technicianDialog = false" />
                <Button label="Guardar e Invitar" icon="pi pi-check" @click="saveTechnician" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>
