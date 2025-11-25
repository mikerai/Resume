```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext'; // Added back InputText
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox'; // Added Checkbox
import AddressForm from './components/AddressForm.vue';

const toast = useToast();
const { user } = useAuth();
const { uploadFileToS3, isUploading } = useS3Upload();

const branches = ref([]);
const contactPersons = ref([]);
const loading = ref(true);
const branchDialog = ref(false);
const saving = ref(false);
const selectedBranch = ref(null);
const clientId = ref(null);

const formData = ref({
    name: '',
    is_headquarters: false,
    contact_person_id: null,
    street: '',
    number: '',
    apt: '',
    neighborhood: '',
    municipality_city: '',
    state: '',
    postal_code: '',
    picture: null,
    additional_pictures: [],
    layout: null
});

const loadClientId = async () => {
    try {
        const { data, error } = await supabase
            .from('clients')
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
    try {
        const { data, error } = await supabase
            .from('contact_persons')
            .select('id, first_name, last_name_paternal, last_name_maternal')
            .eq('client_id', clientId.value)
            .order('first_name');

        if (error) throw error;
        contactPersons.value = data.map(p => ({
            ...p,
            fullName: `${p.first_name} ${p.last_name_paternal} ${p.last_name_maternal || ''}`.trim()
        }));
    } catch (error) {
        console.error('Error loading contact persons:', error);
    }
};

const loadBranches = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('client_branches')
            .select(`
                *,
                contact_person:contact_persons!fk_contact_person(first_name, last_name_paternal)
            `)
            .eq('client_id', clientId.value)
            .order('is_headquarters', { ascending: false })
            .order('name');

        if (error) throw error;
        branches.value = data || [];
    } catch (error) {
        console.error('Error loading branches:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las sucursales', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const openNewBranch = () => {
    selectedBranch.value = null;
    formData.value = {
        name: '',
        is_headquarters: false,
        contact_person_id: null,
        street: '',
        number: '',
        apt: '',
        neighborhood: '',
        municipality_city: '',
        state: '',
        postal_code: '',
        picture: null,
        additional_pictures: [],
        layout: null
    };
    branchDialog.value = true;
};

const editBranch = (branch) => {
    selectedBranch.value = branch;
    formData.value = {
        name: branch.name,
        is_headquarters: branch.is_headquarters,
        contact_person_id: branch.contact_person_id,
        street: branch.street,
        number: branch.number,
        apt: branch.apt || '',
        neighborhood: branch.neighborhood,
        municipality_city: branch.municipality_city,
        state: branch.state,
        postal_code: branch.postal_code,
        picture: branch.picture, // Keep existing key
        additional_pictures: branch.additional_pictures || [],
        layout: branch.layout
    };
    branchDialog.value = true;
};

const saveBranch = async () => {
    if (!formData.value.name || !formData.value.street || !formData.value.contact_person_id) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        const username = user.value.email.split('@')[0];
        let pictureKey = formData.value.picture;
        let layoutKey = formData.value.layout;
        let additionalKeys = formData.value.additional_pictures || [];

        // Upload Facade Picture
        if (formData.value.picture instanceof File) {
            const result = await uploadFileToS3(formData.value.picture, username, 'infrastructure/branches');
            pictureKey = result.s3_key;
        }

        // Upload Layout
        if (formData.value.layout instanceof File) {
            const result = await uploadFileToS3(formData.value.layout, username, 'infrastructure/branches');
            layoutKey = result.s3_key;
        }

        // Upload Additional Pictures
        if (formData.value.additional_pictures && formData.value.additional_pictures.length > 0) {
             // Filter out strings (existing keys) and upload only Files
             const newFiles = formData.value.additional_pictures.filter(f => f instanceof File);
             const existingKeys = formData.value.additional_pictures.filter(f => typeof f === 'string');
             
             additionalKeys = [...existingKeys];

             for (const file of newFiles) {
                const result = await uploadFileToS3(file, username, 'infrastructure/branches');
                additionalKeys.push(result.s3_key);
            }
        }

        const branchData = {
            client_id: clientId.value,
            name: formData.value.name,
            is_headquarters: formData.value.is_headquarters,
            contact_person_id: formData.value.contact_person_id,
            street: formData.value.street,
            number: formData.value.number,
            apt: formData.value.apt || null,
            neighborhood: formData.value.neighborhood,
            municipality_city: formData.value.municipality_city,
            state: formData.value.state,
            postal_code: formData.value.postal_code,
            picture: pictureKey,
            additional_pictures: additionalKeys,
            layout: layoutKey,
            updated_at: new Date().toISOString()
        };

        let error;
        if (selectedBranch.value) {
            // Update
            ({ error } = await supabase
                .from('client_branches')
                .update(branchData)
                .eq('id', selectedBranch.value.id));
        } else {
            // Insert
            ({ error } = await supabase
                .from('client_branches')
                .insert(branchData));
        }

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sucursal guardada correctamente', life: 3000 });
        await loadBranches();
        branchDialog.value = false;
    } catch (error) {
        console.error('Error saving branch:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la sucursal', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const deleteBranch = async (branch) => {
    if (!confirm(`¿Eliminar la sucursal ${branch.name}?`)) return;

    try {
        const { error } = await supabase
            .from('client_branches')
            .delete()
            .eq('id', branch.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sucursal eliminada', life: 3000 });
        await loadBranches();
    } catch (error) {
        console.error('Error deleting branch:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

onMounted(async () => {
    await loadClientId();
    if (clientId.value) {
        await Promise.all([loadBranches(), loadContactPersons()]);
    }
});
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h5 class="m-0">Sucursales</h5>
            <Button label="Agregar Sucursal" icon="pi pi-plus" @click="openNewBranch" />
        </div>

        <DataTable :value="branches" :loading="loading" responsiveLayout="scroll">
            <Column field="name" header="Nombre" sortable>
                <template #body="slotProps">
                    <div>
                        <div class="font-medium">{{ slotProps.data.name }}</div>
                        <Tag v-if="slotProps.data.is_headquarters" value="Oficina Central" severity="warning" class="mt-1" />
                    </div>
                </template>
            </Column>
            <Column header="Dirección">
                <template #body="slotProps">
                    <div>{{ slotProps.data.street }} {{ slotProps.data.number }}</div>
                    <div class="text-sm text-500">{{ slotProps.data.neighborhood }}, {{ slotProps.data.municipality_city }}</div>
                </template>
            </Column>
            <Column header="Contacto">
                <template #body="slotProps">
                    <div v-if="slotProps.data.contact_person">
                        {{ slotProps.data.contact_person.first_name }} {{ slotProps.data.contact_person.last_name_paternal }}
                    </div>
                    <span v-else class="text-500 font-italic">No asignado</span>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" severity="info" text rounded @click="editBranch(slotProps.data)" v-tooltip="'Editar'" />
                        <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteBranch(slotProps.data)" v-tooltip="'Eliminar'" />
                    </div>
                </template>
            </Column>
            <template #empty>
                <div class="text-center p-4 text-500">
                    No hay sucursales registradas
                </div>
            </template>
        </DataTable>

        <Dialog v-model:visible="branchDialog" modal header="Detalles de Sucursal" :style="{ width: '800px' }">
            <div class="grid-cols-12 gap-2">
                <div class="col-12 md:col-8">
                    <div class="field">
                        <label for="name" class="font-medium">Nombre de Sucursal *</label>
                        <InputText id="name" v-model="formData.name" class="w-full" required />
                    </div>
                </div>
                <div class="col-12 md:col-4">
                    <div class="field-checkbox mt-4">
                        <Checkbox id="is_headquarters" v-model="formData.is_headquarters" :binary="true" />
                        <label for="is_headquarters" class="ml-2">Es Oficina Central</label>
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="field">
                        <label for="contact" class="font-medium">Persona de Contacto *</label>
                        <Dropdown 
                            id="contact" 
                            v-model="formData.contact_person_id" 
                            :options="contactPersons" 
                            optionLabel="fullName" 
                            optionValue="id" 
                            placeholder="Seleccionar contacto" 
                            class="w-full" 
                            filter
                        />
                    </div>
                </div>

                <div class="col-12">
                    <AddressForm v-model="formData" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="danger" icon="pi pi-times" text @click="branchDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="saveBranch" :loading="saving || isUploading" />
            </template>
        </Dialog>
    </div>
</template>
```
