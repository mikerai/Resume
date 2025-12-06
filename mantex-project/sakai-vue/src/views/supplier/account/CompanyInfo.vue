<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const toast = useToast();
const { user } = useAuth();

const company = ref(null);
const loading = ref(true);
const editDialog = ref(false);
const saving = ref(false);

const formData = ref({
    company_name: '',
    rfc: '',
    contact_person: '',
    phone_number: '',
    email: '',
    business_description: ''
});

const loadCompanyData = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('supplier_profiles')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        company.value = data;
    } catch (error) {
        console.error('Error loading supplier company:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar información de la empresa', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const openEditDialog = () => {
    formData.value = {
        company_name: company.value?.company_name || '',
        rfc: company.value?.rfc || '',
        contact_person: company.value?.contact_person || '',
        phone_number: company.value?.phone_number || '',
        email: company.value?.email || '',
        business_description: company.value?.business_description || ''
    };
    editDialog.value = true;
};

const saveCompany = async () => {
    saving.value = true;
    try {
        const { error } = await supabase
            .from('supplier_profiles')
            .update({
                company_name: formData.value.company_name,
                rfc: formData.value.rfc,
                contact_person: formData.value.contact_person,
                phone_number: formData.value.phone_number,
                email: formData.value.email,
                business_description: formData.value.business_description,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Información actualizada correctamente', life: 3000 });
        await loadCompanyData();
        editDialog.value = false;
    } catch (error) {
        console.error('Error saving supplier company:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la información', life: 3000 });
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    loadCompanyData();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h5 class="m-0">Información de la Empresa</h5>
            <Button label="Editar" icon="pi pi-pencil" @click="openEditDialog" :disabled="loading" />
        </div>

        <div v-if="loading" class="text-center p-5">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="company" class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Nombre Comercial</label>
                    <p class="m-0 mt-2">{{ company.company_name || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">RFC</label>
                    <p class="m-0 mt-2">{{ company.rfc || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Persona de Contacto</label>
                    <p class="m-0 mt-2">{{ company.contact_person || 'No especificado' }}</p>
                </div>
            </div>
             <div class="col-span-12 md:col-span-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Teléfono</label>
                    <p class="m-0 mt-2">{{ company.phone_number || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-span-12">
                <div class="field">
                    <label class="font-medium text-sm text-500">Descripción</label>
                    <p class="m-0 mt-2">{{ company.business_description || 'No especificada' }}</p>
                </div>
            </div>
        </div>

        <Dialog v-model:visible="editDialog" modal header="Editar Información de Empresa" :style="{ width: '600px' }">
            <div class="grid grid-cols-12 gap-2">
                <div class="col-span-12">
                    <div class="field">
                        <label for="company_name" class="font-medium">Nombre Comercial *</label>
                        <InputText id="company_name" v-model="formData.company_name" class="w-full" />
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="field">
                        <label for="rfc" class="font-medium">RFC *</label>
                        <InputText id="rfc" v-model="formData.rfc" class="w-full" maxlength="13" />
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="contact_person" class="font-medium">Persona de Contacto</label>
                        <InputText id="contact_person" v-model="formData.contact_person" class="w-full" />
                    </div>
                </div>
                 <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="phone_number" class="font-medium">Teléfono</label>
                        <InputText id="phone_number" v-model="formData.phone_number" class="w-full" />
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="field">
                        <label for="business_description" class="font-medium">Descripción del Negocio</label>
                        <Textarea id="business_description" v-model="formData.business_description" rows="3" class="w-full" />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" severity="danger" text @click="editDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="saveCompany" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>
