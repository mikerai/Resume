<template>
    <div class="grid-cols-10 gap-2">
        <div class="col-12">
            <div class="card">
                <h5>Validación de Proveedores</h5>
                <p class="text-color-secondary">Busca y verifica la identidad de los técnicos asignados a tus servicios.
                </p>

                <!-- Search Form -->
                <div class="flex flex-column md:flex-row gap-3 mt-4">
                    <span class="p-input-icon-left flex-grow-1">
                        <i class="pi pi-search" />
                        <InputText v-model="searchQuery" placeholder="Buscar por ID, Email o Nombre..." class="w-full"
                            @keyup.enter="searchProvider" />
                    </span>
                    <Button label="Buscar" icon="pi pi-search" :loading="loading" @click="searchProvider" />
                </div>

                <!-- Results -->
                <div v-if="hasSearched" class="mt-5">
                    <div v-if="providers.length > 0">
                        <h6 class="mb-3">Resultados Encontrados ({{ providers.length }})</h6>
                        <div class="grid">
                            <div class="col-12 md:col-6 lg:col-4" v-for="provider in providers" :key="provider.id">
                                <div class="surface-card p-4 shadow-2 border-round h-full">
                                    <div class="flex align-items-center mb-3">
                                        <Avatar :image="provider.photo_url || '/layout/images/default-avatar.png'"
                                            size="large" shape="circle" class="mr-3" />
                                        <div>
                                            <div class="text-900 font-medium text-xl">{{ provider.full_name }}</div>
                                            <div class="text-500">{{ provider.company_name }}</div>
                                        </div>
                                    </div>

                                    <div class="flex align-items-center justify-content-between mb-3">
                                        <span class="text-500">ID Público</span>
                                        <span class="font-bold">{{ provider.public_id }}</span>
                                    </div>

                                    <div class="flex align-items-center justify-content-between">
                                        <span class="text-500">Estatus</span>
                                        <Tag severity="success" value="Activo"></Tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center p-5">
                        <i class="pi pi-search text-500 text-5xl mb-3"></i>
                        <div class="text-900 text-xl font-medium mb-2">No se encontraron resultados</div>
                        <p class="text-500">Verifique los datos ingresados e intente nuevamente.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from 'primevue/usetoast';
import { useS3Upload } from '@/composables/useS3Upload';

const toast = useToast();
const { getSignedUrl } = useS3Upload();
const searchQuery = ref('');
const loading = ref(false);
const hasSearched = ref(false);
const providers = ref([]);

const searchProvider = async () => {
    if (!searchQuery.value.trim()) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un término de búsqueda', life: 3000 });
        return;
    }

    loading.value = true;
    hasSearched.value = false;
    providers.value = [];

    try {
        console.log('Searching provider with query:', searchQuery.value);
        const { data, error } = await supabase.rpc('search_provider_secure', { p_query: searchQuery.value });

        if (error) {
            console.error('Supabase RPC Error:', error);
            throw error;
        }

        if (data && data.found) {
            // Process avatars to get signed URLs
            const providersWithSignedUrls = await Promise.all(
                data.providers.map(async (provider) => {
                    let signedPhotoUrl = null;

                    if (provider.photo_url) {
                        try {
                            signedPhotoUrl = await getSignedUrl(provider.photo_url);
                        } catch (e) {
                            console.error('Error getting signed URL for avatar:', e);
                        }
                    }

                    return {
                        ...provider,
                        photo_url: signedPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.full_name || 'User')}`
                    };
                })
            );

            providers.value = providersWithSignedUrls;
        }
        hasSearched.value = true;

    } catch (e) {
        console.error('Search error details:', e);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo realizar la búsqueda. ' + (e.message || ''), life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>
