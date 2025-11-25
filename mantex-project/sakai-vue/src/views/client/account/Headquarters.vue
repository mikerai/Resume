<script setup>
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '@/composables/useAuth';
import { useS3Upload } from '@/composables/useS3Upload';
import { supabase } from '@/lib/supabaseClient';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import AddressForm from './components/AddressForm.vue';

const toast = useToast();
const { user } = useAuth();
const { uploadFileToS3, getSignedUrl, isUploading } = useS3Upload();

const headquarters = ref(null);
const loading = ref(true);
const editDialog = ref(false);
const saving = ref(false);
const clientId = ref(null);

const formData = ref({
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

const headquartersPictureUrl = ref(null);

// Generar URL firmada cuando se carga el headquarters
watch(headquarters, async (newVal) => {
    if (newVal?.hq_picture) {
        headquartersPictureUrl.value = await getSignedUrl(newVal.hq_picture);
    }
}, { immediate: true });

const loadClientId = async () => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, hq_street, hq_number, hq_apt, hq_neighborhood, hq_municipality_city, hq_state, hq_postal_code, hq_picture, hq_additional_pictures, hq_layout')
            .eq('user_id', user.value.id)
            .single();

        if (error) throw error;
        clientId.value = data.id;
        headquarters.value = data;
    } catch (error) {
        console.error('Error loading headquarters:', error);
    } finally {
        loading.value = false;
    }
};

const openEditDialog = () => {
    formData.value = {
        street: headquarters.value?.hq_street || '',
        number: headquarters.value?.hq_number || '',
        apt: headquarters.value?.hq_apt || '',
        neighborhood: headquarters.value?.hq_neighborhood || '',
        municipality_city: headquarters.value?.hq_municipality_city || '',
        state: headquarters.value?.hq_state || '',
        postal_code: headquarters.value?.hq_postal_code || '',
        picture: null, // Reset file inputs
        additional_pictures: [],
        layout: null
    };
    editDialog.value = true;
};

const saveHeadquarters = async () => {
    saving.value = true;
    try {
        // 1. Upload files to S3 if present
        let pictureKey = headquarters.value?.hq_picture;
        let layoutKey = headquarters.value?.hq_layout;
        let additionalKeys = headquarters.value?.hq_additional_pictures || [];

        const username = user.value.email.split('@')[0];

        // Upload Facade Picture
        if (formData.value.picture instanceof File) {
            const result = await uploadFileToS3(formData.value.picture, username, 'infrastructure/headquarters');
            pictureKey = result.s3_key;
        }

        // Upload Layout
        if (formData.value.layout instanceof File) {
            const result = await uploadFileToS3(formData.value.layout, username, 'infrastructure/headquarters');
            layoutKey = result.s3_key;
        }

        // Upload Additional Pictures
        if (formData.value.additional_pictures && formData.value.additional_pictures.length > 0) {
            for (const file of formData.value.additional_pictures) {
                if (file instanceof File) {
                    const result = await uploadFileToS3(file, username, 'infrastructure/headquarters');
                    additionalKeys.push(result.s3_key);
                }
            }
        }

        // 2. Update Database
        const { error } = await supabase
            .from('clients')
            .update({
                hq_street: formData.value.street,
                hq_number: formData.value.number,
                hq_apt: formData.value.apt,
                hq_neighborhood: formData.value.neighborhood,
                hq_municipality_city: formData.value.municipality_city,
                hq_state: formData.value.state,
                hq_postal_code: formData.value.postal_code,
                hq_picture: pictureKey,
                hq_additional_pictures: additionalKeys,
                hq_layout: layoutKey,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.value.id);

        if (error) throw error;

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Oficina central actualizada', life: 3000 });
        await loadClientId();
        editDialog.value = false;
    } catch (error) {
        console.error('Error saving headquarters:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const hasAddress = (hq) => {
    return hq && hq.hq_street && hq.hq_number && hq.hq_neighborhood;
};

onMounted(() => {
    loadClientId();
});
</script>

<template>
    <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
            <h5 class="m-0">Oficina Central</h5>
            <Button label="Editar" icon="pi pi-pencil" @click="openEditDialog" :disabled="loading" />
        </div>

        <div v-if="loading" class="text-center p-5">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="hasAddress(headquarters)" class="grid-cols-12 gap-2">
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Dirección</label>
                    <p class="m-0 mt-2">
                        {{ headquarters.hq_street }} {{ headquarters.hq_number }}
                        <span v-if="headquarters.hq_apt">, Int. {{ headquarters.hq_apt }}</span>
                    </p>
                    <p class="m-0 text-500">{{ headquarters.hq_neighborhood }}</p>
                </div>
            </div>
            <div class="col-12 md:col-6">
                <div class="field">
                    <label class="font-medium text-sm text-500">Ciudad y Estado</label>
                    <p class="m-0 mt-2">{{ headquarters.hq_municipality_city }}, {{ headquarters.hq_state }}</p>
                    <p class="m-0 text-500">CP: {{ headquarters.hq_postal_code }}</p>
                </div>
            </div>
            
            <div class="col-12 mt-3" v-if="headquartersPictureUrl">
                <div class="field">
                    <label class="font-medium text-sm text-500">Fachada</label>
                    <div class="mt-2">
                        <img 
                            :src="headquartersPictureUrl" 
                            alt="Fachada de oficina central" 
                            class="w-full max-w-30rem border-round"
                            style="max-height: 300px; object-fit: cover;"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="text-center p-5 text-500">
            <i class="pi pi-building text-4xl mb-3 block"></i>
            <p>No hay dirección de oficina central configurada</p>
            <Button label="Configurar Ahora" severity="secondary" @click="openEditDialog" />
        </div>

        <Dialog v-model:visible="editDialog" modal header="Oficina Central" :style="{ width: '800px' }">
            <AddressForm v-model="formData" />

            <template #footer>
                <Button label="Cancelar" severity="danger" icon="pi pi-times" text @click="editDialog = false" />
                <Button label="Guardar" icon="pi pi-check" @click="saveHeadquarters" :loading="saving || isUploading" />
            </template>
        </Dialog>
    </div>
</template>

