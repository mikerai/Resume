<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import ContactPersonForm from './components/ContactPersonForm.vue';

const toast = useToast();
const { user } = useAuth();

const contactPersons = ref([]);
const loading = ref(true);
const personDialog = ref(false);
const saving = ref(false);
const selectedPerson = ref(null);
const clientId = ref(null);

const formData = ref({
    first_name: '',
    last_name_paternal: '',
    last_name_maternal: '',
    phone: '',
    email: '',
    is_primary: false
});

const loadClientId = async () => {
    try {
        const { data, error } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        clientId.value = data.id;
    } catch (error) {
        console.error('Error loading client ID:', error);
    }
};

const loadContactPersons = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('contact_persons')
            .select(`
                *,
                client_branches!fk_contact_person(count)
            `)
            .eq('client_id', clientId.value)
            .order('is_primary', { ascending: false })
            .order('first_name');

        if (error) throw error;
        contactPersons.value = data || [];
    } catch (error) {
        console.error('Error loading contact persons:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las personas de contacto', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const openNewPerson = () => {
    selectedPerson.value = null;
    formData.value = {
        first_name: '',
        last_name_paternal: '',
        last_name_maternal: '',
        phone: '',
        email: '',
        is_primary: false
    };
    personDialog.value = true;
};

const editPerson = (person) => {
    selectedPerson.value = person;
    formData.value = {
        first_name: person.first_name,
        last_name_paternal: person.last_name_paternal,
        last_name_maternal: person.last_name_maternal || '',
        phone: person.phone,
        email: person.email,
        is_primary: person.is_primary
    };
    personDialog.value = true;
};

const savePerson = async () => {
    if (!formData.value.first_name || !formData.value.last_name_paternal || !formData.value.phone || !formData.value.email) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        const personData = {
            client_id: clientId.value,
            first_name: formData.value.first_name,
            last_name_paternal: formData.value.last_name_paternal,
            last_name_maternal: formData.value.last_name_maternal || null,
            phone: formData.value.phone,
            email: formData.value.email,
            is_primary: formData.value.is_primary,
            updated_at: new Date().toISOString()
        };

        let error;
        if (selectedPerson.value) {
            // Update
            ({ error } = await supabase
                .from('contact_persons')
                .update(personData)
                .eq('id', selectedPerson.value.id));
        } else {
            // Insert
            ({ error } = await supabase
                .from('contact_persons')
                .insert(personData));
        }

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Persona de contacto guardada', life: 3000 });
        await loadContactPersons();
        personDialog.value = false;
    } catch (error) {
        console.error('Error saving contact person:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const deletePerson = async (person) => {
    // Check if person is assigned to branches
    const { data: branchCount } = await supabase
        .from('client_branches')
        .select('id', { count: 'exact', head: true })
        .eq('contact_person_id', person.id);

    if (branchCount && branchCount.length > 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'No se puede eliminar', 
            detail: 'Esta persona está asignada a una o más sucursales', 
            life: 4000 
        });
        return;
    }

    if (!confirm(`¿Eliminar a ${person.first_name} ${person.last_name_paternal}?`)) return;

    try {
        const { error } = await supabase
            .from('contact_persons')
            .delete()
            .eq('id', person.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Persona de contacto eliminada', life: 3000 });
        await loadContactPersons();
    } catch (error) {
        console.error('Error deleting contact person:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

const getFullName = (person) => {
    let name = `${person.first_name} ${person.last_name_paternal}`;
    if (person.last_name_maternal) {
        name += ` ${person.last_name_maternal}`;
    }
    return name;
};

onMounted(async () => {
    await loadClientId();
    if (clientId.value) {
        await loadContactPersons();
    }
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h5 class="m-0">Personas de Contacto</h5>
            <Button label="Agregar Persona" icon="pi pi-plus" @click="openNewPerson" />
        </div>

        <DataTable :value="contactPersons" :loading="loading" responsiveLayout="scroll">
            <Column header="Nombre" sortable>
                <template #body="slotProps">
                    <div>
                        <div class="font-medium">{{ getFullName(slotProps.data) }}</div>
                        <Tag v-if="slotProps.data.is_primary" value="Principal" severity="info" class="mt-1" />
                    </div>
                </template>
            </Column>
            <Column field="phone" header="Teléfono" sortable />
            <Column field="email" header="Email" sortable />
            <Column header="Sucursales Asignadas">
                <template #body="slotProps">
                    {{ slotProps.data.client_branches?.[0]?.count || 0 }}
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="editPerson(slotProps.data)" v-tooltip="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deletePerson(slotProps.data)" v-tooltip="'Eliminar'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-4 text-500">
                    No hay personas de contacto registradas
                </div>
            </template>
        </DataTable>

        <Dialog v-model:visible="personDialog" modal header="Persona de Contacto" :style="{ width: '600px' }">
            <ContactPersonForm v-model="formData" />

            <template #footer>
                <Button label="Cancelar" severity="danger" icon="pi pi-times" text @click="personDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="savePerson" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>
