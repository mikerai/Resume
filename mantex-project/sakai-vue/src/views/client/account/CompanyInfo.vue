<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { supabase } from '@/lib/supabaseClient';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';

const fiscalRegimes = [
    { label: '601 - General de Ley Personas Morales', value: '601' },
    { label: '603 - Personas Morales con Fines no Lucrativos', value: '603' },
    { label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios', value: '605' },
    { label: '606 - Arrendamiento', value: '606' },
    { label: '608 - Demás ingresos', value: '608' },
    { label: '612 - Personas Físicas con Actividades Empresariales y Profesionales', value: '612' },
    { label: '621 - Incorporación Fiscal', value: '621' },
    { label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', value: '625' },
    { label: '626 - Régimen Simplificado de Confianza', value: '626' }
];

const toast = useToast();
const { user } = useAuth();

const company = ref(null);
const loading = ref(true);
const editDialog = ref(false);
const saving = ref(false);

const formData = ref({
    company_name: '',
    legal_name: '',
    tax_id: '',
    fiscal_regime: ''
});

const loadCompanyData = async () => {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        company.value = data;
    } catch (error) {
        console.error('Error loading company:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar información de la empresa', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const openEditDialog = () => {
    formData.value = {
        company_name: company.value?.company_name || '',
        legal_name: company.value?.legal_name || '',
        tax_id: company.value?.tax_id || '',
        fiscal_regime: company.value?.fiscal_regime || ''
    };
    editDialog.value = true;
};

const saveCompany = async () => {
    saving.value = true;
    try {
        const { error } = await supabase
            .from('clients')
            .update({
                company_name: formData.value.company_name,
                legal_name: formData.value.legal_name,
                tax_id: formData.value.tax_id,
                fiscal_regime: formData.value.fiscal_regime,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Información actualizada correctamente', life: 3000 });
        await loadCompanyData();
        editDialog.value = false;
    } catch (error) {
        console.error('Error saving company:', error);
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
        <div class="flex justify-content-between align-items-center mb-4">
            <h5 class="m-0">Información de la Empresa</h5>
            <Button label="Editar" icon="pi pi-pencil" @click="openEditDialog" :disabled="loading" />
        </div>

        <div v-if="loading" class="text-center p-5">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="company" class="grid-cols-12 gap-2">
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Nombre Comercial</label>
                    <p class="m-0 mt-2">{{ company.company_name || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Razón Social</label>
                    <p class="m-0 mt-2">{{ company.legal_name || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">RFC</label>
                    <p class="m-0 mt-2">{{ company.tax_id || 'No especificado' }}</p>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Régimen Fiscal</label>
                    <p class="m-0 mt-2">{{ company.fiscal_regime || 'No especificado' }}</p>
                </div>
            </div>
        </div>

        <Dialog v-model:visible="editDialog" modal header="Editar Información de Empresa" :style="{ width: '600px' }">
            <div class="grid-cols-12 gap-2">
                <div class="col-12">
                    <div class="field">
                        <label for="company_name" class="font-medium">Nombre Comercial *</label>
                        <InputText id="company_name" v-model="formData.company_name" class="w-full" />
                    </div>
                </div>
                <div class="col-12">
                    <div class="field">
                        <label for="legal_name" class="font-medium">Razón Social</label>
                        <InputText id="legal_name" v-model="formData.legal_name" class="w-full" />
                    </div>
                </div>
                <div class="col-12">
                    <div class="field">
                        <label for="tax_id" class="font-medium">RFC</label>
                        <InputText id="tax_id" v-model="formData.tax_id" class="w-full" maxlength="13" />
                    </div>
                </div>
                <div class="col-12">
                    <div class="field">
                        <label for="fiscal_regime" class="font-medium">Régimen Fiscal</label>
                        <Dropdown
                            id="fiscal_regime"
                            v-model="formData.fiscal_regime"
                            :options="fiscalRegimes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccione un régimen"
                            class="w-full"
                            filter
                        />
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
